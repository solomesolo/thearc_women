import "dotenv/config";
import { randomUUID } from "node:crypto";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TAXONOMY_LABELS } from "../content/taxonomy";
import { isCrediblePubmedSource } from "../content/credible-platforms";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/thearc";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type TaxonomyLabel = { slug: string; label: string; type: string };

const DEFAULT_TAG_SLUGS = [
  "cortisol",
  "ferritin",
  "insomnia",
  "waking-at-3am",
  "unrefreshing-sleep",
  "insulin-resistance",
  "prediabetes",
  "perimenopause",
  "menopause",
  "vitamin-d",
] as const;

function fetchHeaders(): Record<string, string> {
  return {
    "User-Agent": "thearc_women_scraper/1.0 (contact: admin@thearc.com)",
  };
}

async function fetchWithBackoff(url: URL, kind: string): Promise<Response> {
  const headers = fetchHeaders();
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
      const waitMs = 700 * Math.pow(2, attempt) + Math.floor(Math.random() * 350);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(`${kind} failed: ${res.status}`);
    return res;
  }
  throw new Error(`${kind} failed after retries`);
}

function buildPubmedQuery(label: TaxonomyLabel): string {
  const base = `"${label.label}"[Title/Abstract] OR "${label.slug.replace(
    /-/g,
    " "
  )}"[Title/Abstract]`;
  const female = `(female[MeSH Terms] OR women[Title/Abstract] OR woman's[Title/Abstract] OR women's[Title/Abstract])`;
  const recency = `("last 30 days"[PDat])`;
  const humansEnglish = `(humans[MeSH Terms]) AND (english[Language])`;
  return `(${base}) AND ${female} AND ${humansEnglish} AND ${recency}`;
}

async function pubmedESearch(query: string, retmax = 40): Promise<string[]> {
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "json");
  url.searchParams.set("sort", "pub date");
  url.searchParams.set("retmax", String(retmax));
  url.searchParams.set("term", query);
  if (process.env.NCBI_API_KEY) url.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const res = await fetchWithBackoff(url, "PubMed ESearch");
  const json = (await res.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  return json.esearchresult?.idlist ?? [];
}

type PubmedSummary = {
  title?: string;
  pubdate?: string;
  source?: string;
  authors?: { name?: string }[];
  articleids?: { idtype?: string; value?: string }[];
  pubtype?: string[];
};

async function pubmedESummary(pmids: string[]): Promise<Record<string, PubmedSummary>> {
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "json");
  url.searchParams.set("id", pmids.join(","));
  if (process.env.NCBI_API_KEY) url.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const res = await fetchWithBackoff(url, "PubMed ESummary");
  const json = (await res.json()) as {
    result?: { uids?: string[] } & Record<string, unknown>;
  };
  const result = (json.result ?? {}) as Record<string, any>;
  const uids: string[] = Array.isArray(result.uids) ? result.uids : [];
  const out: Record<string, PubmedSummary> = {};
  for (const id of uids) out[id] = result[id];
  return out;
}

type AbstractAndKeywords = { abstract: string | null; keywords: string[] };

async function pubmedEAbstractAndKeywords(pmid: string): Promise<AbstractAndKeywords> {
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "xml");
  url.searchParams.set("id", pmid);
  if (process.env.NCBI_API_KEY) url.searchParams.set("api_key", process.env.NCBI_API_KEY);

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: fetchHeaders() });
    if (res.status === 429) {
      const waitMs = 600 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(`PubMed EFetch failed: ${res.status}`);
    const xml = await res.text();

    const abstractMatch = xml.match(/<Abstract(?: [^>]*)?>([\s\S]*?)<\/Abstract>/i);
    const abstractText =
      abstractMatch &&
      abstractMatch[1]
        .replace(/<AbstractText[^>]*>/gi, "")
        .replace(/<\/AbstractText>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const keywordMatches = [
      ...xml.matchAll(/<Keyword[^>]*>([\s\S]*?)<\/Keyword>/gi),
      ...xml.matchAll(/<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/gi),
    ];
    const keywords = Array.from(
      new Set(
        keywordMatches
          .map((m) =>
            (m[1] ?? "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
          )
          .filter(Boolean)
      )
    );

    return { abstract: abstractText || null, keywords };
  }

  return { abstract: null, keywords: [] };
}

function pmidToUrls(pmid: string, articleids?: { idtype?: string; value?: string }[]) {
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  const doi = articleids?.find((a) => a.idtype === "doi")?.value;
  const doiUrl = doi ? `https://doi.org/${doi}` : null;
  return { pubmedUrl, doi, doiUrl };
}

function parsePublicationDate(pubdate?: string): Date | null {
  if (!pubdate) return null;
  const trimmed = pubdate.trim();
  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return new Date(iso);
  // Fallbacks like "2026 Jan" or "2026 Mar 05"
  const cleaned = trimmed.replace(/(\d{4}) (\w{3})$/, "$1-$2-01");
  const parsed = Date.parse(cleaned);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

/** Fetch article page and return cleaned body text (no nav, ads, refs, footnotes, sidebars). */
async function fetchAndCleanArticleBody(articleUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(articleUrl, {
      headers: fetchHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html, { decodeEntities: true });

    // Remove navigation, ads, references, footnotes, sidebars
    const removeSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
      "[role='navigation']",
      "[role='banner']",
      "[role='contentinfo']",
      "[class*='nav']",
      "[id*='nav']",
      "[class*='ad']",
      "[id*='ad']",
      "[class*='sidebar']",
      "[id*='sidebar']",
      "[class*='reference']",
      "[id*='reference']",
      "[class*='ref-list']",
      "[class*='footnote']",
      "[id*='footnote']",
      "[class*='citation']",
      "[id*='cite']",
      ".references",
      "#references",
      "[class*='cookie']",
      "[class*='newsletter']",
    ];
    for (const sel of removeSelectors) {
      try {
        $(sel).remove();
      } catch {
        /* ignore invalid selector */
      }
    }

    // Prefer main content containers, then article, then body
    const main =
      $("article").length > 0
        ? $("article").first()
        : $("[role='main']").length > 0
          ? $("[role='main']").first()
          : $("main").length > 0
            ? $("main").first()
            : $(".article-body, .content-body, .post-content, .entry-content").first();
    const root = main.length > 0 ? main : $("body");
    let text = root.text();
    text = text.replace(/\s+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();
    return text.length > 200 ? text : null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function upsertRawArticleFromPubmed(pmid: string, summary: PubmedSummary) {
  if (!isCrediblePubmedSource(summary.source)) return { createdOrUpdated: false };

  const title = (summary.title ?? "").trim();
  if (!title) return { createdOrUpdated: false };

  const { pubmedUrl, doiUrl, doi } = pmidToUrls(pmid, summary.articleids);
  const { abstract, keywords } = await pubmedEAbstractAndKeywords(pmid).catch(() => ({
    abstract: null,
    keywords: [] as string[],
  }));

  const authors = (summary.authors ?? [])
    .map((a) => a?.name?.trim())
    .filter(Boolean)
    .join(", ") || null;

  const publicationDate = parsePublicationDate(summary.pubdate ?? undefined);
  const source = "PubMed";
  const sourceUrl = doiUrl ?? pubmedUrl;

  // Task 5 — Deduplication: skip insert if duplicate on doi, or on title + source_url
  const orConditions: Array<
    { doi: string } | { title: string; sourceUrl: string; source: string }
  > = [{ title, sourceUrl, source }];
  if (doi) orConditions.push({ doi });
  const existing = await prisma.rawMedicalArticle.findFirst({
    where: { OR: orConditions },
  });
  if (existing) return { createdOrUpdated: false };

  // Task 4 — Scrape article body where accessible; clean HTML and store in full_text
  let fullText: string | null = null;
  try {
    fullText = await fetchAndCleanArticleBody(sourceUrl);
  } catch {
    /* leave fullText null */
  }

  await prisma.rawMedicalArticle.create({
    data: {
      id: randomUUID(),
      source,
      sourceUrl,
      title,
      authors,
      journal: summary.source ?? null,
      publicationDate: publicationDate ?? undefined,
      abstract: abstract ?? undefined,
      fullText: fullText ?? undefined,
      keywords,
      doi: doi ?? null,
    },
  });

  return { createdOrUpdated: true };
}

async function main() {
  const envSlugs = (process.env.SCRAPE_TAG_SLUGS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const selectedSlugs = envSlugs.length ? envSlugs : [...DEFAULT_TAG_SLUGS];

  const bySlug = new Map((TAXONOMY_LABELS as TaxonomyLabel[]).map((t) => [t.slug, t]));
  const labels = selectedSlugs.map((s) => bySlug.get(s)).filter(Boolean) as TaxonomyLabel[];
  if (!labels.length) {
    console.log("No valid tag slugs selected. Set SCRAPE_TAG_SLUGS=slug1,slug2");
    return;
  }

  let total = 0;
  for (const label of labels) {
    const query = buildPubmedQuery(label);
    const pmids = await pubmedESearch(query, 40);
    if (!pmids.length) continue;

    const summaries = await pubmedESummary(pmids);
    for (const pmid of pmids) {
      const summary = summaries[pmid] ?? {};
      const r = await upsertRawArticleFromPubmed(pmid, summary);
      if (r.createdOrUpdated) total += 1;
      await new Promise((r2) => setTimeout(r2, 150));
    }

    await new Promise((r3) => setTimeout(r3, 800));
  }

  console.log(`Raw scrape complete. Upserted ${total} raw_medical_articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


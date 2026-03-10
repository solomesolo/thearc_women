import "dotenv/config";
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function slugifyShort(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function inferEvidenceLevelLabel(pubTypes: string[]): string | null {
  const t = pubTypes.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("randomized") || x.includes("clinical trial")))
    return "high-evidence";
  if (t.some((x) => x.includes("systematic review") || x.includes("meta-analysis")))
    return "high-evidence";
  if (t.some((x) => x.includes("review"))) return "moderate-evidence";
  if (t.some((x) => x.includes("observational") || x.includes("cohort")))
    return "moderate-evidence";
  return "emerging-evidence";
}

function buildPubmedQuery(label: TaxonomyLabel): string {
  const base = `"${label.label}"[Title/Abstract] OR "${label.slug.replace(
    /-/g,
    " "
  )}"[Title/Abstract]`;
  const female = `(female[MeSH Terms] OR women[Title/Abstract] OR woman's[Title/Abstract] OR women's[Title/Abstract])`;
  const recency = `("last 14 days"[PDat])`;
  const humansEnglish = `(humans[MeSH Terms]) AND (english[Language])`;
  return `(${base}) AND ${female} AND ${humansEnglish} AND ${recency}`;
}

async function fetchWithBackoff(url: URL, kind: string): Promise<Response> {
  const headers: Record<string, string> = {
    "User-Agent": "thearc_women_scraper/1.0 (contact: admin@thearc.com)",
  };
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

async function pubmedESearch(query: string, retmax = 20): Promise<string[]> {
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

async function pubmedESummary(pmids: string[]): Promise<
  Record<
    string,
    {
      title?: string;
      pubdate?: string;
      source?: string;
      authors?: { name?: string }[];
      articleids?: { idtype?: string; value?: string }[];
      pubtype?: string[];
    }
  >
> {
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
  const out: Record<string, any> = {};
  for (const id of uids) out[id] = result[id];
  return out;
}

async function pubmedEAbstract(pmid: string): Promise<string | null> {
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "xml");
  url.searchParams.set("id", pmid);
  if (process.env.NCBI_API_KEY) url.searchParams.set("api_key", process.env.NCBI_API_KEY);
  // PubMed will 429 if we pull too fast. Be conservative.
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "thearc_women_scraper/1.0 (contact: admin@thearc.com)" },
    });
    if (res.status === 429) {
      const waitMs = 600 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(`PubMed EFetch failed: ${res.status}`);
    const xml = await res.text();
    const m = xml.match(/<Abstract(?: [^>]*)?>([\s\S]*?)<\/Abstract>/i);
    if (!m) return null;
    const inner = m[1]
      .replace(/<AbstractText[^>]*>/gi, "")
      .replace(/<\/AbstractText>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return inner || null;
  }
  return null;
}

function pmidToUrls(pmid: string, articleids?: { idtype?: string; value?: string }[]) {
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  const doi = articleids?.find((a) => a.idtype === "doi")?.value;
  const doiUrl = doi ? `https://doi.org/${doi}` : null;
  return { pubmedUrl, doi, doiUrl };
}

async function ensureTagsExist(slugs: string[]) {
  const existing = await prisma.taxonomyTag.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  return new Map(existing.map((t) => [t.slug, t.id]));
}

async function upsertArticleFromPubmed(args: {
  pmid: string;
  label: TaxonomyLabel;
  tagIdBySlug: Map<string, number>;
  summary: {
    title?: string;
    pubdate?: string;
    source?: string;
    authors?: { name?: string }[];
    articleids?: { idtype?: string; value?: string }[];
    pubtype?: string[];
  };
}) {
  const { pmid, label, tagIdBySlug, summary } = args;
  if (!isCrediblePubmedSource(summary.source)) return { createdOrUpdated: false };
  const title = (summary.title ?? "").trim();
  if (!title) return { createdOrUpdated: false };

  const { pubmedUrl, doiUrl } = pmidToUrls(pmid, summary.articleids);
  const abstract = await pubmedEAbstract(pmid).catch(() => null);
  const excerpt = (abstract ?? "").slice(0, 240) || `PubMed: ${pubmedUrl}`;

  const slug = `pmid-${pmid}-${slugifyShort(title).slice(0, 40)}`.slice(0, 60);
  const evidenceSlug = inferEvidenceLevelLabel(summary.pubtype ?? []);
  const tagSlugs = [label.slug, evidenceSlug].filter(Boolean) as string[];
  const tagIds = tagSlugs
    .map((s) => tagIdBySlug.get(s))
    .filter((x): x is number => typeof x === "number");

  const article = await prisma.article.upsert({
    where: { slug },
    create: {
      slug,
      title,
      excerpt,
      pillar: "Trending",
      category: "Research",
      evidenceLevel: evidenceSlug ? evidenceSlug.replace(/-/g, " ") : null,
      studyTypes: (summary.pubtype ?? []).join(", "),
      consensusStatus: "needs-review",
      isPublished: false,
      publishedAt: summary.pubdate ? new Date(summary.pubdate) : null,
    },
    update: {
      title,
      excerpt,
      studyTypes: (summary.pubtype ?? []).join(", "),
      evidenceLevel: evidenceSlug ? evidenceSlug.replace(/-/g, " ") : null,
    },
  });

  const existingSource = await prisma.articleSource.findFirst({
    where: { articleId: article.id },
  });
  if (!existingSource) {
    await prisma.articleSource.create({
      data: {
        articleId: article.id,
        label: summary.source ? `${summary.source} (PubMed)` : "PubMed",
        url: doiUrl ?? pubmedUrl,
        evidenceNote: pubmedUrl,
      },
    });
  }

  for (const tagId of tagIds) {
    await prisma.articleTagJoin.upsert({
      where: { articleId_tagId: { articleId: article.id, tagId } },
      create: { articleId: article.id, tagId },
      update: {},
    });
  }

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

  const tagIdBySlug = await ensureTagsExist(
    Array.from(new Set([...selectedSlugs, "high-evidence", "moderate-evidence", "emerging-evidence"]))
  );

  let total = 0;
  for (const label of labels) {
    const query = buildPubmedQuery(label);
    const pmids = await pubmedESearch(query, 15);
    if (!pmids.length) continue;

    const summaries = await pubmedESummary(pmids);
    // Keep concurrency low to avoid 429s.
    for (const pmid of pmids) {
      const summary = summaries[pmid] ?? {};
      const r = await upsertArticleFromPubmed({
        pmid,
        label,
        tagIdBySlug,
        summary,
      });
      if (r.createdOrUpdated) total += 1;
      await new Promise((r2) => setTimeout(r2, 150));
    }

    // Pause between label queries to avoid bursting.
    await new Promise((r3) => setTimeout(r3, 800));
  }

  console.log(`Scrape complete. Upserted ${total} articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


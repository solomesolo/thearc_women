/**
 * Credible medical/research platforms for article discovery and storage.
 * Scrapers only ingest articles from these sources.
 *
 * - domains: used to validate source URLs and for future direct scrapers
 * - pubmedJournalNames: journal names/abbreviations as in PubMed ESummary "source"
 *   (used to filter PubMed results to only these journals)
 */

export type CrediblePlatform = {
  domain: string;
  displayName: string;
  /** PubMed journal name(s) or abbreviation(s) — match ESummary "source" (case-insensitive) */
  pubmedJournalNames?: string[];
};

export const CREDIBLE_PLATFORMS: CrediblePlatform[] = [
  { domain: "pubmed.ncbi.nlm.nih.gov", displayName: "PubMed" },
  { domain: "scholar.google.com", displayName: "Google Scholar" },
  { domain: "cochranelibrary.com", displayName: "Cochrane Library", pubmedJournalNames: ["Cochrane Database Syst Rev", "Cochrane Database of Systematic Reviews"] },
  { domain: "scopus.com", displayName: "Scopus" },
  { domain: "webofscience.com", displayName: "Web of Science" },
  { domain: "thelancet.com", displayName: "The Lancet", pubmedJournalNames: ["Lancet", "Lancet Public Health", "Lancet Glob Health", "Lancet Oncol", "Lancet Diabetes Endocrinol", "Lancet Psychiatry", "Lancet Infect Dis", "Lancet Neurol", "Lancet Respir Med"] },
  { domain: "jamanetwork.com", displayName: "JAMA Network", pubmedJournalNames: ["JAMA", "JAMA Netw Open", "JAMA Intern Med", "JAMA Psychiatry", "JAMA Neurol", "JAMA Surg", "JAMA Cardiol", "JAMA Oncol", "JAMA Pediatr"] },
  { domain: "nejm.org", displayName: "New England Journal of Medicine", pubmedJournalNames: ["N Engl J Med", "New England Journal of Medicine"] },
  { domain: "nature.com", displayName: "Nature", pubmedJournalNames: ["Nature", "Nat Med", "Nature Medicine", "Nat Metab", "Nature Metabolism", "Nat Rev Endocrinol", "Nat Rev Dis Primers"] },
  { domain: "bmj.com", displayName: "BMJ", pubmedJournalNames: ["BMJ", "Br J Sports Med", "British Journal of Sports Medicine", "BMJ Open", "BMJ Med"] },
  { domain: "academic.oup.com", displayName: "Oxford Academic", pubmedJournalNames: ["J Clin Endocrinol Metab", "Journal of Clinical Endocrinology and Metabolism", "Endocr Rev", "Endocrine Reviews", "Hum Reprod", "Human Reproduction", "Am J Clin Nutr", "American Journal of Clinical Nutrition"] },
  { domain: "fertstert.org", displayName: "Fertility and Sterility", pubmedJournalNames: ["Fertil Steril", "Fertility and Sterility"] },
  { domain: "journals.lww.com", displayName: "LWW Journals", pubmedJournalNames: ["Menopause", "Menopause (New York, N.Y.)", "Med Sci Sports Exerc", "Medicine and Science in Sports and Exercise"] },
  { domain: "tandfonline.com", displayName: "Taylor & Francis", pubmedJournalNames: ["Int J Gynaecol Obstet", "International Journal of Gynaecology and Obstetrics", "Gynecological Endocrinology"] },
  { domain: "cell.com", displayName: "Cell", pubmedJournalNames: ["Cell Metab", "Cell Metabolism"] },
  { domain: "journals.physiology.org", displayName: "American Physiological Society", pubmedJournalNames: ["Physiol Rev", "American Journal of Physiology", "J Appl Physiol", "Journal of Applied Physiology"] },
  { domain: "metabolismjournal.com", displayName: "Metabolism", pubmedJournalNames: ["Metabolism", "Metabolism Clinical and Experimental"] },
  { domain: "diabetesjournals.org", displayName: "Diabetes Care", pubmedJournalNames: ["Diabetes Care", "Diabetes", "Diabetologia"] },
  { domain: "ajpmonline.org", displayName: "American Journal of Preventive Medicine", pubmedJournalNames: ["Am J Prev Med", "American Journal of Preventive Medicine"] },
  { domain: "elsevier.com", displayName: "Elsevier", pubmedJournalNames: ["Prev Med", "Preventive Medicine", "Clin Nutr", "Clinical Nutrition"] },
  { domain: "liebertpub.com", displayName: "Mary Ann Liebert", pubmedJournalNames: ["J Womens Health (Larchmt)", "Journal of Women's Health"] },
  { domain: "springer.com", displayName: "Springer", pubmedJournalNames: ["Sports Med", "Sports Medicine"] },
  { domain: "mdpi.com", displayName: "MDPI", pubmedJournalNames: ["Nutrients"] },
  { domain: "who.int", displayName: "World Health Organization" },
  { domain: "nih.gov", displayName: "NIH" },
  { domain: "orwh.od.nih.gov", displayName: "NIH Office of Research on Women's Health" },
  { domain: "uspreventiveservicestaskforce.org", displayName: "U.S. Preventive Services Task Force" },
  { domain: "endocrine.org", displayName: "Endocrine Society" },
  { domain: "acog.org", displayName: "ACOG" },
  { domain: "ese-hormones.org", displayName: "European Society of Endocrinology" },
  { domain: "hsph.harvard.edu", displayName: "Harvard T.H. Chan School of Public Health" },
  { domain: "stanford.edu", displayName: "Stanford Medicine" },
  { domain: "mayo.edu", displayName: "Mayo Clinic" },
  { domain: "clevelandclinic.org", displayName: "Cleveland Clinic" },
  { domain: "bestpractice.bmj.com", displayName: "BMJ Best Practice" },
  { domain: "uptodate.com", displayName: "UpToDate" },
  { domain: "examine.com", displayName: "Examine" },
];

/** Normalized domain list for URL validation (hostname without protocol) */
export const CREDIBLE_DOMAINS: string[] = CREDIBLE_PLATFORMS.map((p) =>
  p.domain.replace(/^www\./, "")
);

/**
 * Set of PubMed journal names/abbreviations we accept (from ESummary "source").
 * Used to filter PubMed results to only credible journals.
 */
const _journalSet = new Set<string>();
for (const p of CREDIBLE_PLATFORMS) {
  for (const name of p.pubmedJournalNames ?? []) {
    _journalSet.add(name.toLowerCase().trim());
  }
}
export const CREDIBLE_PUBMED_JOURNAL_NAMES = Object.freeze([..._journalSet]);

/** Returns true if the PubMed ESummary "source" (journal name) is in our credible list */
export function isCrediblePubmedSource(source: string | null | undefined): boolean {
  if (!source || typeof source !== "string") return false;
  const normalized = source.trim().toLowerCase();
  if (!normalized) return false;
  return CREDIBLE_PUBMED_JOURNAL_NAMES.some((allowed) => normalized.includes(allowed) || allowed.includes(normalized));
}

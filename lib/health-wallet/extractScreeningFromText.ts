/**
 * Heuristic extraction of screening letter date + narrative findings (Befunde)
 * from OCR raw text (German / English). Not clinical-grade — user can edit in UI.
 *
 * Scanned PDFs often produce dense symbol noise; we filter lines and drop unusable blobs.
 */

export interface ScreeningOcrExtraction {
  date: string | null;
  findings: string;
  /** Human-readable screening type inferred from the document text (e.g. "MRT Neurokranium") */
  screeningName: string;
  /** Set when automatic text looks unreliable — prompt user to paste from the PDF/letter */
  suggestManualPaste: boolean;
}

// Ordered from most specific to most generic.
// Each entry: try every pattern — the first entry where ANY pattern matches wins.
const SCREENING_TYPE_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "MRT Neurokranium",         patterns: [/neurokranium|neurocranium/i] },
  { name: "MRT Wirbelsäule",          patterns: [/wirbels[äa]ule.*MR[T-]|MR[T-].*wirbels[äa]ule|spine.*MRI|MRI.*spine/i] },
  { name: "MRT Knie",                 patterns: [/knie.*MR[T-]|MR[T-].*knie|knee.*MRI/i] },
  { name: "MRT Schulter",             patterns: [/schulter.*MR[T-]|MR[T-].*schulter|shoulder.*MRI/i] },
  { name: "MRT Brust",                patterns: [/brust.*MR[T-]|MR[T-].*brust|breast.*MRI/i] },
  { name: "MR-Angiographie",          patterns: [/MR-Angiograph|MRA\b/i] },
  { name: "MRT",                      patterns: [/\bMRT\b|\bMRI\b|MR-Untersuchung|Magnetresonanz/i] },
  { name: "CT Schädel",               patterns: [/sch[äa]del.*CT|CT.*sch[äa]del|head.*CT|CT.*head/i] },
  { name: "PET-CT",                   patterns: [/PET-CT|Positronenemissions/i] },
  { name: "CT",                       patterns: [/\bCT\b|Computertomograph/i] },
  { name: "Mammographie",             patterns: [/mammograph|mammogram/i] },
  { name: "Herzecho",                 patterns: [/echokardio|herzecho/i] },
  { name: "EKG",                      patterns: [/\bEKG\b|\bECG\b|Elektrokardio/i] },
  { name: "Ultraschall",              patterns: [/ultraschall|sonograph|sonografi|ultrasound/i] },
  { name: "Koloskopie",               patterns: [/koloskop|kolonoskop|colonoscop|darmspiegelung/i] },
  { name: "Pap-Abstrich / HPV",       patterns: [/\bPap\b|\bHPV\b|Zervixabstrich|cervical.{0,20}smear|cervical.{0,20}screen/i] },
  { name: "Knochendichtemessung",     patterns: [/knochendichte|osteoporose|\bDEXA\b|\bDXA\b/i] },
  { name: "Spirometrie",              patterns: [/spirometr|Lungenfunktion|pulmonary.{0,20}function/i] },
  { name: "Röntgen",                  patterns: [/[Rr][öo]ntgen|\bX-Ray\b|Radiograph/i] },
  { name: "Hautuntersuchung",         patterns: [/Hautkrebsvorsorge|Hautuntersuch|dermatolog|skin.{0,15}check/i] },
  { name: "Augenuntersuchung",        patterns: [/Augenuntersuch|Augenheilkunde|Ophthalm|eye.{0,15}exam/i] },
  { name: "Gynäkologische Vorsorge",  patterns: [/gyn[äa]kolog|gynecolog|Frauenarzt|Frauenheilkunde/i] },
  { name: "Laboruntersuchung",        patterns: [/Laborwerte|Blutbild|Blutuntersuch|blood.{0,10}count|laboratory.{0,20}result/i] },
  { name: "Radiologischer Befund",    patterns: [/[Rr]adiolog/i] },
  { name: "Vorsorgeuntersuchung",     patterns: [/[Vv]orsorge|[Cc]heck-?[Uu]p|[Ss]creening/i] },
];

/**
 * Classify the screening type from OCR text.
 * Returns a human-readable name (DE/EN mixed, matching the document language)
 * or an empty string when no recognisable screening type is found.
 */
export function extractScreeningName(text: string): string {
  if (!text?.trim()) return "";
  for (const { name, patterns } of SCREENING_TYPE_PATTERNS) {
    if (patterns.some((re) => re.test(text))) return name;
  }
  return "";
}

function normaliseWhitespace(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Latin + German letters only */
function letterCount(s: string): number {
  return (s.match(/[a-zA-ZäöüÄÖÜß]/g) ?? []).length;
}

/** Rough signal: real words vs OCR junk (symbols, 1–2 char fragments) */
function lineReadabilityScore(line: string): number {
  const t = line.trim();
  if (t.length < 4) return 0;

  const nonSpace = t.replace(/\s/g, "");
  if (nonSpace.length === 0) return 0;

  const letters = letterCount(t);
  const letterRatio = letters / nonSpace.length;

  const vowels = (t.match(/[aeiouäöüAEIOUÄÖÜ]/g) ?? []).length;
  const vowelRatio = letters > 0 ? vowels / letters : 0;

  const longAlphaWords = (t.match(/\b[a-zäöüß]{5,}\b/gi) ?? []).length;

  // Medical / letter vocabulary (DE + EN) — boosts legitimate short lines
  const vocabHint =
    /(?:befund|befunde|befundtext|patient|datum|untersuch|ergebnis|empfehlung|hinweis|normal|unauffäll|keine\s+auffäll|mammograph|zervix|kolposkop|darmkrebs|screening|findings|impression|recommend|clinical|letter)/i.test(
      t,
    );

  let score = letterRatio * 0.55 + vowelRatio * 1.1 + Math.min(longAlphaWords, 6) * 0.12;
  if (vocabHint) score += 0.45;

  // Penalise symbol soup (common in broken column OCR)
  const symbolish = (t.match(/[=|_§£€%]{3,}/g) ?? []).length;
  score -= symbolish * 0.35;

  return score;
}

/** Drop lines that are almost certainly OCR garbage; keep narrative-style lines */
export function stripScreeningOcrNoise(text: string): string {
  const lines = normaliseWhitespace(text).split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (lineReadabilityScore(s) >= 0.38) kept.push(s);
  }
  return kept.join("\n").trim();
}

/** Whole-page / whole-doc OCR often unreadable when letter signal is tiny */
function isLikelyCorruptedOcrBlob(text: string): boolean {
  const t = text.replace(/\s/g, "");
  if (t.length < 180) return false;
  const lr = letterCount(text) / Math.max(t.length, 1);
  const longWords = (text.match(/\b[a-zäöüß]{6,}\b/gi) ?? []).length;
  return lr < 0.14 && longWords < 6;
}

/** Try ISO yyyy-mm-dd, dd.mm.yyyy, dd/mm/yyyy, mm/dd/yyyy (ambiguous — prefer EU when dots) */
function extractBestDate(raw: string): string | null {
  const iso = raw.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const de = raw.match(/\b(\d{1,2})\.(\d{1,2})\.(20\d{2}|\d{2})\b/);
  if (de) {
    const y = de[3].length === 2 ? `20${de[3]}` : de[3];
    const mm = de[2].padStart(2, "0");
    const dd = de[1].padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  const slash = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (slash) {
    const y = slash[3];
    // Treat as dd/mm/yyyy (European format standard on screening letters)
    const dd = slash[1].padStart(2, "0");
    const mm = slash[2].padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  // German long month e.g. "14. Mai 2025"
  const months: Record<string, string> = {
    januar: "01", january: "01", jan: "01",
    februar: "02", february: "02", feb: "02",
    märz: "03", march: "03", mar: "03",
    april: "04", apr: "04",
    mai: "05", may: "05",
    juni: "06", june: "06", jun: "06",
    juli: "07", july: "07", jul: "07",
    august: "08", aug: "08",
    september: "09", sep: "09",
    oktober: "10", october: "10", oct: "10",
    november: "11", nov: "11",
    dezember: "12", december: "12", dec: "12",
  };
  const long = raw.match(/\b(\d{1,2})\.\s*([A-Za-zäÄöÖüÜ]+)\s*(20\d{2})\b/i);
  if (long) {
    const key = long[2].toLowerCase();
    const mm = months[key];
    if (mm) {
      const dd = long[1].padStart(2, "0");
      return `${long[3]}-${mm}-${dd}`;
    }
  }

  return null;
}

function sliceAfterHeading(text: string, pattern: RegExp): string | null {
  const m = text.match(pattern);
  if (!m || m.index === undefined) return null;
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  return rest.trim();
}

function cutAtNextSection(body: string): string {
  const stop = /(?=\n\s*(?:Empfehlung|Beurteilung|Impression|Hinweis|Untersuchungsdatum|Termin|Nachsorge|Adresse|Seite\s*\d|Page\s*\d|Anhang)\b)/i;
  const idx = body.search(stop);
  const chunk = idx >= 0 ? body.slice(0, idx) : body;
  return normaliseWhitespace(chunk.slice(0, 8000));
}

/**
 * Returns ISO date (yyyy-mm-dd) or null, findings narrative (may be empty),
 * and whether the UI should nudge a manual paste.
 */
export function extractScreeningFromOcrText(raw: string): ScreeningOcrExtraction {
  const text = raw?.trim() ? raw : "";
  if (!text) {
    return { date: null, findings: "", screeningName: "", suggestManualPaste: false };
  }

  const cleanedDoc = stripScreeningOcrNoise(text);

  if (text.replace(/\s/g, "").length > 400 && cleanedDoc.length < 50) {
    if (isLikelyCorruptedOcrBlob(text) || letterCount(text) / Math.max(text.replace(/\s/g, "").length, 1) < 0.13) {
      return { date: null, findings: "", screeningName: extractScreeningName(text), suggestManualPaste: true };
    }
  }

  const workText = cleanedDoc.length >= 80 ? cleanedDoc : text;

  let findingsBody: string | null = null;

  const patterns: RegExp[] = [
    /Befund(?:e)?\s*[:\n]/i,
    /Befundtext\s*[:\n]/i,
    /(?:Clinical\s+)?Findings\s*[:\n]/i,
    /Ergebnis(?:se)?\s*(?:der\s+Untersuchung)?\s*[:\n]/i,
    /Screening(?:[-\s]?Ergebnis)?\s*[:\n]/i,
    /Untersuchungsergebnis\s*[:\n]/i,
  ];

  for (const p of patterns) {
    findingsBody = sliceAfterHeading(workText, p) || sliceAfterHeading(text, p);
    if (findingsBody && findingsBody.length > 20) break;
  }

  if (!findingsBody || findingsBody.length < 12) {
    // Fallback: use middle of document if short letter
    findingsBody =
      workText.length > 400
        ? workText.slice(Math.floor(workText.length * 0.15), Math.floor(workText.length * 0.85))
        : workText;
  }

  let findings = cutAtNextSection(findingsBody);
  findings = stripScreeningOcrNoise(findings);

  const longWords = (findings.match(/\b[a-zäöüß]{6,}\b/gi) ?? []).length;
  const findingsTooWeak =
    findings.replace(/\s/g, "").length < 12 ||
    longWords < 1 ||
    isLikelyCorruptedOcrBlob(findings) ||
    (findings.length > 120 && letterCount(findings) / Math.max(findings.replace(/\s/g, "").length, 1) < 0.16);

  if (findingsTooWeak) {
    findings = "";
  }

  const dateFromClean = extractBestDate(findings) || extractBestDate(workText.slice(0, 2500));
  const dateFromRaw =
    !dateFromClean && !isLikelyCorruptedOcrBlob(text.slice(0, 4000))
      ? extractBestDate(text.slice(0, 1200)) || extractBestDate(text)
      : null;
  const date = dateFromClean || dateFromRaw;

  const suggestManualPaste =
    findings.length === 0 && text.replace(/\s/g, "").length > 120;

  const screeningName = extractScreeningName(text);

  return { date, findings, screeningName, suggestManualPaste };
}

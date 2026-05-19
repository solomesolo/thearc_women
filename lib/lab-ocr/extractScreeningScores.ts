/**
 * Screening-specific score extraction from imaging / screening reports.
 * Handles BI-RADS, DEXA T-score/Z-score, PHQ-9, colonoscopy, Pap, PSA, etc.
 */

import { CATEGORY_TO_BIN } from "./testNameMap";

export interface ScreeningScore {
  canonical_name: string;
  display_name: string;
  category: string;
  bin: string;
  value: string;
  numeric_value: number | null;
  unit: string | null;
  interpretation: string | null;
  report_date: string | null;
  confidence: number;
}

// ── Pattern definitions ─────────────────────────────────────────────────────

interface ScorePattern {
  canonical_name: string;
  display_name: string;
  category: string;
  // Ordered: each pattern returns [numeric_value, text_value, interpretation]
  extractors: Array<{
    re: RegExp;
    // Groups: 1=value (usually), optional 2=interpretation
    numericGroup: number;
    interpretationGroup?: number;
  }>;
  unit?: string | null;
}

const SCORE_PATTERNS: ScorePattern[] = [
  // BI-RADS: "BI-RADS 3", "BI-RADS Category 3", "BIRADS 4A"
  {
    canonical_name: "bi_rads",
    display_name: "BI-RADS Score",
    category: "imaging_score",
    unit: null,
    extractors: [
      {
        re: /BI.?RADS\s+(?:category\s+)?(\d[ABC]?)\b(?:[:\s-]+([^.\n]{0,80}))?/gi,
        numericGroup: 1,
      },
      {
        re: /(?:mammograph\w*|breast\s+imaging)\s+(?:category|score|result)[:\s]+(\d[ABC]?)\b/gi,
        numericGroup: 1,
      },
    ],
  },

  // DEXA T-score: "T-score -1.8", "T-Score: -2.3 (Osteopenia)", "lumbar spine T-score -1.5"
  {
    canonical_name: "dexa_t_score",
    display_name: "Bone Density T-score",
    category: "imaging_score",
    unit: null,
    extractors: [
      {
        re: /T.?[Ss]core[:\s]+(-?\d+\.?\d*)\b(?:[:\s,\(]+([^.\n\)]{0,60}))?/gi,
        numericGroup: 1,
        interpretationGroup: 2,
      },
    ],
  },

  // DEXA Z-score
  {
    canonical_name: "dexa_z_score",
    display_name: "Bone Density Z-score",
    category: "imaging_score",
    unit: null,
    extractors: [
      {
        re: /Z.?[Ss]core[:\s]+(-?\d+\.?\d*)\b(?:[:\s,\(]+([^.\n\)]{0,60}))?/gi,
        numericGroup: 1,
        interpretationGroup: 2,
      },
    ],
  },

  // PHQ-9: "PHQ-9 score: 12", "PHQ-9: 12/27", "PHQ9 12"
  {
    canonical_name: "phq9",
    display_name: "PHQ-9 Depression Score",
    category: "mental_health",
    unit: null,
    extractors: [
      {
        re: /PHQ.?9\s*(?:score)?[:\s]+(\d{1,2})(?:\/27)?/gi,
        numericGroup: 1,
      },
    ],
  },

  // GAD-7
  {
    canonical_name: "gad7",
    display_name: "GAD-7 Anxiety Score",
    category: "mental_health",
    unit: null,
    extractors: [
      {
        re: /GAD.?7\s*(?:score)?[:\s]+(\d{1,2})(?:\/21)?/gi,
        numericGroup: 1,
      },
    ],
  },

  // Coronary Calcium Score (Agatston)
  {
    canonical_name: "calcium_score",
    display_name: "Coronary Calcium Score (Agatston)",
    category: "cardiac",
    unit: null,
    extractors: [
      {
        re: /(?:coronary\s+calcium|calcium|Agatston)\s+(?:score|Score)[:\s]+(\d+(?:\.\d+)?)/gi,
        numericGroup: 1,
      },
    ],
  },

  // PSA (when mentioned as screening result, not just a lab value)
  {
    canonical_name: "psa",
    display_name: "PSA (Prostate-Specific Antigen)",
    category: "oncology",
    unit: "ng/mL",
    extractors: [
      {
        re: /\bPSA\b[:\s]+(\d+\.?\d*)\s*(?:ng\/m[lL])?/gi,
        numericGroup: 1,
      },
    ],
  },

  // FIT / FOBT colonoscopy stool test
  {
    canonical_name: "fobt_fit",
    display_name: "Fecal Occult Blood Test (FIT/FOBT)",
    category: "gastroenterology",
    unit: null,
    extractors: [
      {
        re: /(?:\bFIT\b|\bFOBT\b|fecal\s+(?:immunochemical|occult\s+blood)\s+test)\s*[:\s]+(\d+\.?\d*)/gi,
        numericGroup: 1,
      },
    ],
  },

  // Beck Depression Inventory
  {
    canonical_name: "bdi",
    display_name: "Beck Depression Inventory",
    category: "mental_health",
    unit: null,
    extractors: [
      {
        re: /\bBDI\b\s*(?:score|II)?[:\s]+(\d{1,2})/gi,
        numericGroup: 1,
      },
    ],
  },
];

// Date patterns shared with extractLabValues
const DATE_RES = [
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
  /\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(\d{4})\b/i,
];

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function extractDate(text: string): string | null {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1]!;
  const de = text.match(/\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/);
  if (de) return `${de[3]}-${de[2]!.padStart(2, "0")}-${de[1]!.padStart(2, "0")}`;
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) {
    const [, a, b, year] = slash;
    const day = parseInt(a!) > 12 ? a : b;
    const month = parseInt(a!) > 12 ? b : a;
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  }
  const named = text.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(\d{4})\b/i
  );
  if (named) {
    const [, d, m, y] = named;
    return `${y}-${MONTH_MAP[m!.toLowerCase().slice(0, 3)]}-${d!.padStart(2, "0")}`;
  }
  return null;
}

function parseNumericBiRads(raw: string): number | null {
  // Handle "4A", "4B", "4C" → 4.1, 4.2, 4.3
  const letter = raw.match(/^(\d)([ABC])$/i);
  if (letter) {
    const base = parseInt(letter[1]!);
    const sub = { a: 0.1, b: 0.2, c: 0.3 }[letter[2]!.toLowerCase()] ?? 0;
    return base + sub;
  }
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

// ── Main extraction ───────────────────────────────────────────────────────────

export function extractScreeningScores(text: string): ScreeningScore[] {
  const reportDate = extractDate(text.slice(0, 2000)) ?? extractDate(text);
  const results: ScreeningScore[] = [];
  const seen = new Set<string>();

  for (const spec of SCORE_PATTERNS) {
    for (const extractor of spec.extractors) {
      extractor.re.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = extractor.re.exec(text)) !== null) {
        if (seen.has(spec.canonical_name)) break;

        const rawValue = match[extractor.numericGroup] ?? "";
        const rawInterp = extractor.interpretationGroup != null
          ? match[extractor.interpretationGroup]
          : undefined;

        if (!rawValue) continue;

        const numericValue =
          spec.canonical_name === "bi_rads"
            ? parseNumericBiRads(rawValue)
            : parseFloat(rawValue.replace(",", "."));

        if (numericValue === null || isNaN(numericValue)) continue;

        seen.add(spec.canonical_name);

        results.push({
          canonical_name: spec.canonical_name,
          display_name: spec.display_name,
          category: spec.category,
          bin: CATEGORY_TO_BIN[spec.category] ?? "general_labs",
          value: rawValue,
          numeric_value: numericValue,
          unit: spec.unit ?? null,
          interpretation: rawInterp?.trim() || null,
          report_date: reportDate,
          confidence: 0.85,
        });
        break;
      }
    }
  }

  return results;
}

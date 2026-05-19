/**
 * Regex-based lab value extraction from OCR / PDF text.
 * Works entirely offline — no API calls, no cost.
 */

import { matchTestName, CATEGORY_TO_BIN, type TestEntry } from "./testNameMap";

export interface LabResult {
  test_name: string;
  canonical_name: string;
  display_name: string;
  category: string;
  bin: string;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
  report_date: string | null;
  confidence: number;
}

// ── Unit patterns ─────────────────────────────────────────────────────────────

const UNIT_PAT = String.raw`(?:mg\/(?:dL|L|mL)|g\/dL|mmol\/L|µmol\/L|umol\/L|nmol\/L|pmol\/L|ng\/(?:mL|dL|L)|µg\/(?:dL|L|mL)|ug\/(?:dL|L|mL)|pg\/mL|mIU\/(?:mL|L)|IU\/(?:mL|L)|U\/L|µU\/mL|uU\/mL|10\^3\/µL|10\^3\/uL|10\^6\/µL|10\^6\/uL|10\^9\/L|K\/µL|K\/uL|M\/µL|M\/uL|fL|pg|%|ratio|mmHg|mEq\/L|meq\/L|g\/L)`;

// ── Reference range pattern (e.g. "12.0-16.0", "< 200", "> 0.5", "3.5 – 5.5") ───

const RANGE_PAT = String.raw`(?:(?:(?:<|>|<=|>=)\s*[\d.,]+)|(?:[\d.,]+\s*[-–—]\s*[\d.,]+))`;

// ── Flag pattern ──────────────────────────────────────────────────────────────

const FLAG_PAT = String.raw`(?:\b(?:HH|LL|HIGH|LOW|H|L|CRITICAL|ABNORMAL|ELEVATED|DECREASED)\b|\*{1,2})`;

// ── Main extraction regex ─────────────────────────────────────────────────────
// Matches a line like:
//   Hemoglobin         12.5  g/dL     12.0-16.0    L
//   TSH: 2.34 mIU/L (0.27-4.20)
//   WBC  5.2 10^3/uL [4.5-11.0] H

const LINE_RE = new RegExp(
  String.raw`^(.*?)\s*[:\t ]+` +        // test name (greedy up to separator)
  String.raw`([\d.,]+)` +               // numeric value
  String.raw`\s*` +
  String.raw`(${UNIT_PAT})?` +          // optional unit
  String.raw`\s*` +
  String.raw`[(\[]?(${RANGE_PAT})[)\]]?` + // optional reference range
  String.raw`\s*` +
  String.raw`(${FLAG_PAT})?`,           // optional flag
  "im"
);

// Simpler fallback: test name + value + optional unit (no range required)
const SIMPLE_RE = new RegExp(
  String.raw`^(.*?)\s*[:\t ]+` +
  String.raw`([\d.,]+)` +
  String.raw`\s*(${UNIT_PAT})?` +
  String.raw`\s*(${FLAG_PAT})?`,
  "im"
);

// Date patterns: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, "Jan 05, 2024"
const DATE_RES: RegExp[] = [
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{2})\/(\d{2})\/(\d{4})\b/,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(\d{4})\b/i,
];

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function extractReportDate(text: string): string | null {
  // Try ISO first
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1]!;

  // DD/MM/YYYY or MM/DD/YYYY (assume DD/MM if day <= 12 is ambiguous — medical norm)
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) {
    const [, a, b, year] = slash;
    // Heuristic: if first part > 12, must be day
    const day = parseInt(a!) > 12 ? a : b;
    const month = parseInt(a!) > 12 ? b : a;
    return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
  }

  // "05 Jan 2024" / "January 5, 2024"
  const named = text.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(\d{4})\b/i
  );
  if (named) {
    const [, d, m, y] = named;
    return `${y}-${MONTH_MAP[m!.toLowerCase().slice(0, 3)]}-${d!.padStart(2, "0")}`;
  }

  return null;
}

function normaliseFlag(raw: string): string | null {
  const up = raw.trim().toUpperCase();
  if (["HH", "CRITICAL"].includes(up)) return "HH";
  if (["LL"].includes(up)) return "LL";
  if (["H", "HIGH", "ELEVATED", "*"].includes(up)) return "H";
  if (["L", "LOW", "DECREASED"].includes(up)) return "L";
  if (up === "**") return "HH";
  return null;
}

function parseNumber(s: string): number | null {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

// ── Line-by-line extraction ───────────────────────────────────────────────────

function extractFromLine(line: string, reportDate: string | null): LabResult | null {
  const trimmed = line.trim();
  if (trimmed.length < 4) return null;

  // Try full match first
  for (const re of [LINE_RE, SIMPLE_RE]) {
    const m = trimmed.match(re);
    if (!m) continue;

    const rawName = m[1]!.trim();
    if (rawName.length < 2 || rawName.length > 80) continue;

    const entry: TestEntry | null = matchTestName(rawName);
    if (!entry) continue;

    const rawValue = m[2]!;
    const unit = m[3] ?? null;
    const refRange = m[4] ?? null;
    const rawFlag = m[5] ?? null;

    const numericValue = parseNumber(rawValue);
    if (numericValue === null) continue;

    // Sanity: ignore obviously wrong values (age rows, page numbers, etc.)
    if (numericValue > 1_000_000) continue;

    return {
      test_name: rawName,
      canonical_name: entry.key,
      display_name: entry.displayName,
      category: entry.category,
      bin: CATEGORY_TO_BIN[entry.category] ?? "general_labs",
      value: rawValue,
      numeric_value: numericValue,
      unit: unit?.trim() ?? null,
      reference_range: refRange?.trim() ?? null,
      flag: rawFlag ? normaliseFlag(rawFlag) : null,
      report_date: reportDate,
      confidence: unit ? 0.9 : 0.75,
    };
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ExtractResult {
  report_date: string | null;
  results: LabResult[];
  warnings: string[];
}

export function extractLabValues(text: string): ExtractResult {
  const warnings: string[] = [];
  const report_date = extractReportDate(text);

  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const results: LabResult[] = [];

  for (const line of lines) {
    const result = extractFromLine(line, report_date);
    if (!result) continue;

    // Deduplicate by canonical name (keep first occurrence)
    if (seen.has(result.canonical_name)) continue;
    seen.add(result.canonical_name);
    results.push(result);
  }

  if (results.length === 0) {
    warnings.push("No recognised lab values found in document text.");
  }

  return { report_date, results, warnings };
}

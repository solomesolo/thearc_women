import path from "path";
import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH = path.resolve(
  process.cwd(),
  "rules and DB",
  "arc_survey_rule_engine_enriched_cmo_fixed.sqlite",
);

// Lazily load and cache the DB connection.
let _db: Database.Database | null = null;
function getDb() {
  if (_db) return _db;
  // Guard rail: ensure we never accidentally point to legacy artifacts.
  if (!DB_PATH.includes("enriched_cmo_fixed")) {
    throw new Error(`[rules] Refusing to open non-CMO rules DB: ${DB_PATH}`);
  }
  _db = new Database(DB_PATH, { readonly: true });
  return _db;
}

// Types matching SQLite columns
export interface EnrichedRuleRow {
  field_key: string;
  answer_option: string;
  test_bundle: string | null;
  biomarker_id: number;
  biomarker_name: string;
  biomarker_category: string | null;
  rule_strength: string;
  internal_recommended_check: string | null;
  check_key: string | null;
  display_name: string | null;
  included_category: string | null;
  recommended_timing: string | null;
  recommended_intervention_track: string | null;
  customer_logic_explanation: string | null;
  why_included: string | null;
  priority_tier: string | null;
}

export interface CanonicalCheck {
  check_key: string;
  display_name: string;
  short_summary: string;
  recommended_timing: string;
  priority_rule: string;
  what_can_wait: string | null;
  next_action: string | null;
  ui_priority_order: number;
}

export interface SignalExplanation {
  field_key: string;
  answer_option: string;
  test_bundle: string | null;
  signal_source: string;
  signal_label: string;
  signal_explanation: string;
  default_priority_boost: number;
}

export interface IncludedTestRow {
  check_key: string;
  included_category: string;
  biomarker_name: string;
  priority_tier: string;
  why_included: string;
}

export interface WhyThisMattersRuleRow {
  check_key: string;
  field_key: string;
  answer_option: string;
  test_bundle: string | null;
  trigger_type: string;
  trigger_key: string;
  priority_weight: number;
  merge_group: "driver" | "modifier" | "context";
  max_occurrences: number;
  explanation_template: string;
  mechanism: string | null;
  test_focus: string | null;
  priority_rationale: string | null;
}

export function getRulesForAnswers(
  pairs: Array<{ field_key: string; answer_options: string[] }>,
): EnrichedRuleRow[] {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT DISTINCT field_key, answer_option, test_bundle, biomarker_id, biomarker_name,
            biomarker_category, rule_strength, internal_recommended_check, check_key, display_name,
            included_category, recommended_timing, recommended_intervention_track,
            customer_logic_explanation, why_included, priority_tier
     FROM enriched_recommendation_rules
     WHERE check_key IS NOT NULL AND field_key=? AND answer_option=?`,
  );
  const results: EnrichedRuleRow[] = [];
  for (const { field_key, answer_options } of pairs) {
    for (const answer_option of answer_options) {
      const rows = stmt.all(field_key, answer_option) as EnrichedRuleRow[];
      results.push(...rows);
    }
  }
  return results;
}

export function getAllCanonicalChecks(): CanonicalCheck[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM canonical_check_config ORDER BY ui_priority_order`)
    .all() as CanonicalCheck[];
}

export function getWhyThisMattersRulesForAnswers(
  pairs: Array<{ field_key: string; answer_options: string[] }>,
): WhyThisMattersRuleRow[] {
  const db = getDb();
  // Not all DB versions have this table; fail gracefully.
  const exists = db
    .prepare(
      `SELECT 1 FROM sqlite_master WHERE type='table' AND name='check_why_this_matters_rules' LIMIT 1`,
    )
    .get();
  if (!exists) {
    return getWhyThisMattersRulesForAnswersFromCsv(pairs);
  }

  const stmt = db.prepare(
    `SELECT check_key, field_key, answer_option, test_bundle, trigger_type, trigger_key,
            priority_weight, merge_group, max_occurrences, explanation_template,
            mechanism, test_focus, priority_rationale
     FROM check_why_this_matters_rules
     WHERE field_key=? AND answer_option=? AND (test_bundle IS NULL OR test_bundle='' OR test_bundle=?)`,
  );

  const results: WhyThisMattersRuleRow[] = [];
  for (const { field_key, answer_options } of pairs) {
    for (const answer_option of answer_options) {
      const rows = stmt.all(field_key, answer_option, "") as WhyThisMattersRuleRow[];
      results.push(...rows);
    }
  }
  return results;
}

let _whyRulesCsv: WhyThisMattersRuleRow[] | null = null;
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Escaped quotes ""
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function loadWhyRulesCsv(): WhyThisMattersRuleRow[] {
  if (_whyRulesCsv) return _whyRulesCsv;
  const csvPath = path.resolve(process.cwd(), "rules and DB", "check_why_this_matters_rules.csv");
  if (!fs.existsSync(csvPath)) {
    _whyRulesCsv = [];
    return _whyRulesCsv;
  }
  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    _whyRulesCsv = [];
    return _whyRulesCsv;
  }
  const header = parseCsvLine(lines[0]);
  const idx = (k: string) => header.indexOf(k);
  const rows: WhyThisMattersRuleRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const get = (k: string) => cols[idx(k)] ?? "";
    const merge = (get("merge_group") as WhyThisMattersRuleRow["merge_group"]) || "context";
    rows.push({
      check_key: get("check_key"),
      field_key: get("field_key"),
      answer_option: get("answer_option"),
      test_bundle: get("test_bundle") || null,
      trigger_type: get("trigger_type"),
      trigger_key: get("trigger_key"),
      priority_weight: Number(get("priority_weight") || 0),
      merge_group: merge,
      max_occurrences: Number(get("max_occurrences") || 1),
      explanation_template: get("explanation_template"),
      mechanism: get("mechanism") || null,
      test_focus: get("test_focus") || null,
      priority_rationale: get("priority_rationale") || null,
    });
  }
  _whyRulesCsv = rows.filter((r) => r.check_key && r.field_key && r.answer_option && r.explanation_template);
  return _whyRulesCsv;
}

function getWhyThisMattersRulesForAnswersFromCsv(
  pairs: Array<{ field_key: string; answer_options: string[] }>,
): WhyThisMattersRuleRow[] {
  const all = loadWhyRulesCsv();
  if (!all.length) return [];
  const results: WhyThisMattersRuleRow[] = [];
  for (const { field_key, answer_options } of pairs) {
    for (const answer_option of answer_options) {
      for (const r of all) {
        if (r.field_key !== field_key) continue;
        if (r.answer_option !== answer_option) continue;
        results.push(r);
      }
    }
  }
  return results;
}

export function getSignalExplanationsForAnswers(
  pairs: Array<{ field_key: string; answer_options: string[] }>,
): SignalExplanation[] {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT field_key, answer_option, test_bundle, signal_source, signal_label, signal_explanation, default_priority_boost
     FROM answer_signal_explanations WHERE field_key=? AND answer_option=?`,
  );
  const results: SignalExplanation[] = [];
  const seen = new Set<string>();
  for (const { field_key, answer_options } of pairs) {
    for (const answer_option of answer_options) {
      const key = `${field_key}::${answer_option}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const rows = stmt.all(field_key, answer_option) as SignalExplanation[];
      results.push(...rows);
    }
  }
  return results;
}

export function getIncludedTestsForChecks(checkKeys: string[]): IncludedTestRow[] {
  if (!checkKeys.length) return [];
  const db = getDb();
  const placeholders = checkKeys.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT DISTINCT check_key, included_category, biomarker_name, priority_tier, why_included
       FROM check_included_tests WHERE check_key IN (${placeholders}) ORDER BY check_key, included_category, biomarker_name`,
    )
    .all(...checkKeys) as IncludedTestRow[];
}

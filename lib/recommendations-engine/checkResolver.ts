import {
  getRulesForAnswers,
  getAllCanonicalChecks,
  getSignalExplanationsForAnswers,
  getIncludedTestsForChecks,
  getWhyThisMattersRulesForAnswers,
  type EnrichedRuleRow,
  type SignalExplanation,
  type WhyThisMattersRuleRow,
} from "./sqliteRules";
import { mapAnswersToSqlite } from "./answerMapper";
import type {
  ImpactLevel,
  IncludedTestsCategory,
  MatchedBiomarker,
  RelevanceSignal,
} from "./types";

const STRENGTH_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

function scoreToImpact(score: number): ImpactLevel {
  if (score >= 8) return "HIGH IMPACT";
  if (score >= 4) return "MEDIUM IMPACT";
  return "LOW IMPACT";
}

function capImpactByBiomarkerCount(
  impact: ImpactLevel,
  biomarkerCount: number,
): ImpactLevel {
  // Product constraint: HIGH IMPACT should never imply >10 biomarkers for the user.
  // If a check expands beyond 10 biomarkers, downgrade the impact label.
  if (impact !== "HIGH IMPACT") return impact;
  if (biomarkerCount <= 10) return impact;
  if (biomarkerCount <= 20) return "MEDIUM IMPACT";
  return "LOW IMPACT";
}

function buildWhyText(signals: RelevanceSignal[]): string {
  if (!signals.length) return "Recommended based on your health profile.";
  const parts = signals
    .slice(0, 3)
    .map((s) => s.explanation)
    .filter(Boolean);
  if (!parts.length) return "Recommended based on your health profile.";
  return `This is recommended because ${parts.join(" ")}`;
}

function buildWhyThisMattersFromRules(rules: WhyThisMattersRuleRow[]): string | null {
  if (!rules.length) return null;
  const sorted = [...rules].sort((a, b) => (b.priority_weight ?? 0) - (a.priority_weight ?? 0));

  const pick = (group: WhyThisMattersRuleRow["merge_group"], limit: number) =>
    sorted.filter((r) => r.merge_group === group).slice(0, limit);

  const drivers = pick("driver", 2);
  const modifier = pick("modifier", 1);
  const context = pick("context", 1);

  const parts = [...drivers, ...modifier, ...context]
    .map((r) => (r.explanation_template ?? "").trim())
    .filter(Boolean);

  if (!parts.length) return null;

  // Keep it short: 1–2 sentences.
  const text = parts.join(" ").replaceAll(/\s+/g, " ").trim();
  return text.length > 2 ? text : null;
}

export interface ResolvedCheckBase {
  checkKey: string;
  checkName: string;
  isScreening: boolean;
  priorityRank: number;
  impact: ImpactLevel;
  score: number;
  recommendedTiming: string;
  shortSummary: string;
  whyForYou: string;
  whyNow: string;
  canWait: string | null;
  nextAction: string | null;
  relevanceSignals: RelevanceSignal[];
  includedTestsPreview: string[];
  includedTestsByCategory: IncludedTestsCategory[];
  matchedBiomarkers: MatchedBiomarker[];
}

/**
 * Resolves which canonical checks are triggered for a set of raw survey answers
 * and enriches each with scoring, signals, biomarkers, and included test categories.
 * Does NOT set user state (status/timeframe/reminders/results) — merged in by the service layer.
 */
export function resolveChecks(
  answers: Array<{ questionKey: string; answerValue: unknown }>,
): ResolvedCheckBase[] {
  const mapped = mapAnswersToSqlite(answers);

  const rules = getRulesForAnswers(mapped);
  const signalRows = getSignalExplanationsForAnswers(mapped);
  const whyMattersRows = getWhyThisMattersRulesForAnswers(mapped);
  const canonicalChecks = getAllCanonicalChecks();
  const canonicalByKey = new Map(canonicalChecks.map((c) => [c.check_key, c]));

  // ── Aggregate rules by check_key ───────────────────────────────────────────
  type CheckAccumulator = {
    rules: EnrichedRuleRow[];
    biomarkerNames: Set<string>;
    totalBaseScore: number;
    seenRuleKeys: Set<string>;
  };

  const byCheck = new Map<string, CheckAccumulator>();

  for (const rule of rules) {
    if (!rule.check_key) continue;
    if (!byCheck.has(rule.check_key)) {
      byCheck.set(rule.check_key, {
        rules: [],
        biomarkerNames: new Set(),
        totalBaseScore: 0,
        seenRuleKeys: new Set(),
      });
    }
    const acc = byCheck.get(rule.check_key)!;
    acc.rules.push(rule);
    if (rule.biomarker_name) acc.biomarkerNames.add(rule.biomarker_name);
    // Deduplicate: each (biomarker_id, field_key, answer_option) counts once per check.
    const dedupeKey = `${rule.biomarker_id ?? rule.biomarker_name}::${rule.field_key}::${rule.answer_option}`;
    if (!acc.seenRuleKeys.has(dedupeKey)) {
      acc.seenRuleKeys.add(dedupeKey);
      acc.totalBaseScore += STRENGTH_WEIGHT[rule.rule_strength] ?? 1;
    }
  }

  // ── Build signal boost map keyed by check_key ──────────────────────────────
  const signalBoostByCheck = new Map<string, number>();
  const signalsByCheck = new Map<string, SignalExplanation[]>();

  for (const sig of signalRows) {
    // triggered_check_keys is stored as a comma-separated list (may be null).
    // We try to get it from the DB row if available; otherwise broadcast to all.
    const sigAny = sig as SignalExplanation & { triggered_check_keys?: string | null };
    const triggeredKeys: string[] | null =
      sigAny.triggered_check_keys
        ? sigAny.triggered_check_keys.split(",").map((k) => k.trim()).filter(Boolean)
        : null;

    const targetKeys =
      triggeredKeys && triggeredKeys.length > 0
        ? triggeredKeys
        : Array.from(byCheck.keys()); // apply to all matched checks if no filter

    for (const ck of targetKeys) {
      if (!byCheck.has(ck)) continue;
      signalBoostByCheck.set(ck, (signalBoostByCheck.get(ck) ?? 0) + (sig.default_priority_boost ?? 0));
      if (!signalsByCheck.has(ck)) signalsByCheck.set(ck, []);
      signalsByCheck.get(ck)!.push(sig);
    }
  }

  // ── Load included tests ────────────────────────────────────────────────────
  const checkKeys = Array.from(byCheck.keys());
  const includedTestRows = getIncludedTestsForChecks(checkKeys);

  // Group included tests by check_key → category → biomarker names
  const includedByCk = new Map<string, Map<string, Set<string>>>();
  for (const row of includedTestRows) {
    if (!includedByCk.has(row.check_key)) includedByCk.set(row.check_key, new Map());
    const catMap = includedByCk.get(row.check_key)!;
    if (!catMap.has(row.included_category)) catMap.set(row.included_category, new Set());
    catMap.get(row.included_category)!.add(row.biomarker_name);
  }

  // Also build matched biomarkers per check_key from included test rows
  const biomarkersByCk = new Map<string, IncludedTestRow[]>();
  type IncludedTestRow = typeof includedTestRows[0];
  for (const row of includedTestRows) {
    if (!biomarkersByCk.has(row.check_key)) biomarkersByCk.set(row.check_key, []);
    biomarkersByCk.get(row.check_key)!.push(row);
  }

  // ── Assemble final check recommendations ──────────────────────────────────
  const result: ResolvedCheckBase[] = [];

  // Group personalized why-this-matters rules by check_key
  const whyMattersByCheck = new Map<string, WhyThisMattersRuleRow[]>();
  for (const r of whyMattersRows) {
    if (!r.check_key) continue;
    if (!whyMattersByCheck.has(r.check_key)) whyMattersByCheck.set(r.check_key, []);
    whyMattersByCheck.get(r.check_key)!.push(r);
  }

  for (const [checkKey, acc] of byCheck) {
    const canon = canonicalByKey.get(checkKey);
    if (!canon) continue; // only return canonical checks

    const baseScore = acc.totalBaseScore;
    const signalBoost = signalBoostByCheck.get(checkKey) ?? 0;
    const score = baseScore + signalBoost;
    let impact = scoreToImpact(score);

    // Relevance signals — deduplicated by (source+label)
    const sigSeen = new Set<string>();
    const relevanceSignals: RelevanceSignal[] = [];
    for (const sig of signalsByCheck.get(checkKey) ?? []) {
      const key = `${sig.signal_source}::${sig.signal_label}`;
      if (sigSeen.has(key)) continue;
      sigSeen.add(key);
      relevanceSignals.push({
        source: sig.signal_source,
        label: sig.signal_label,
        explanation: sig.signal_explanation,
      });
    }

    // Included tests — max 6 categories, max 6 items per category
    const includedTestsByCategory: IncludedTestsCategory[] = [];
    const includedTestsPreview: string[] = [];
    const catMap = includedByCk.get(checkKey);
    if (catMap) {
      let catCount = 0;
      for (const [category, names] of catMap) {
        if (catCount >= 6) break;
        const tests = Array.from(names);
        includedTestsByCategory.push({
          category,
          tests: tests.slice(0, 12),
        });
        for (const t of tests) {
          if (includedTestsPreview.length >= 3) break;
          if (!includedTestsPreview.includes(t)) includedTestsPreview.push(t);
        }
        catCount++;
      }
    }

    // Matched biomarkers (from rules rows for this check)
    const biomarkerSeen = new Set<string>();
    const matchedBiomarkers: MatchedBiomarker[] = [];
    for (const row of acc.rules) {
      if (!row.biomarker_name || biomarkerSeen.has(row.biomarker_name)) continue;
      biomarkerSeen.add(row.biomarker_name);
      matchedBiomarkers.push({
        name: row.biomarker_name,
        category: row.biomarker_category ?? "",
        whyIncluded: row.why_included ?? "",
        priority: row.priority_tier ?? "extended",
      });
    }

    impact = capImpactByBiomarkerCount(impact, matchedBiomarkers.length);

    const whyForYou =
      buildWhyThisMattersFromRules(whyMattersByCheck.get(checkKey) ?? []) ??
      buildWhyText(relevanceSignals);

    result.push({
      checkKey,
      checkName: canon.display_name,
      isScreening: canon.is_screening === 1,
      priorityRank: 0, // will be set after sorting
      impact,
      score,
      recommendedTiming: canon.recommended_timing,
      shortSummary: canon.short_summary,
      whyForYou,
      whyNow: canon.priority_rule,
      canWait: canon.what_can_wait,
      nextAction: canon.next_action,
      relevanceSignals,
      includedTestsPreview,
      includedTestsByCategory,
      matchedBiomarkers,
    });
  }

  // Sort: by score desc, then canonical ui_priority_order
  result.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    const aOrder = canonicalByKey.get(a.checkKey)?.ui_priority_order ?? 99;
    const bOrder = canonicalByKey.get(b.checkKey)?.ui_priority_order ?? 99;
    return aOrder - bOrder;
  });

  // Assign priority ranks
  result.forEach((c, i) => {
    c.priorityRank = i + 1;
  });

  return result;
}

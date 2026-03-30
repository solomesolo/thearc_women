/**
 * Layer 5 — Key Area State Resolution
 *
 * Selects the final state for each key area by evaluating all applicable
 * resolution rules against the influence graph and active signal set.
 *
 * Tie-break order (deterministic):
 *   1. rule_priority (higher = checked first, first match wins)
 *   2. confidenceAdjustedScore (higher wins on equal priority)
 *   3. rule name alpha sort (stable)
 */

import type {
  KeyAreaResult,
  KeyAreaResolutionRule,
  InfluenceGraph,
  DerivedSignalResult,
  LifeStageScope,
  ConfidenceBand,
  SuppressedCandidate,
  RuleEvalContext,
} from '../types';
import { evaluateRuleJson } from '../rules/evaluateRuleJson';

const CONFIDENCE_ORDER: ConfidenceBand[] = ['low', 'medium', 'high'];

function confidenceGte(a: ConfidenceBand, b: ConfidenceBand): boolean {
  return CONFIDENCE_ORDER.indexOf(a) >= CONFIDENCE_ORDER.indexOf(b);
}

function scopeApplies(scope: string, lifeStage: LifeStageScope): boolean {
  return scope === 'all' || scope === lifeStage;
}

/** Collect all distinct key area codes from rules. */
function allKeyAreaCodes(rules: KeyAreaResolutionRule[]): string[] {
  return [...new Set(rules.map((r) => r.keyAreaCode))];
}

/** Build signal lookup for fast access during rule evaluation. */
function buildSignalLookup(signals: DerivedSignalResult[]): Record<string, DerivedSignalResult> {
  const map: Record<string, DerivedSignalResult> = {};
  for (const s of signals) map[s.signalCode] = s;
  return map;
}

/**
 * Check whether all required_signals are active for this rule.
 * Returns false if any required signal is not active.
 */
function requiredSignalsMet(
  rule: KeyAreaResolutionRule,
  signalMap: Record<string, DerivedSignalResult>
): boolean {
  return rule.requiredSignals.every((code) => signalMap[code]?.isActive === true);
}

/**
 * Check whether any excluded signal is active — if so, this rule is blocked.
 */
function excludedSignalsFired(
  rule: KeyAreaResolutionRule,
  signalMap: Record<string, DerivedSignalResult>
): boolean {
  return rule.excludedSignals.some((code) => signalMap[code]?.isActive === true);
}

/**
 * Compute the aggregate supporting score for this rule from the influence graph.
 */
function computeRuleScore(
  rule: KeyAreaResolutionRule,
  influence: InfluenceGraph
): number {
  const dest = influence.keyAreas[rule.keyAreaCode];
  if (!dest) return 0;
  // Sum contributions only from the signals named in supporting_signals
  const sigSet = new Set(rule.supportingSignals);
  if (sigSet.size === 0) return dest.confidenceAdjustedScore;
  return dest.contributions
    .filter((c) => sigSet.has(c.signalCode))
    .reduce((sum, c) => sum + c.finalContribution, 0);
}

/**
 * Derive confidence for a resolved key area from the influence graph.
 */
function deriveKeyAreaConfidence(
  dest: InfluenceGraph['keyAreas'][string] | undefined,
  rule: KeyAreaResolutionRule
): ConfidenceBand {
  if (!dest) return 'low';
  const primaryCount = dest.contributions.filter((c) => c.influenceType === 'primary').length;
  if (primaryCount >= 2 && dest.confidenceAdjustedScore >= 3) return 'high';
  if (primaryCount >= 1 || dest.confidenceAdjustedScore >= 1.5) return 'medium';
  return 'low';
}

/** Build the RuleEvalContext for optional rule_json gate evaluation. */
function buildCtx(
  signalMap: Record<string, DerivedSignalResult>
): RuleEvalContext {
  return {
    answers: {},
    signals: Object.fromEntries(
      Object.entries(signalMap).map(([code, s]) => [
        code,
        { isActive: s.isActive, signalStrength: s.signalStrength, confidence: s.confidence },
      ])
    ),
  };
}

export function resolveKeyAreas(
  influenceGraph: InfluenceGraph,
  signals: DerivedSignalResult[],
  lifeStage: LifeStageScope,
  rules: KeyAreaResolutionRule[]
): KeyAreaResult[] {
  const signalMap = buildSignalLookup(signals);
  const ctx = buildCtx(signalMap);
  const allCodes = allKeyAreaCodes(rules);
  const results: KeyAreaResult[] = [];

  for (const keyAreaCode of allCodes) {
    const areaRules = rules
      .filter((r) => r.keyAreaCode === keyAreaCode)
      .filter((r) => scopeApplies(r.lifeStageScope, lifeStage))
      .sort((a, b) => {
        // Primary sort: rule_priority desc
        if (b.rulePriority !== a.rulePriority) return b.rulePriority - a.rulePriority;
        // Secondary sort: score desc
        const sa = computeRuleScore(a, influenceGraph);
        const sb = computeRuleScore(b, influenceGraph);
        if (sb !== sa) return sb - sa;
        // Tie-break: rule name alpha
        return a.ruleName.localeCompare(b.ruleName);
      });

    let resolved: KeyAreaResolutionRule | null = null;
    const suppressedCandidates: SuppressedCandidate[] = [];

    for (const rule of areaRules) {
      // Required signals gate
      if (!requiredSignalsMet(rule, signalMap)) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: computeRuleScore(rule, influenceGraph),
          reason: `required_signals_not_met:${rule.requiredSignals.filter((c) => !signalMap[c]?.isActive).join(',')}`,
        });
        continue;
      }

      // Excluded signals gate
      if (excludedSignalsFired(rule, signalMap)) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: computeRuleScore(rule, influenceGraph),
          reason: `excluded_signal_active:${rule.excludedSignals.filter((c) => signalMap[c]?.isActive).join(',')}`,
        });
        continue;
      }

      // Minimum weight gate
      const ruleScore = computeRuleScore(rule, influenceGraph);
      if (ruleScore < rule.minimumTotalWeight) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: ruleScore,
          reason: `score_${ruleScore}_below_min_${rule.minimumTotalWeight}`,
        });
        continue;
      }

      // Confidence gate
      const actualConf = deriveKeyAreaConfidence(influenceGraph.keyAreas[keyAreaCode], rule);
      if (!confidenceGte(actualConf, rule.minimumConfidence)) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: ruleScore,
          reason: `confidence_${actualConf}_below_min_${rule.minimumConfidence}`,
        });
        continue;
      }

      // Optional rule_json gate
      if (rule.ruleJson) {
        const eval_ = evaluateRuleJson(rule.ruleJson, ctx);
        if (!eval_.result) {
          suppressedCandidates.push({
            stateCode: rule.stateCode,
            ruleName: rule.ruleName,
            score: ruleScore,
            reason: `rule_json_failed:${eval_.unmatched.slice(0, 3).join(',')}`,
          });
          continue;
        }
      }

      // First rule that passes all gates wins
      resolved = rule;
      break;
    }

    const dest = influenceGraph.keyAreas[keyAreaCode];
    const score = dest?.confidenceAdjustedScore ?? 0;
    const confidence = resolved
      ? deriveKeyAreaConfidence(dest, resolved)
      : 'low';

    // Fallback state: stable if no rule resolved
    const resolvedStateCode = resolved?.stateCode ?? 'stable';
    const ruleApplied = resolved?.ruleName ?? 'fallback:stable';

    const contributingSignals = dest?.contributions.map((c) => c.signalCode) ?? [];

    // Explanation candidates: rule names from suppressed + resolved
    const explanationCandidates = [
      ...(resolved ? [resolved.resolutionLogic] : []),
      ...suppressedCandidates.slice(0, 3).map((s) => s.reason),
    ].filter(Boolean);

    results.push({
      keyAreaCode,
      resolvedStateCode,
      score,
      confidence,
      contributingSignals,
      suppressedStateCandidates: suppressedCandidates,
      explanationCandidates,
      ruleApplied,
    });
  }

  // Stable sort by key area code for deterministic output
  results.sort((a, b) => a.keyAreaCode.localeCompare(b.keyAreaCode));
  return results;
}

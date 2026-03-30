/**
 * Layer 5b — Body System State Resolution
 *
 * Same pattern as resolveKeyAreas but operates on body_system_code.
 * State codes: 'stable' | 'variable' | 'needs_attention'
 */

import type {
  BodySystemResult,
  BodySystemResolutionRule,
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

function buildSignalLookup(signals: DerivedSignalResult[]): Record<string, DerivedSignalResult> {
  const map: Record<string, DerivedSignalResult> = {};
  for (const s of signals) map[s.signalCode] = s;
  return map;
}

function buildCtx(signalMap: Record<string, DerivedSignalResult>): RuleEvalContext {
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

function allBodySystemCodes(rules: BodySystemResolutionRule[]): string[] {
  return [...new Set(rules.map((r) => r.bodySystemCode))];
}

function computeRuleScore(rule: BodySystemResolutionRule, influence: InfluenceGraph): number {
  const dest = influence.bodySystems[rule.bodySystemCode];
  if (!dest) return 0;
  const sigSet = new Set(rule.supportingSignals);
  if (sigSet.size === 0) return dest.confidenceAdjustedScore;
  return dest.contributions
    .filter((c) => sigSet.has(c.signalCode))
    .reduce((sum, c) => sum + c.finalContribution, 0);
}

function deriveConfidence(
  dest: InfluenceGraph['bodySystems'][string] | undefined
): ConfidenceBand {
  if (!dest) return 'low';
  const primaryCount = dest.contributions.filter((c) => c.influenceType === 'primary').length;
  if (primaryCount >= 2 && dest.confidenceAdjustedScore >= 3) return 'high';
  if (primaryCount >= 1 || dest.confidenceAdjustedScore >= 1.5) return 'medium';
  return 'low';
}

export function resolveBodySystems(
  influenceGraph: InfluenceGraph,
  signals: DerivedSignalResult[],
  lifeStage: LifeStageScope,
  rules: BodySystemResolutionRule[]
): BodySystemResult[] {
  const signalMap = buildSignalLookup(signals);
  const ctx = buildCtx(signalMap);
  const allCodes = allBodySystemCodes(rules);
  const results: BodySystemResult[] = [];

  for (const bodySystemCode of allCodes) {
    const areaRules = rules
      .filter((r) => r.bodySystemCode === bodySystemCode)
      .filter((r) => scopeApplies(r.lifeStageScope, lifeStage))
      .sort((a, b) => {
        if (b.rulePriority !== a.rulePriority) return b.rulePriority - a.rulePriority;
        return computeRuleScore(b, influenceGraph) - computeRuleScore(a, influenceGraph);
      });

    let resolved: BodySystemResolutionRule | null = null;
    const suppressedCandidates: SuppressedCandidate[] = [];

    for (const rule of areaRules) {
      if (!rule.requiredSignals.every((c) => signalMap[c]?.isActive)) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: computeRuleScore(rule, influenceGraph),
          reason: `required_signals_not_met`,
        });
        continue;
      }
      if (rule.excludedSignals.some((c) => signalMap[c]?.isActive)) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: computeRuleScore(rule, influenceGraph),
          reason: `excluded_signal_active`,
        });
        continue;
      }
      const ruleScore = computeRuleScore(rule, influenceGraph);
      if (ruleScore < rule.minimumTotalWeight) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: ruleScore,
          reason: `score_below_min`,
        });
        continue;
      }
      const dest = influenceGraph.bodySystems[bodySystemCode];
      const actualConf = deriveConfidence(dest);
      if (!confidenceGte(actualConf, rule.minimumConfidence)) {
        suppressedCandidates.push({
          stateCode: rule.stateCode,
          ruleName: rule.ruleName,
          score: ruleScore,
          reason: `confidence_below_min`,
        });
        continue;
      }
      if (rule.ruleJson) {
        const eval_ = evaluateRuleJson(rule.ruleJson, ctx);
        if (!eval_.result) {
          suppressedCandidates.push({
            stateCode: rule.stateCode,
            ruleName: rule.ruleName,
            score: ruleScore,
            reason: `rule_json_failed`,
          });
          continue;
        }
      }
      resolved = rule;
      break;
    }

    const dest = influenceGraph.bodySystems[bodySystemCode];
    results.push({
      bodySystemCode,
      resolvedStateCode: resolved?.stateCode ?? 'stable',
      score: dest?.confidenceAdjustedScore ?? 0,
      confidence: deriveConfidence(dest),
      contributingSignals: dest?.contributions.map((c) => c.signalCode) ?? [],
      suppressedStateCandidates: suppressedCandidates,
      explanationCandidates: resolved ? [resolved.resolutionLogic] : [],
      ruleApplied: resolved?.ruleName ?? 'fallback:stable',
    });
  }

  results.sort((a, b) => a.bodySystemCode.localeCompare(b.bodySystemCode));
  return results;
}

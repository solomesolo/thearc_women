/**
 * Layer 2 — Derived Signal Resolution
 *
 * Evaluates DB-loaded derived_signal_flags rules against normalized answers.
 * For each rule: evaluates rule_json, applies life-stage modifier, determines
 * signal strength and confidence, attaches supporting answers and debug trace.
 *
 * Inactive signals are still included in output (isActive = false) so they
 * can be shown in "ruled out" explanations.
 */

import type {
  DerivedSignalResult,
  DerivedSignalFlagRule,
  NormalizedAnswerMap,
  LifeStageScope,
  SignalStrength,
  ConfidenceBand,
  RuleEvalContext,
  SignalSupportingAnswer,
  SignalDebugTrace,
} from '../types';
import { evaluateRuleJson } from '../rules/evaluateRuleJson';

const STRENGTH_LEVELS: SignalStrength[] = ['mild', 'moderate', 'strong'];

function strengthIndex(s: SignalStrength): number {
  return STRENGTH_LEVELS.indexOf(s);
}

function clampStrength(s: string): SignalStrength {
  if (s === 'moderate' || s === 'strong') return s;
  return 'mild';
}

/** Determine strength from trigger_score and rule thresholds. */
function computeStrength(
  triggerScore: number,
  rule: DerivedSignalFlagRule,
  lifeStage: LifeStageScope
): SignalStrength {
  let strength = clampStrength(rule.defaultStrength);

  // Apply life-stage modifier if scoped
  if (rule.lifeStageModifier) {
    for (const mod of rule.lifeStageModifier) {
      if (mod.scope === 'all' || mod.scope === lifeStage) {
        if (mod.strengthDelta && mod.strengthDelta !== 'none') {
          const idx = strengthIndex(strength);
          if (mod.strengthDelta === 'up') {
            strength = STRENGTH_LEVELS[Math.min(2, idx + 1)]!;
          } else if (mod.strengthDelta === 'down') {
            strength = STRENGTH_LEVELS[Math.max(0, idx - 1)]!;
          }
        }
      }
    }
  }

  // Override based on score thresholds if confidence_rule has strength overrides
  const cr = rule.confidenceRule as Record<string, unknown> | null;
  if (cr && typeof cr === 'object') {
    if (typeof cr.strong_threshold === 'number' && triggerScore >= cr.strong_threshold) {
      strength = 'strong';
    } else if (typeof cr.moderate_threshold === 'number' && triggerScore >= cr.moderate_threshold) {
      strength = 'moderate';
    }
  }

  return strength;
}

/** Determine confidence from supporting answers and contradictions. */
function computeConfidence(
  supportingAnswers: SignalSupportingAnswer[],
  exclusionsTriggered: string[],
  rule: DerivedSignalFlagRule,
  normalizedAnswers: NormalizedAnswerMap,
  reasons: string[]
): ConfidenceBand {
  const sourceCount = rule.sourceVariables.filter((v) => normalizedAnswers[v] !== undefined).length;
  const hasContradiction = exclusionsTriggered.length > 0;
  const highContribCount = supportingAnswers.filter((a) => a.contribution >= 0.5).length;

  if (hasContradiction) {
    reasons.push('contradiction_present → low');
    return 'low';
  }

  // Check explicit confidence_rule overrides
  const cr = rule.confidenceRule as Record<string, unknown> | null;
  if (cr && typeof cr === 'object') {
    if (typeof cr.high_threshold === 'number' && highContribCount >= cr.high_threshold) {
      reasons.push(`high_contrib_count=${highContribCount} >= threshold=${cr.high_threshold}`);
      return 'high';
    }
    if (typeof cr.medium_threshold === 'number' && highContribCount >= cr.medium_threshold) {
      reasons.push(`medium_contrib_count=${highContribCount} >= threshold=${cr.medium_threshold}`);
      return 'medium';
    }
  }

  // Default heuristic: coverage of source variables
  if (sourceCount >= 3 && highContribCount >= 2) {
    reasons.push(`source_coverage=${sourceCount} high_contrib=${highContribCount} → high`);
    return 'high';
  }
  if (sourceCount >= 2 || highContribCount >= 1) {
    reasons.push(`source_coverage=${sourceCount} high_contrib=${highContribCount} → medium`);
    return 'medium';
  }
  reasons.push(`source_coverage=${sourceCount} → low`);
  return 'low';
}

/** Build list of supporting answers with their contribution weight. */
function buildSupportingAnswers(
  rule: DerivedSignalFlagRule,
  normalizedAnswers: NormalizedAnswerMap,
  matchedConditions: string[]
): SignalSupportingAnswer[] {
  const out: SignalSupportingAnswer[] = [];
  for (const varCode of rule.sourceVariables) {
    const ans = normalizedAnswers[varCode];
    if (!ans) continue;
    // Contribution: 1.0 if this variable's condition matched, 0.3 if present but not key
    const isMatched = matchedConditions.some((c) => c.includes(varCode));
    out.push({
      questionCode: varCode,
      value: ans.normalizedValue,
      contribution: isMatched ? 1.0 : 0.3,
      rationale: isMatched ? 'condition_matched' : 'variable_present',
    });
  }
  return out;
}

/** Evaluate whether exclusion conditions fire. Returns codes of triggered exclusions. */
function checkExclusions(
  rule: DerivedSignalFlagRule,
  ctx: RuleEvalContext
): string[] {
  if (!rule.exclusionConditions) return [];
  const result = evaluateRuleJson(rule.exclusionConditions, ctx);
  if (result.result) return ['exclusion_rule_matched'];
  return [];
}

/**
 * Resolve all derived signals from normalized answers.
 * Returns one result per rule (active + inactive).
 */
export function resolveDerivedSignals(
  normalizedAnswers: NormalizedAnswerMap,
  lifeStage: LifeStageScope,
  rules: DerivedSignalFlagRule[]
): DerivedSignalResult[] {
  const ctx: RuleEvalContext = { answers: normalizedAnswers };

  const results: DerivedSignalResult[] = [];

  for (const rule of rules) {
    // Skip rules not applicable to this life stage
    const scope = rule.lifeStageModifier?.find((m) => m.scope !== 'all')?.scope;
    if (scope && scope !== lifeStage && scope !== 'all') {
      // Rule has a non-all scope that doesn't match — skip entirely only if it's an
      // exclusion-type rule. For signal activation, continue but apply modifier.
    }

    // Evaluate primary rule
    const evalResult = evaluateRuleJson(rule.ruleJson, ctx);
    const isActive = evalResult.result;

    // Evaluate exclusions even for active signals
    const exclusionsTriggered = isActive ? checkExclusions(rule, ctx) : [];
    const activeAfterExclusions = isActive && exclusionsTriggered.length === 0;

    // Compute trigger score (simple: count of matched conditions × 10)
    const triggerScore = evalResult.matched.length * 10;

    const supportingAnswers = buildSupportingAnswers(rule, normalizedAnswers, evalResult.matched);

    // Determine strength and confidence only for active signals
    const confidenceReasons: string[] = [];
    const signalStrength = activeAfterExclusions
      ? computeStrength(triggerScore, rule, lifeStage)
      : null;
    const confidence = activeAfterExclusions
      ? computeConfidence(supportingAnswers, exclusionsTriggered, rule, normalizedAnswers, confidenceReasons)
      : 'low';

    // Determine applied life-stage modifier label
    let lifeStageModifierApplied: string | null = null;
    if (rule.lifeStageModifier && lifeStage !== 'unknown') {
      const mod = rule.lifeStageModifier.find(
        (m) => m.scope === lifeStage || m.scope === 'all'
      );
      if (mod) lifeStageModifierApplied = `${mod.scope}:delta=${mod.thresholdDelta}`;
    }

    const debugTrace: SignalDebugTrace = {
      evaluatedRule: rule.ruleJson,
      matchedConditions: evalResult.matched,
      unmatchedConditions: evalResult.unmatched,
      confidenceReason: confidenceReasons,
      suppressionReason: exclusionsTriggered.length > 0 ? exclusionsTriggered : undefined,
      rawTriggerScore: triggerScore,
      strengthDetermination: signalStrength
        ? `${signalStrength} from score=${triggerScore}`
        : 'inactive',
    };

    results.push({
      signalCode: rule.signalCode,
      isActive: activeAfterExclusions,
      signalStrength,
      confidence,
      lifeStageModifierApplied,
      supportingAnswers,
      exclusionsTriggered,
      triggerScore,
      debugTrace,
    });
  }

  // Stable sort: active first, then by triggerScore desc, then alphabetically
  results.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (b.triggerScore !== a.triggerScore) return b.triggerScore - a.triggerScore;
    return a.signalCode.localeCompare(b.signalCode);
  });

  return results;
}

/**
 * Layer 7 — Dashboard Explainer Generation
 *
 * Reads approved signal_explainer_map rules and generates plain-language
 * explanations for active signals (positive drivers), inactive signals that
 * were checked (ruled_out_driver), and contextual modifiers.
 *
 * Safe language rules:
 * - Never use diagnosis language
 * - Never use disease names
 * - Never assert certainty beyond the evidence
 * - Prefer: "may be contributing", "appears linked", "does not look like the main driver"
 */

import type {
  ExplainerBundle,
  ExplainerEntry,
  DerivedSignalResult,
  KeyAreaResult,
  BodySystemResult,
  HeroResult,
  NormalizedAnswerMap,
  SignalExplainerRule,
  ExplanationType,
  RuleEvalContext,
} from '../types';
import { evaluateRuleJson } from '../rules/evaluateRuleJson';

/** Fill template placeholders from normalized answers. */
function fillTemplate(
  template: string,
  answers: NormalizedAnswerMap
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const ans = answers[key];
    if (!ans) return '{{' + key + '}}';
    return String(ans.normalizedValue ?? ans.rawValue ?? '');
  });
}

function buildCtx(
  answers: NormalizedAnswerMap,
  signalMap: Record<string, DerivedSignalResult>
): RuleEvalContext {
  return {
    answers,
    signals: Object.fromEntries(
      Object.entries(signalMap).map(([code, s]) => [
        code,
        { isActive: s.isActive, signalStrength: s.signalStrength, confidence: s.confidence },
      ])
    ),
  };
}

function ruleApplies(
  rule: SignalExplainerRule,
  ctx: RuleEvalContext,
  answers: NormalizedAnswerMap
): boolean {
  // All required supporting answers must exist
  for (const reqAnswer of rule.requiredSupportingAnswers) {
    if (!answers[reqAnswer]) return false;
  }
  // Optional conditions gate
  if (rule.conditionsJson) {
    return evaluateRuleJson(rule.conditionsJson, ctx).result;
  }
  return true;
}

export function generateDashboardExplainers(params: {
  signals: DerivedSignalResult[];
  keyAreas: KeyAreaResult[];
  bodySystems: BodySystemResult[];
  hero: HeroResult;
  normalizedAnswers: NormalizedAnswerMap;
  explainerRules: SignalExplainerRule[];
}): ExplainerBundle {
  const { signals, keyAreas, bodySystems, hero, normalizedAnswers, explainerRules } = params;

  const signalMap: Record<string, DerivedSignalResult> = {};
  for (const s of signals) signalMap[s.signalCode] = s;

  const ctx = buildCtx(normalizedAnswers, signalMap);

  // Group rules by signal_code for fast lookup
  const rulesBySignal = new Map<string, SignalExplainerRule[]>();
  for (const rule of explainerRules) {
    if (!rulesBySignal.has(rule.signalCode)) rulesBySignal.set(rule.signalCode, []);
    rulesBySignal.get(rule.signalCode)!.push(rule);
  }

  // Helper: generate explainer entries for a signal
  function entriesForSignal(
    signalCode: string,
    signal: DerivedSignalResult | undefined,
    targetType: ExplanationType | null
  ): ExplainerEntry[] {
    const rules = rulesBySignal.get(signalCode) ?? [];
    const entries: ExplainerEntry[] = [];

    for (const rule of rules) {
      // If targetType is specified, only use matching explanation types
      if (targetType && rule.explanationType !== targetType) continue;

      // For active signals: use positive_driver or contextual_modifier
      // For inactive signals: use ruled_out_driver
      const isActive = signal?.isActive ?? false;
      if (isActive && rule.explanationType === 'ruled_out_driver') continue;
      if (!isActive && rule.explanationType === 'positive_driver') continue;

      if (!ruleApplies(rule, ctx, normalizedAnswers)) continue;

      entries.push({
        signalCode,
        explanationType: rule.explanationType,
        text: fillTemplate(rule.templateText, normalizedAnswers),
        priority: rule.priority,
      });
    }

    return entries.sort((a, b) => b.priority - a.priority);
  }

  // ── Hero explainers ────────────────────────────────────────────────────────
  const heroEntries: ExplainerEntry[] = [];
  for (const signalCode of hero.contributingSignals) {
    heroEntries.push(...entriesForSignal(signalCode, signalMap[signalCode], 'positive_driver'));
  }
  // Add ruled-out entries for inactive signals with high trigger scores
  const inactiveNearMiss = signals
    .filter((s) => !s.isActive && s.triggerScore >= 10)
    .sort((a, b) => b.triggerScore - a.triggerScore)
    .slice(0, 3);
  for (const s of inactiveNearMiss) {
    heroEntries.push(...entriesForSignal(s.signalCode, s, 'ruled_out_driver'));
  }
  heroEntries.sort((a, b) => b.priority - a.priority);

  // ── Key area explainers ────────────────────────────────────────────────────
  const keyAreaExplainers: Record<string, ExplainerEntry[]> = {};
  for (const ka of keyAreas) {
    const entries: ExplainerEntry[] = [];
    for (const signalCode of ka.contributingSignals) {
      entries.push(...entriesForSignal(signalCode, signalMap[signalCode], null));
    }
    entries.sort((a, b) => b.priority - a.priority);
    keyAreaExplainers[ka.keyAreaCode] = entries.slice(0, 5);
  }

  // ── Body system explainers ─────────────────────────────────────────────────
  const bodySystemExplainers: Record<string, ExplainerEntry[]> = {};
  for (const bs of bodySystems) {
    const entries: ExplainerEntry[] = [];
    for (const signalCode of bs.contributingSignals) {
      entries.push(...entriesForSignal(signalCode, signalMap[signalCode], null));
    }
    entries.sort((a, b) => b.priority - a.priority);
    bodySystemExplainers[bs.bodySystemCode] = entries.slice(0, 3);
  }

  // ── Global explainers (top active signals) ────────────────────────────────
  const globalEntries: ExplainerEntry[] = [];
  const topActive = signals.filter((s) => s.isActive).slice(0, 5);
  for (const s of topActive) {
    globalEntries.push(...entriesForSignal(s.signalCode, s, 'positive_driver'));
  }
  globalEntries.sort((a, b) => b.priority - a.priority);

  return {
    hero: heroEntries.slice(0, 6),
    keyAreas: keyAreaExplainers,
    bodySystems: bodySystemExplainers,
    global: globalEntries.slice(0, 8),
  };
}

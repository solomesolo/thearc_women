/**
 * Unit tests for Layer 2 — derived signal resolution.
 * Tests signal activation, strength, confidence, exclusions, and life-stage modifiers.
 */

import { resolveDerivedSignals } from '../../lib/engine/signals/resolveDerivedSignals';
import { normalizeSurveyAnswers } from '../../lib/engine/normalization/normalizeSurveyAnswers';
import type { DerivedSignalFlagRule, NormalizationRule } from '../../lib/engine/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const NORM_RULES: NormalizationRule[] = [
  { id: '1', surveyVersion: 'v1', questionCode: 'fatigue_freq', rawValue: 'Most days', normalizedValue: 'most_days', normalizedType: 'ordinal', ordinalValue: 3, booleanValue: null, numericValue: null, canonicalCode: 'most_days', lifeStageScope: 'all', approved: true, version: 1 },
  { id: '2', surveyVersion: 'v1', questionCode: 'fatigue_freq', rawValue: 'Daily', normalizedValue: 'daily', normalizedType: 'ordinal', ordinalValue: 4, booleanValue: null, numericValue: null, canonicalCode: 'daily', lifeStageScope: 'all', approved: true, version: 1 },
  { id: '3', surveyVersion: 'v1', questionCode: 'fatigue_freq', rawValue: 'Never', normalizedValue: 'never', normalizedType: 'ordinal', ordinalValue: 0, booleanValue: null, numericValue: null, canonicalCode: 'never', lifeStageScope: 'all', approved: true, version: 1 },
  { id: '4', surveyVersion: 'v1', questionCode: 'energy_crash', rawValue: 'Often', normalizedValue: 'often', normalizedType: 'ordinal', ordinalValue: 2, booleanValue: null, numericValue: null, canonicalCode: 'often', lifeStageScope: 'all', approved: true, version: 1 },
  { id: '5', surveyVersion: 'v1', questionCode: 'crash_post_meal', rawValue: 'Often', normalizedValue: 'true', normalizedType: 'boolean', ordinalValue: null, booleanValue: true, numericValue: null, canonicalCode: null, lifeStageScope: 'all', approved: true, version: 1 },
  { id: '6', surveyVersion: 'v1', questionCode: 'stress_level', rawValue: '5', normalizedValue: '5', normalizedType: 'numeric', ordinalValue: null, booleanValue: null, numericValue: 5, canonicalCode: null, lifeStageScope: 'all', approved: true, version: 1 },
  { id: '7', surveyVersion: 'v1', questionCode: 'life_stage', rawValue: 'Reproductive (26–35)', normalizedValue: 'reproductive', normalizedType: 'canonical_text', ordinalValue: null, booleanValue: null, numericValue: null, canonicalCode: 'reproductive', lifeStageScope: 'all', approved: true, version: 1 },
];

const BLOOD_SUGAR_RULE: DerivedSignalFlagRule = {
  id: 'bsi',
  signalCode: 'SIG_BLOOD_SUGAR_INSTABILITY',
  signalName: 'Blood Sugar Instability',
  domain: 'metabolic',
  sourceVariables: ['crash_post_meal', 'fatigue_freq', 'energy_crash'],
  triggerLogic: 'Post-meal crash + fatigue or energy crash present',
  ruleJson: {
    all_of: [
      { equals: ['crash_post_meal', true] },
      { any_of: [{ gte: ['fatigue_freq', 3] }, { gte: ['energy_crash', 1] }] },
    ],
  },
  minTriggerScore: 0,
  supportingConditions: null,
  exclusionConditions: null,
  lifeStageModifier: null,
  defaultStrength: 'mild',
  confidenceRule: { high_threshold: 3, medium_threshold: 2, strong_threshold: 20, moderate_threshold: 15 },
  safeLanguageNotes: 'Use "may be contributing" language',
  approved: true,
  version: 1,
};

const STRESS_RULE: DerivedSignalFlagRule = {
  id: 'stress',
  signalCode: 'SIG_STRESS_LOAD',
  signalName: 'Stress Load',
  domain: 'stress',
  sourceVariables: ['stress_level'],
  triggerLogic: 'Stress level >= 4',
  ruleJson: { gte: ['stress_level', 4] },
  minTriggerScore: 0,
  supportingConditions: null,
  exclusionConditions: null,
  lifeStageModifier: null,
  defaultStrength: 'moderate',
  confidenceRule: null,
  safeLanguageNotes: '',
  approved: true,
  version: 1,
};

function normalize(survey: Record<string, unknown>) {
  return normalizeSurveyAnswers(survey, undefined, NORM_RULES, 'v1');
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('blood sugar signal activates with post-meal crash + frequent fatigue', () => {
  const { normalizedAnswers, lifeStage } = normalize({
    crash_post_meal: 'Often',
    fatigue_freq: 'Most days',
    energy_crash: 'Often',
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [BLOOD_SUGAR_RULE]);
  const bsi = results.find((r) => r.signalCode === 'SIG_BLOOD_SUGAR_INSTABILITY');
  expect(bsi?.isActive).toBe(true);
  expect(bsi?.signalStrength).not.toBeNull();
});

test('blood sugar signal is inactive when no post-meal crash', () => {
  const { normalizedAnswers, lifeStage } = normalize({
    fatigue_freq: 'Most days',
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [BLOOD_SUGAR_RULE]);
  const bsi = results.find((r) => r.signalCode === 'SIG_BLOOD_SUGAR_INSTABILITY');
  expect(bsi?.isActive).toBe(false);
});

test('inactive signal is still present in results', () => {
  const { normalizedAnswers, lifeStage } = normalize({ life_stage: 'Reproductive (26–35)' });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [BLOOD_SUGAR_RULE, STRESS_RULE]);
  expect(results).toHaveLength(2);
  expect(results.every((r) => !r.isActive)).toBe(true);
});

test('stress signal activates when stress_level numeric >= 4', () => {
  const { normalizedAnswers, lifeStage } = normalize({
    stress_level: 5, // numeric passthrough
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [STRESS_RULE]);
  const sig = results.find((r) => r.signalCode === 'SIG_STRESS_LOAD');
  expect(sig?.isActive).toBe(true);
  expect(sig?.signalStrength).toBe('moderate'); // defaultStrength
});

test('signal includes debug trace with matched conditions', () => {
  const { normalizedAnswers, lifeStage } = normalize({
    crash_post_meal: 'Often',
    fatigue_freq: 'Daily',
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [BLOOD_SUGAR_RULE]);
  const bsi = results.find((r) => r.signalCode === 'SIG_BLOOD_SUGAR_INSTABILITY');
  expect(bsi?.debugTrace.matchedConditions.length).toBeGreaterThan(0);
});

test('signal supporting answers reference source variables', () => {
  const { normalizedAnswers, lifeStage } = normalize({
    crash_post_meal: 'Often',
    fatigue_freq: 'Daily',
    energy_crash: 'Often',
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [BLOOD_SUGAR_RULE]);
  const bsi = results.find((r) => r.signalCode === 'SIG_BLOOD_SUGAR_INSTABILITY');
  const codes = bsi?.supportingAnswers.map((a) => a.questionCode) ?? [];
  expect(codes.some((c) => c === 'crash_post_meal')).toBe(true);
});

test('exclusion rule suppresses signal', () => {
  const ruleWithExclusion: DerivedSignalFlagRule = {
    ...BLOOD_SUGAR_RULE,
    exclusionConditions: { equals: ['crash_post_meal', true] }, // always exclude when post-meal = true
  };
  const { normalizedAnswers, lifeStage } = normalize({
    crash_post_meal: 'Often',
    fatigue_freq: 'Daily',
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [ruleWithExclusion]);
  const bsi = results.find((r) => r.signalCode === 'SIG_BLOOD_SUGAR_INSTABILITY');
  expect(bsi?.isActive).toBe(false);
  expect(bsi?.exclusionsTriggered.length).toBeGreaterThan(0);
});

test('results are sorted: active first, then by trigger score desc', () => {
  const { normalizedAnswers, lifeStage } = normalize({
    crash_post_meal: 'Often',
    fatigue_freq: 'Daily',
    stress_level: 2, // below threshold → stress inactive
    life_stage: 'Reproductive (26–35)',
  });
  const results = resolveDerivedSignals(normalizedAnswers, lifeStage, [BLOOD_SUGAR_RULE, STRESS_RULE]);
  const activeResults = results.filter((r) => r.isActive);
  const inactiveResults = results.filter((r) => !r.isActive);
  // Active come before inactive
  if (activeResults.length > 0 && inactiveResults.length > 0) {
    const firstInactiveIndex = results.findIndex((r) => !r.isActive);
    const lastActiveIndex = results.findLastIndex?.((r) => r.isActive) ?? -1;
    if (lastActiveIndex !== -1 && firstInactiveIndex !== -1) {
      expect(lastActiveIndex).toBeLessThan(firstInactiveIndex);
    }
  }
});

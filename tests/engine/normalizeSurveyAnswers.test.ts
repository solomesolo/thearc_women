/**
 * Unit tests for survey answer normalization (Layer 1).
 * Uses inline normalization rules — no DB access required.
 */

import { normalizeSurveyAnswers } from '../../lib/engine/normalization/normalizeSurveyAnswers';
import type { NormalizationRule } from '../../lib/engine/types';

// Minimal rule set sufficient for testing
const TEST_RULES: NormalizationRule[] = [
  {
    id: '1', surveyVersion: 'arc_core_intake_v1', questionCode: 'fatigue_freq',
    rawValue: 'Most days', normalizedValue: 'most_days', normalizedType: 'ordinal',
    ordinalValue: 3, booleanValue: null, numericValue: null, canonicalCode: 'most_days',
    lifeStageScope: 'all', approved: true, version: 1,
  },
  {
    id: '2', surveyVersion: 'arc_core_intake_v1', questionCode: 'fatigue_freq',
    rawValue: 'Daily', normalizedValue: 'daily', normalizedType: 'ordinal',
    ordinalValue: 4, booleanValue: null, numericValue: null, canonicalCode: 'daily',
    lifeStageScope: 'all', approved: true, version: 1,
  },
  {
    id: '3', surveyVersion: 'arc_core_intake_v1', questionCode: 'fatigue_freq',
    rawValue: 'Never', normalizedValue: 'never', normalizedType: 'ordinal',
    ordinalValue: 0, booleanValue: null, numericValue: null, canonicalCode: 'never',
    lifeStageScope: 'all', approved: true, version: 1,
  },
  {
    id: '4', surveyVersion: 'arc_core_intake_v1', questionCode: 'crash_post_meal',
    rawValue: 'Often', normalizedValue: 'true', normalizedType: 'boolean',
    ordinalValue: null, booleanValue: true, numericValue: null, canonicalCode: null,
    lifeStageScope: 'all', approved: true, version: 1,
  },
  {
    id: '5', surveyVersion: 'arc_core_intake_v1', questionCode: 'life_stage',
    rawValue: 'Reproductive (26–35)', normalizedValue: 'reproductive', normalizedType: 'canonical_text',
    ordinalValue: null, booleanValue: null, numericValue: null, canonicalCode: 'reproductive',
    lifeStageScope: 'all', approved: true, version: 1,
  },
];

test('maps known categorical answer to ordinal', () => {
  const result = normalizeSurveyAnswers({ fatigue_freq: 'Most days' }, undefined, TEST_RULES);
  const ans = result.normalizedAnswers['fatigue_freq'];
  expect(ans?.ordinalValue).toBe(3);
  expect(ans?.normalizedType).toBe('ordinal');
  expect(ans?.rawValue).toBe('Most days');
});

test('maps boolean answer correctly', () => {
  const result = normalizeSurveyAnswers({ crash_post_meal: 'Often' }, undefined, TEST_RULES);
  const ans = result.normalizedAnswers['crash_post_meal'];
  expect(ans?.booleanValue).toBe(true);
  expect(ans?.normalizedType).toBe('boolean');
});

test('extracts life stage canonical code', () => {
  const result = normalizeSurveyAnswers({ life_stage: 'Reproductive (26–35)' }, undefined, TEST_RULES);
  expect(result.lifeStage).toBe('reproductive');
});

test('numeric passthrough for age_years', () => {
  const result = normalizeSurveyAnswers({ age_years: 30 }, undefined, TEST_RULES);
  const ans = result.normalizedAnswers['age_years'];
  expect(ans?.numericValue).toBe(30);
  expect(ans?.normalizedType).toBe('numeric');
  expect(result.warnings).toHaveLength(0);
});

test('unmapped answer emits warning and marks as unknown', () => {
  const result = normalizeSurveyAnswers({ fatigue_freq: 'Gibberish answer' }, undefined, TEST_RULES);
  const ans = result.normalizedAnswers['fatigue_freq'];
  expect(ans?.normalizedType).toBe('unknown');
  expect(result.warnings.length).toBeGreaterThan(0);
  expect(result.warnings[0]).toMatch(/unmapped_answer/);
});

test('missing answer is skipped with trace entry', () => {
  const result = normalizeSurveyAnswers({ fatigue_freq: null as unknown as string }, undefined, TEST_RULES);
  expect(result.normalizedAnswers['fatigue_freq']).toBeUndefined();
  const traceEntry = result.trace.find((t) => t.questionCode === 'fatigue_freq');
  expect(traceEntry?.outcome).toBe('missing');
});

test('optional labs pass through as numeric', () => {
  const result = normalizeSurveyAnswers({}, { lab_glucose_value: 92 }, TEST_RULES);
  const ans = result.normalizedAnswers['lab_glucose_value'];
  expect(ans?.numericValue).toBe(92);
  expect(ans?.normalizedType).toBe('numeric');
});

test('boolean string yes → booleanValue true', () => {
  const result = normalizeSurveyAnswers({ some_yes_no: 'yes' }, undefined, []);
  const ans = result.normalizedAnswers['some_yes_no'];
  expect(ans?.booleanValue).toBe(true);
  expect(ans?.normalizedType).toBe('boolean');
});

test('case-insensitive match: "most days" matches "Most days" rule', () => {
  const result = normalizeSurveyAnswers({ fatigue_freq: 'most days' }, undefined, TEST_RULES);
  const ans = result.normalizedAnswers['fatigue_freq'];
  expect(ans?.ordinalValue).toBe(3);
});

test('trace contains one entry per input answer', () => {
  const result = normalizeSurveyAnswers(
    { fatigue_freq: 'Most days', age_years: 30, life_stage: 'Reproductive (26–35)' },
    undefined,
    TEST_RULES
  );
  expect(result.trace.length).toBe(3);
});

test('raw answers are preserved in output', () => {
  const raw = { fatigue_freq: 'Most days', age_years: 30 };
  const result = normalizeSurveyAnswers(raw, undefined, TEST_RULES);
  expect(result.rawAnswers).toEqual(raw);
});

test('survey version is echoed in output', () => {
  const result = normalizeSurveyAnswers({}, undefined, TEST_RULES, 'arc_core_intake_v1');
  expect(result.surveyVersion).toBe('arc_core_intake_v1');
});

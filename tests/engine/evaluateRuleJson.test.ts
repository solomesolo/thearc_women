/**
 * Unit tests for the deterministic rule evaluator.
 * Tests every operator in isolation and in combination.
 * No DB or Supabase access — pure logic tests.
 */

import { evaluateRuleJson } from '../../lib/engine/rules/evaluateRuleJson';
import type { RuleEvalContext, NormalizedAnswer } from '../../lib/engine/types';

function makeAnswer(
  code: string,
  opts: Partial<NormalizedAnswer>
): NormalizedAnswer {
  return {
    questionCode: code,
    rawValue: opts.rawValue ?? null,
    normalizedValue: opts.normalizedValue ?? null,
    normalizedType: opts.normalizedType ?? 'unknown',
    ordinalValue: opts.ordinalValue ?? null,
    booleanValue: opts.booleanValue ?? null,
    numericValue: opts.numericValue ?? null,
    canonicalCode: opts.canonicalCode ?? null,
  };
}

function ctx(answers: Record<string, Partial<NormalizedAnswer>>, signals?: RuleEvalContext['signals']): RuleEvalContext {
  const normalized: RuleEvalContext['answers'] = {};
  for (const [k, v] of Object.entries(answers)) {
    normalized[k] = makeAnswer(k, v);
  }
  return { answers: normalized, signals };
}

// ── equals ──────────────────────────────────────────────────────────────────

test('equals: boolean match', () => {
  const rule = { equals: ['crash_post_meal', true] };
  const c = ctx({ crash_post_meal: { booleanValue: true, normalizedValue: true, normalizedType: 'boolean' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('equals: boolean mismatch', () => {
  const rule = { equals: ['crash_post_meal', true] };
  const c = ctx({ crash_post_meal: { booleanValue: false, normalizedValue: false, normalizedType: 'boolean' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

test('equals: missing key', () => {
  const rule = { equals: ['crash_post_meal', true] };
  const c = ctx({});
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── gte ─────────────────────────────────────────────────────────────────────

test('gte: ordinal meets threshold', () => {
  const rule = { gte: ['fatigue_freq', 3] };
  const c = ctx({ fatigue_freq: { ordinalValue: 4, normalizedType: 'ordinal' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('gte: ordinal below threshold', () => {
  const rule = { gte: ['fatigue_freq', 3] };
  const c = ctx({ fatigue_freq: { ordinalValue: 2, normalizedType: 'ordinal' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── lt / lte ─────────────────────────────────────────────────────────────────

test('lt: numeric below threshold', () => {
  const rule = { lt: ['stress_level', 3] };
  const c = ctx({ stress_level: { numericValue: 2, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('lte: exactly at threshold', () => {
  const rule = { lte: ['stress_level', 3] };
  const c = ctx({ stress_level: { numericValue: 3, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

// ── between ──────────────────────────────────────────────────────────────────

test('between: inclusive bounds', () => {
  const rule = { between: ['sugar_cravings', 3, 5] };
  const c = ctx({ sugar_cravings: { numericValue: 4, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('between: out of range', () => {
  const rule = { between: ['sugar_cravings', 3, 5] };
  const c = ctx({ sugar_cravings: { numericValue: 2, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── in ───────────────────────────────────────────────────────────────────────

test('in: value is in list', () => {
  const rule = { in: ['fatigue_timing', ['Afternoon', 'All day']] };
  const c = ctx({ fatigue_timing: { normalizedValue: 'Afternoon', normalizedType: 'canonical_text' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('in: value not in list', () => {
  const rule = { in: ['fatigue_timing', ['Afternoon', 'All day']] };
  const c = ctx({ fatigue_timing: { normalizedValue: 'Morning', normalizedType: 'canonical_text' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── exists / missing ─────────────────────────────────────────────────────────

test('exists: key present', () => {
  const rule = { exists: 'crash_post_meal' };
  const c = ctx({ crash_post_meal: { booleanValue: true, normalizedType: 'boolean' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('missing: key absent', () => {
  const rule = { missing: 'crash_post_meal' };
  const c = ctx({});
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

// ── all_of ────────────────────────────────────────────────────────────────────

test('all_of: all pass', () => {
  const rule = {
    all_of: [
      { equals: ['crash_post_meal', true] },
      { gte: ['fatigue_freq', 3] },
    ],
  };
  const c = ctx({
    crash_post_meal: { booleanValue: true, normalizedType: 'boolean' },
    fatigue_freq: { ordinalValue: 4, normalizedType: 'ordinal' },
  });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('all_of: one fails → false', () => {
  const rule = {
    all_of: [
      { equals: ['crash_post_meal', true] },
      { gte: ['fatigue_freq', 3] },
    ],
  };
  const c = ctx({
    crash_post_meal: { booleanValue: true, normalizedType: 'boolean' },
    fatigue_freq: { ordinalValue: 1, normalizedType: 'ordinal' },
  });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── any_of ────────────────────────────────────────────────────────────────────

test('any_of: at least one passes', () => {
  const rule = {
    any_of: [
      { gte: ['fatigue_freq', 4] },
      { equals: ['energy_crash', 2] },
    ],
  };
  const c = ctx({
    fatigue_freq: { ordinalValue: 2, normalizedType: 'ordinal' },
    energy_crash: { ordinalValue: 2, normalizedType: 'ordinal' },
  });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('any_of: none pass', () => {
  const rule = {
    any_of: [
      { gte: ['fatigue_freq', 4] },
      { equals: ['energy_crash', 2] },
    ],
  };
  const c = ctx({
    fatigue_freq: { ordinalValue: 1, normalizedType: 'ordinal' },
    energy_crash: { ordinalValue: 0, normalizedType: 'ordinal' },
  });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── none_of ───────────────────────────────────────────────────────────────────

test('none_of: none match → true', () => {
  const rule = { none_of: [{ gte: ['stress_level', 4] }] };
  const c = ctx({ stress_level: { numericValue: 2, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('none_of: one matches → false', () => {
  const rule = { none_of: [{ gte: ['stress_level', 4] }] };
  const c = ctx({ stress_level: { numericValue: 5, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── not ───────────────────────────────────────────────────────────────────────

test('not: inverts result', () => {
  const rule = { not: { gte: ['stress_level', 4] } };
  const c = ctx({ stress_level: { numericValue: 2, normalizedType: 'numeric' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

// ── signal operators ─────────────────────────────────────────────────────────

test('signal_active: active signal', () => {
  const rule = { signal_active: 'SIG_SLEEP_DISRUPTION' };
  const c = ctx({}, { SIG_SLEEP_DISRUPTION: { isActive: true, signalStrength: 'moderate', confidence: 'medium' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('signal_active: inactive signal', () => {
  const rule = { signal_active: 'SIG_SLEEP_DISRUPTION' };
  const c = ctx({}, { SIG_SLEEP_DISRUPTION: { isActive: false, signalStrength: null, confidence: 'low' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

test('signal_strength_at_least: strong meets moderate', () => {
  const rule = { signal_strength_at_least: ['SIG_PERSISTENT_FATIGUE', 'moderate'] };
  const c = ctx({}, { SIG_PERSISTENT_FATIGUE: { isActive: true, signalStrength: 'strong', confidence: 'high' } });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('signal_strength_at_least: mild does not meet moderate', () => {
  const rule = { signal_strength_at_least: ['SIG_PERSISTENT_FATIGUE', 'moderate'] };
  const c = ctx({}, { SIG_PERSISTENT_FATIGUE: { isActive: true, signalStrength: 'mild', confidence: 'medium' } });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── score_sum_gte ──────────────────────────────────────────────────────────────

test('score_sum_gte: sum meets threshold', () => {
  const rule = { score_sum_gte: { keys: ['fatigue_sev', 'sugar_cravings'], threshold: 7 } };
  const c = ctx({
    fatigue_sev: { numericValue: 4, normalizedType: 'numeric' },
    sugar_cravings: { numericValue: 4, normalizedType: 'numeric' },
  });
  expect(evaluateRuleJson(rule, c).result).toBe(true);
});

test('score_sum_gte: sum below threshold', () => {
  const rule = { score_sum_gte: { keys: ['fatigue_sev', 'sugar_cravings'], threshold: 9 } };
  const c = ctx({
    fatigue_sev: { numericValue: 4, normalizedType: 'numeric' },
    sugar_cravings: { numericValue: 4, normalizedType: 'numeric' },
  });
  expect(evaluateRuleJson(rule, c).result).toBe(false);
});

// ── nested complex rule ───────────────────────────────────────────────────────

test('complex: blood sugar rule', () => {
  const rule = {
    all_of: [
      { equals: ['crash_post_meal', true] },
      {
        any_of: [
          { gte: ['fatigue_freq', 3] },
          { gte: ['energy_crash', 1] },
        ],
      },
    ],
  };
  const c = ctx({
    crash_post_meal: { booleanValue: true, normalizedType: 'boolean' },
    fatigue_freq: { ordinalValue: 4, normalizedType: 'ordinal' },
    energy_crash: { ordinalValue: 2, normalizedType: 'ordinal' },
  });
  const result = evaluateRuleJson(rule, c);
  expect(result.result).toBe(true);
  expect(result.matched.length).toBeGreaterThan(0);
});

// ── trace completeness ────────────────────────────────────────────────────────

test('trace: matched conditions are non-empty on pass', () => {
  const rule = { gte: ['fatigue_freq', 2] };
  const c = ctx({ fatigue_freq: { ordinalValue: 3, normalizedType: 'ordinal' } });
  const result = evaluateRuleJson(rule, c);
  expect(result.result).toBe(true);
  expect(result.matched.length).toBeGreaterThan(0);
  expect(result.unmatched).toHaveLength(0);
});

test('trace: unmatched conditions are non-empty on fail', () => {
  const rule = { gte: ['fatigue_freq', 5] };
  const c = ctx({ fatigue_freq: { ordinalValue: 2, normalizedType: 'ordinal' } });
  const result = evaluateRuleJson(rule, c);
  expect(result.result).toBe(false);
  expect(result.unmatched.length).toBeGreaterThan(0);
});

// ── edge cases ────────────────────────────────────────────────────────────────

test('null rule = pass', () => {
  expect(evaluateRuleJson(null, ctx({})).result).toBe(true);
});

test('empty object = pass', () => {
  expect(evaluateRuleJson({}, ctx({})).result).toBe(true);
});

test('unknown operator = fail gracefully', () => {
  const rule = { unknown_op: ['x', 1] };
  const result = evaluateRuleJson(rule, ctx({}));
  expect(result.result).toBe(false);
  expect(result.unmatched.some((u) => u.includes('unknown_operator'))).toBe(true);
});

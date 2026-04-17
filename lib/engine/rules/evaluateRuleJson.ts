/**
 * Deterministic rule evaluator for the engine pipeline.
 *
 * Evaluates a rule_json tree against a context of normalized answers
 * and optional signal states. Returns a boolean result plus a trace
 * that lists every matched and unmatched sub-condition.
 *
 * Supported operators:
 *   Logic:      all_of, any_of, none_of, not
 *   Comparison: equals, in, gte, gt, lte, lt, between, contains
 *   Presence:   exists, missing
 *   Signal:     signal_active, signal_strength_at_least, confidence_at_least
 *   Aggregate:  score_sum_gte
 */

import type { RuleEvalContext, RuleEvalResult, SignalStrength, ConfidenceBand } from '../types';

const STRENGTH_ORDER: SignalStrength[] = ['mild', 'moderate', 'strong'];
const CONFIDENCE_ORDER: ConfidenceBand[] = ['low', 'medium', 'high'];

function strengthGte(a: string | null, b: string): boolean {
  if (!a) return false;
  return STRENGTH_ORDER.indexOf(a as SignalStrength) >= STRENGTH_ORDER.indexOf(b as SignalStrength);
}

function confidenceGte(a: string, b: string): boolean {
  return CONFIDENCE_ORDER.indexOf(a as ConfidenceBand) >= CONFIDENCE_ORDER.indexOf(b as ConfidenceBand);
}

/** Resolve a scalar answer value from the normalized answer map. */
function resolveValue(key: string, ctx: RuleEvalContext): unknown {
  const answer = ctx.answers[key];
  if (!answer) return undefined;
  // Prefer typed values over raw normalized text
  if (answer.booleanValue !== null && answer.booleanValue !== undefined) return answer.booleanValue;
  if (answer.ordinalValue !== null && answer.ordinalValue !== undefined) return answer.ordinalValue;
  if (answer.numericValue !== null && answer.numericValue !== undefined) return answer.numericValue;
  return answer.normalizedValue;
}

type EvalState = {
  matched: string[];
  unmatched: string[];
};

/** Core recursive evaluator. Mutates `state` for tracing. */
function evalNode(node: unknown, ctx: RuleEvalContext, state: EvalState): boolean {
  if (node === null || node === undefined) return false;
  if (typeof node !== 'object' || Array.isArray(node)) {
    state.unmatched.push(`invalid_node:${JSON.stringify(node)}`);
    return false;
  }

  const n = node as Record<string, unknown>;
  const keys = Object.keys(n);
  if (keys.length === 0) return true; // empty rule = always pass

  const op = keys[0]!;
  const args = n[op];

  // ── Logic operators ───────────────────────────────────────

  if (op === 'all_of') {
    const items = Array.isArray(args) ? args : [];
    const label = 'all_of';
    for (const item of items) {
      if (!evalNode(item, ctx, state)) {
        state.unmatched.push(`${label}:failed_on_${JSON.stringify(item).slice(0, 60)}`);
        return false;
      }
    }
    state.matched.push(label);
    return true;
  }

  if (op === 'any_of') {
    const items = Array.isArray(args) ? args : [];
    const label = 'any_of';
    for (const item of items) {
      if (evalNode(item, ctx, state)) {
        state.matched.push(label);
        return true;
      }
    }
    state.unmatched.push(label);
    return false;
  }

  if (op === 'none_of') {
    const items = Array.isArray(args) ? args : [];
    for (const item of items) {
      if (evalNode(item, ctx, state)) {
        state.unmatched.push(`none_of:matched_${JSON.stringify(item).slice(0, 60)}`);
        return false;
      }
    }
    state.matched.push('none_of');
    return true;
  }

  if (op === 'not') {
    const result = !evalNode(args, ctx, state);
    if (result) state.matched.push('not');
    else state.unmatched.push('not');
    return result;
  }

  // ── Comparison operators ──────────────────────────────────

  if (op === 'equals') {
    const [key, expected] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = actual === expected;
    const label = `equals:${key}=${expected}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'in') {
    const [key, ...values] = Array.isArray(args) ? args : [];
    // Support both (key, [arr]) and (key, v1, v2, ...) forms
    const list: unknown[] = Array.isArray(values[0]) ? (values[0] as unknown[]) : values;
    const actual = resolveValue(String(key), ctx);
    const result = list.includes(actual);
    const label = `in:${key}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'gte') {
    const [key, threshold] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = typeof actual === 'number' && actual >= Number(threshold);
    const label = `gte:${key}>=${threshold}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'gt') {
    const [key, threshold] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = typeof actual === 'number' && actual > Number(threshold);
    const label = `gt:${key}>${threshold}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'lte') {
    const [key, threshold] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = typeof actual === 'number' && actual <= Number(threshold);
    const label = `lte:${key}<=${threshold}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'lt') {
    const [key, threshold] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = typeof actual === 'number' && actual < Number(threshold);
    const label = `lt:${key}<${threshold}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'between') {
    const [key, lo, hi] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = typeof actual === 'number' && actual >= Number(lo) && actual <= Number(hi);
    const label = `between:${key}:${lo}-${hi}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'contains') {
    const [key, substring] = Array.isArray(args) ? args : [];
    const actual = resolveValue(String(key), ctx);
    const result = typeof actual === 'string' && actual.includes(String(substring));
    const label = `contains:${key}:${substring}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  // ── Presence operators ────────────────────────────────────

  if (op === 'exists') {
    const key = String(args);
    const actual = resolveValue(key, ctx);
    const result = actual !== undefined && actual !== null;
    const label = `exists:${key}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'missing') {
    const key = String(args);
    const actual = resolveValue(key, ctx);
    const result = actual === undefined || actual === null;
    const label = `missing:${key}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  // ── Signal-aware operators ────────────────────────────────

  if (op === 'signal_active') {
    const signalCode = String(args);
    const sig = ctx.signals?.[signalCode];
    const result = sig?.isActive === true;
    const label = `signal_active:${signalCode}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'signal_strength_at_least') {
    const [signalCode, minStrength] = Array.isArray(args) ? args : [];
    const sig = ctx.signals?.[String(signalCode)];
    const result = sig?.isActive === true && strengthGte(sig.signalStrength, String(minStrength));
    const label = `signal_strength_at_least:${signalCode}>=${minStrength}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  if (op === 'confidence_at_least') {
    const [signalCode, minConf] = Array.isArray(args) ? args : [];
    const sig = ctx.signals?.[String(signalCode)];
    const result = sig?.isActive === true && confidenceGte(sig.confidence, String(minConf));
    const label = `confidence_at_least:${signalCode}>=${minConf}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  // ── Aggregate operators ───────────────────────────────────

  if (op === 'score_sum_gte') {
    // { score_sum_gte: { keys: [...], threshold: N } }
    const { keys, threshold } = (args ?? {}) as { keys?: string[]; threshold?: number };
    if (!Array.isArray(keys)) {
      state.unmatched.push('score_sum_gte:invalid_args');
      return false;
    }
    let sum = 0;
    for (const k of keys) {
      const val = resolveValue(k, ctx);
      if (typeof val === 'number') sum += val;
    }
    const result = sum >= Number(threshold ?? 0);
    const label = `score_sum_gte:sum=${sum}>=${threshold}`;
    if (result) state.matched.push(label); else state.unmatched.push(label);
    return result;
  }

  // Unknown operator — treat as unmatched
  state.unmatched.push(`unknown_operator:${op}`);
  return false;
}

/**
 * Evaluate a rule_json tree against a context.
 * Returns { result, matched, unmatched } — always non-throwing.
 */
export function evaluateRuleJson(rule: unknown, ctx: RuleEvalContext): RuleEvalResult {
  if (rule === null || rule === undefined) {
    return { result: true, matched: ['(no_rule)'], unmatched: [] };
  }
  const state: EvalState = { matched: [], unmatched: [] };
  try {
    const result = evalNode(rule, ctx, state);
    return { result, matched: state.matched, unmatched: state.unmatched };
  } catch (err) {
    return {
      result: false,
      matched: state.matched,
      unmatched: [...state.unmatched, `eval_error:${String(err)}`],
    };
  }
}

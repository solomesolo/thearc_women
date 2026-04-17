/**
 * Layer 1 — Survey Answer Normalization
 *
 * Converts raw survey answers + optional labs into a typed NormalizedAnswerMap.
 * Reads normalization rules from the `survey_answer_normalization` Supabase table.
 * Falls back to heuristic passthrough for numeric and boolean-like answers.
 *
 * Rules:
 * - Preserves both raw and normalized values
 * - Never hard-fails for one unmapped answer; emits a warning instead
 * - Downstream layers may reduce confidence for unmapped entries
 */

import type {
  NormalizationResult,
  NormalizedAnswer,
  NormalizedAnswerMap,
  NormalizationTraceEntry,
  NormalizationRule,
  LifeStageScope,
} from '../types';

const LIFE_STAGE_CANONICAL: Record<string, LifeStageScope> = {
  reproductive: 'reproductive',
  'reproductive (18-25)': 'reproductive',
  'reproductive (26-35)': 'reproductive',
  'reproductive (18–25)': 'reproductive',
  'reproductive (26–35)': 'reproductive',
  postpartum: 'postpartum',
  perimenopause: 'perimenopause',
  'peri-menopause': 'perimenopause',
  menopause: 'menopause',
  'post-menopause': 'menopause',
  postmenopause: 'menopause',
};

function detectLifeStage(answers: NormalizedAnswerMap): LifeStageScope {
  const lsAnswer = answers['life_stage'];
  if (lsAnswer) {
    const raw = String(lsAnswer.rawValue ?? '').toLowerCase().trim();
    const canonical = lsAnswer.canonicalCode as LifeStageScope | null;
    if (canonical && canonical !== 'unknown') return canonical;
    return LIFE_STAGE_CANONICAL[raw] ?? 'reproductive';
  }
  return 'unknown';
}

function heuristicPassthrough(
  questionCode: string,
  rawValue: unknown
): NormalizedAnswer | null {
  if (rawValue === null || rawValue === undefined) return null;

  // Numeric passthrough (e.g., age, lab values)
  if (typeof rawValue === 'number') {
    return {
      questionCode,
      rawValue,
      normalizedValue: rawValue,
      normalizedType: 'numeric',
      ordinalValue: null,
      booleanValue: null,
      numericValue: rawValue,
      canonicalCode: null,
    };
  }

  // Boolean passthrough
  if (typeof rawValue === 'boolean') {
    return {
      questionCode,
      rawValue,
      normalizedValue: rawValue,
      normalizedType: 'boolean',
      ordinalValue: null,
      booleanValue: rawValue,
      numericValue: null,
      canonicalCode: null,
    };
  }

  // Numeric string passthrough
  const strVal = String(rawValue).trim();
  const asNum = Number(strVal);
  if (strVal !== '' && !isNaN(asNum)) {
    return {
      questionCode,
      rawValue,
      normalizedValue: asNum,
      normalizedType: 'numeric',
      ordinalValue: null,
      booleanValue: null,
      numericValue: asNum,
      canonicalCode: null,
    };
  }

  // Boolean-like strings
  const lower = strVal.toLowerCase();
  if (lower === 'yes' || lower === 'true') {
    return {
      questionCode,
      rawValue,
      normalizedValue: true,
      normalizedType: 'boolean',
      ordinalValue: null,
      booleanValue: true,
      numericValue: null,
      canonicalCode: null,
    };
  }
  if (lower === 'no' || lower === 'false') {
    return {
      questionCode,
      rawValue,
      normalizedValue: false,
      normalizedType: 'boolean',
      ordinalValue: null,
      booleanValue: false,
      numericValue: null,
      canonicalCode: null,
    };
  }

  return null;
}

function applyRule(
  questionCode: string,
  rawValue: unknown,
  rule: NormalizationRule
): NormalizedAnswer {
  return {
    questionCode,
    rawValue,
    normalizedValue: rule.normalizedValue,
    normalizedType: rule.normalizedType,
    ordinalValue: rule.ordinalValue,
    booleanValue: rule.booleanValue,
    numericValue: rule.numericValue,
    canonicalCode: rule.canonicalCode,
  };
}

/**
 * Normalize raw survey answers using DB-loaded rules.
 *
 * @param rawAnswers - variable_id → raw survey value
 * @param optionalLabs - lab code → numeric value (mg/dL, ng/mL etc.)
 * @param rules - normalization rules loaded from DB
 * @param surveyVersion
 */
export function normalizeSurveyAnswers(
  rawAnswers: Record<string, unknown>,
  optionalLabs: Record<string, number> | undefined,
  rules: NormalizationRule[],
  surveyVersion = 'arc_core_intake_v1'
): NormalizationResult {
  // Build lookup map: question_code → raw_value → rule
  const ruleMap = new Map<string, Map<string, NormalizationRule>>();
  for (const rule of rules) {
    if (!ruleMap.has(rule.questionCode)) ruleMap.set(rule.questionCode, new Map());
    // Key match is case-insensitive trimmed
    const key = String(rule.rawValue).toLowerCase().trim();
    ruleMap.get(rule.questionCode)!.set(key, rule);
  }

  const normalizedAnswers: NormalizedAnswerMap = {};
  const warnings: string[] = [];
  const trace: NormalizationTraceEntry[] = [];

  // ── Process survey answers ─────────────────────────────────────────────────
  for (const [questionCode, rawValue] of Object.entries(rawAnswers)) {
    if (rawValue === null || rawValue === undefined) {
      trace.push({ questionCode, rawValue, outcome: 'missing' });
      continue;
    }

    const questionRules = ruleMap.get(questionCode);
    const rawStr = String(rawValue).toLowerCase().trim();
    const matchedRule = questionRules?.get(rawStr);

    if (matchedRule) {
      normalizedAnswers[questionCode] = applyRule(questionCode, rawValue, matchedRule);
      trace.push({
        questionCode,
        rawValue,
        outcome: 'mapped',
        appliedRuleId: matchedRule.id,
      });
      continue;
    }

    // Try heuristic passthrough before marking unmapped
    const heuristic = heuristicPassthrough(questionCode, rawValue);
    if (heuristic) {
      normalizedAnswers[questionCode] = heuristic;
      trace.push({
        questionCode,
        rawValue,
        outcome: heuristic.normalizedType === 'numeric' ? 'numeric_passthrough' : 'boolean_passthrough',
      });
      continue;
    }

    // Unmapped — emit warning; store as unknown so downstream can reduce confidence
    warnings.push(`unmapped_answer:${questionCode}:${String(rawValue).slice(0, 60)}`);
    normalizedAnswers[questionCode] = {
      questionCode,
      rawValue,
      normalizedValue: String(rawValue),
      normalizedType: 'unknown',
      ordinalValue: null,
      booleanValue: null,
      numericValue: null,
      canonicalCode: null,
    };
    trace.push({
      questionCode,
      rawValue,
      outcome: 'unmapped',
      warning: `no_rule_found`,
    });
  }

  // ── Process optional labs ──────────────────────────────────────────────────
  if (optionalLabs) {
    for (const [labCode, labValue] of Object.entries(optionalLabs)) {
      if (typeof labValue === 'number' && !isNaN(labValue)) {
        normalizedAnswers[labCode] = {
          questionCode: labCode,
          rawValue: labValue,
          normalizedValue: labValue,
          normalizedType: 'numeric',
          ordinalValue: null,
          booleanValue: null,
          numericValue: labValue,
          canonicalCode: null,
        };
        trace.push({ questionCode: labCode, rawValue: labValue, outcome: 'numeric_passthrough' });
      }
    }
  }

  const lifeStage = detectLifeStage(normalizedAnswers);

  return {
    normalizedAnswers,
    rawAnswers,
    warnings,
    trace,
    surveyVersion,
    lifeStage,
  };
}

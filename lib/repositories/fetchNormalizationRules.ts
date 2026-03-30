import { getEngineSupabaseClient } from './supabaseEngine';
import type { NormalizationRule, NormalizedType } from '../engine/types';

type RawRow = Record<string, unknown>;

function rowToRule(r: RawRow): NormalizationRule {
  return {
    id: String(r.id ?? ''),
    surveyVersion: String(r.survey_version ?? 'arc_core_intake_v1'),
    questionCode: String(r.question_code ?? ''),
    rawValue: String(r.raw_value ?? ''),
    normalizedValue: r.normalized_value != null ? String(r.normalized_value) : null,
    normalizedType: String(r.normalized_type ?? 'unknown') as NormalizedType,
    ordinalValue: r.ordinal_value != null ? Number(r.ordinal_value) : null,
    booleanValue: r.boolean_value != null ? Boolean(r.boolean_value) : null,
    numericValue: r.numeric_value != null ? Number(r.numeric_value) : null,
    canonicalCode: r.canonical_code != null ? String(r.canonical_code) : null,
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

/**
 * Returns all approved normalization rules for a given survey version,
 * deduplicated to the highest version per (question_code, raw_value).
 */
export async function fetchNormalizationRules(
  surveyVersion = 'arc_core_intake_v1'
): Promise<NormalizationRule[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('survey_answer_normalization')
    .select('*')
    .eq('survey_version', surveyVersion)
    .eq('approved', true)
    .order('version', { ascending: false });

  if (error) throw new Error(`fetchNormalizationRules: ${error.message}`);

  // Deduplicate: keep highest version per (question_code, raw_value)
  const seen = new Map<string, NormalizationRule>();
  for (const r of (data ?? []) as RawRow[]) {
    const rule = rowToRule(r);
    const key = `${rule.questionCode}::${rule.rawValue}`;
    if (!seen.has(key)) seen.set(key, rule);
  }
  return Array.from(seen.values());
}

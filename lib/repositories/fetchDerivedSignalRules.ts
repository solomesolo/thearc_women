import { getEngineSupabaseClient } from './supabaseEngine';
import type { DerivedSignalFlagRule, SignalStrength } from '../engine/types';

type RawRow = Record<string, unknown>;

function rowToRule(r: RawRow): DerivedSignalFlagRule {
  return {
    id: String(r.id ?? ''),
    signalCode: String(r.signal_code ?? ''),
    signalName: String(r.signal_name ?? ''),
    domain: String(r.domain ?? ''),
    sourceVariables: Array.isArray(r.source_variables) ? (r.source_variables as string[]) : [],
    triggerLogic: String(r.trigger_logic ?? ''),
    ruleJson: r.rule_json ?? null,
    minTriggerScore: Number(r.min_trigger_score ?? 0),
    supportingConditions: r.supporting_conditions ?? null,
    exclusionConditions: r.exclusion_conditions ?? null,
    lifeStageModifier: Array.isArray(r.life_stage_modifier) ? r.life_stage_modifier as DerivedSignalFlagRule['lifeStageModifier'] : null,
    defaultStrength: String(r.default_strength ?? 'mild') as SignalStrength,
    confidenceRule: r.confidence_rule ?? null,
    safeLanguageNotes: String(r.safe_language_notes ?? ''),
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

/**
 * Returns all approved derived signal rules, deduplicated to the
 * highest version per signal_code.
 */
export async function fetchDerivedSignalRules(): Promise<DerivedSignalFlagRule[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('derived_signal_flags')
    .select('*')
    .eq('approved', true)
    .order('version', { ascending: false });

  if (error) throw new Error(`fetchDerivedSignalRules: ${error.message}`);

  const seen = new Map<string, DerivedSignalFlagRule>();
  for (const r of (data ?? []) as RawRow[]) {
    const rule = rowToRule(r);
    if (!seen.has(rule.signalCode)) seen.set(rule.signalCode, rule);
  }
  return Array.from(seen.values());
}

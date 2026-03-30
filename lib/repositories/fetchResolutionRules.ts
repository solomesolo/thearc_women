import { getEngineSupabaseClient } from './supabaseEngine';
import type {
  KeyAreaResolutionRule,
  BodySystemResolutionRule,
  HeroResolutionRule,
  ConfidenceBand,
} from '../engine/types';

type RawRow = Record<string, unknown>;

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function toConfidence(v: unknown): ConfidenceBand {
  if (v === 'medium' || v === 'high') return v;
  return 'low';
}

function rowToKARule(r: RawRow): KeyAreaResolutionRule {
  return {
    id: String(r.id ?? ''),
    keyAreaCode: String(r.key_area_code ?? ''),
    stateCode: String(r.state_code ?? ''),
    ruleName: String(r.rule_name ?? ''),
    rulePriority: Number(r.rule_priority ?? 50),
    requiredSignals: toStringArray(r.required_signals),
    supportingSignals: toStringArray(r.supporting_signals),
    excludedSignals: toStringArray(r.excluded_signals),
    minimumTotalWeight: Number(r.minimum_total_weight ?? 0),
    minimumConfidence: toConfidence(r.minimum_confidence),
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    resolutionLogic: String(r.resolution_logic ?? ''),
    ruleJson: r.rule_json ?? null,
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

function rowToBSRule(r: RawRow): BodySystemResolutionRule {
  return {
    id: String(r.id ?? ''),
    bodySystemCode: String(r.body_system_code ?? ''),
    stateCode: String(r.state_code ?? ''),
    ruleName: String(r.rule_name ?? ''),
    rulePriority: Number(r.rule_priority ?? 50),
    requiredSignals: toStringArray(r.required_signals),
    supportingSignals: toStringArray(r.supporting_signals),
    excludedSignals: toStringArray(r.excluded_signals),
    minimumTotalWeight: Number(r.minimum_total_weight ?? 0),
    minimumConfidence: toConfidence(r.minimum_confidence),
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    resolutionLogic: String(r.resolution_logic ?? ''),
    ruleJson: r.rule_json ?? null,
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

function rowToHeroRule(r: RawRow): HeroResolutionRule {
  return {
    id: String(r.id ?? ''),
    heroCode: String(r.hero_code ?? ''),
    ruleName: String(r.rule_name ?? ''),
    rulePriority: Number(r.rule_priority ?? 50),
    requiredSignals: toStringArray(r.required_signals),
    supportingSignals: toStringArray(r.supporting_signals),
    excludedSignals: toStringArray(r.excluded_signals),
    minimumClusterScore: Number(r.minimum_cluster_score ?? 0),
    minimumSpecificityScore: Number(r.minimum_specificity_score ?? 0),
    minimumConfidence: toConfidence(r.minimum_confidence),
    nonOverlapConstraints: toStringArray(r.non_overlap_constraints),
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    resolutionLogic: String(r.resolution_logic ?? ''),
    ruleJson: r.rule_json ?? null,
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

/** Key area resolution rules, all areas, ordered by priority desc. */
export async function fetchKeyAreaResolutionRules(): Promise<KeyAreaResolutionRule[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('key_area_state_resolution_rules')
    .select('*')
    .eq('approved', true)
    .order('rule_priority', { ascending: false })
    .order('version', { ascending: false });
  if (error) throw new Error(`fetchKeyAreaResolutionRules: ${error.message}`);
  return ((data ?? []) as RawRow[]).map(rowToKARule);
}

/** Body system resolution rules, all systems, ordered by priority desc. */
export async function fetchBodySystemResolutionRules(): Promise<BodySystemResolutionRule[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('body_system_resolution_rules')
    .select('*')
    .eq('approved', true)
    .order('rule_priority', { ascending: false })
    .order('version', { ascending: false });
  if (error) throw new Error(`fetchBodySystemResolutionRules: ${error.message}`);
  return ((data ?? []) as RawRow[]).map(rowToBSRule);
}

/** Hero resolution rules, all heroes, ordered by priority desc. */
export async function fetchHeroResolutionRules(): Promise<HeroResolutionRule[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('hero_resolution_rules')
    .select('*')
    .eq('approved', true)
    .order('rule_priority', { ascending: false })
    .order('version', { ascending: false });
  if (error) throw new Error(`fetchHeroResolutionRules: ${error.message}`);
  return ((data ?? []) as RawRow[]).map(rowToHeroRule);
}

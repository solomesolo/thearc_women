import { getEngineSupabaseClient } from './supabaseEngine';
import type {
  SignalToKeyAreaMapping,
  SignalToBodySystemMapping,
  SignalToHeroMapping,
  InfluenceType,
} from '../engine/types';

type RawRow = Record<string, unknown>;

function rowToKAMapping(r: RawRow): SignalToKeyAreaMapping {
  return {
    id: String(r.id ?? ''),
    signalCode: String(r.signal_code ?? ''),
    keyAreaCode: String(r.key_area_code ?? ''),
    influenceType: String(r.influence_type ?? 'secondary') as InfluenceType,
    weight: Number(r.weight ?? 1),
    confidenceEffect: Number(r.confidence_effect ?? 0),
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    conditionsJson: r.conditions_json ?? null,
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

function rowToBSMapping(r: RawRow): SignalToBodySystemMapping {
  return {
    id: String(r.id ?? ''),
    signalCode: String(r.signal_code ?? ''),
    bodySystemCode: String(r.body_system_code ?? ''),
    influenceType: String(r.influence_type ?? 'secondary') as InfluenceType,
    weight: Number(r.weight ?? 1),
    confidenceEffect: Number(r.confidence_effect ?? 0),
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    conditionsJson: r.conditions_json ?? null,
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

function rowToHeroMapping(r: RawRow): SignalToHeroMapping {
  return {
    id: String(r.id ?? ''),
    signalCode: String(r.signal_code ?? ''),
    heroCode: String(r.hero_code ?? ''),
    weight: Number(r.weight ?? 1),
    specificityScore: Number(r.specificity_score ?? 0.5),
    priorityScore: Number(r.priority_score ?? 0.5),
    lifeStageScope: String(r.life_stage_scope ?? 'all'),
    conditionsJson: r.conditions_json ?? null,
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

/** Latest approved key-area mappings per (signal_code, key_area_code). */
export async function fetchKeyAreaMappings(): Promise<SignalToKeyAreaMapping[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('signal_to_key_area_map')
    .select('*')
    .eq('approved', true)
    .order('version', { ascending: false });
  if (error) throw new Error(`fetchKeyAreaMappings: ${error.message}`);

  const seen = new Map<string, SignalToKeyAreaMapping>();
  for (const r of (data ?? []) as RawRow[]) {
    const m = rowToKAMapping(r);
    const k = `${m.signalCode}::${m.keyAreaCode}`;
    if (!seen.has(k)) seen.set(k, m);
  }
  return Array.from(seen.values());
}

/** Latest approved body-system mappings per (signal_code, body_system_code). */
export async function fetchBodySystemMappings(): Promise<SignalToBodySystemMapping[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('signal_to_body_system_map')
    .select('*')
    .eq('approved', true)
    .order('version', { ascending: false });
  if (error) throw new Error(`fetchBodySystemMappings: ${error.message}`);

  const seen = new Map<string, SignalToBodySystemMapping>();
  for (const r of (data ?? []) as RawRow[]) {
    const m = rowToBSMapping(r);
    const k = `${m.signalCode}::${m.bodySystemCode}`;
    if (!seen.has(k)) seen.set(k, m);
  }
  return Array.from(seen.values());
}

/** Latest approved hero mappings per (signal_code, hero_code). */
export async function fetchHeroMappings(): Promise<SignalToHeroMapping[]> {
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('signal_to_hero_map')
    .select('*')
    .eq('approved', true)
    .order('version', { ascending: false });
  if (error) throw new Error(`fetchHeroMappings: ${error.message}`);

  const seen = new Map<string, SignalToHeroMapping>();
  for (const r of (data ?? []) as RawRow[]) {
    const m = rowToHeroMapping(r);
    const k = `${m.signalCode}::${m.heroCode}`;
    if (!seen.has(k)) seen.set(k, m);
  }
  return Array.from(seen.values());
}

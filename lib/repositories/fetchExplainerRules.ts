import { getEngineSupabaseClient } from './supabaseEngine';
import type { SignalExplainerRule, ExplanationType } from '../engine/types';

type RawRow = Record<string, unknown>;

function rowToRule(r: RawRow): SignalExplainerRule {
  return {
    id: String(r.id ?? ''),
    signalCode: String(r.signal_code ?? ''),
    explanationType: String(r.explanation_type ?? 'positive_driver') as ExplanationType,
    templateText: String(r.template_text ?? ''),
    requiredSupportingAnswers: Array.isArray(r.required_supporting_answers)
      ? (r.required_supporting_answers as string[])
      : [],
    conditionsJson: r.conditions_json ?? null,
    priority: Number(r.priority ?? 50),
    safeLanguageNotes: String(r.safe_language_notes ?? ''),
    approved: Boolean(r.approved ?? true),
    version: Number(r.version ?? 1),
  };
}

/**
 * Returns all approved explainer rules for the given signal codes.
 * Deduplicated to highest version per (signal_code, explanation_type).
 */
export async function fetchExplainerRules(
  signalCodes: string[]
): Promise<SignalExplainerRule[]> {
  if (signalCodes.length === 0) return [];
  const supabase = getEngineSupabaseClient();
  const { data, error } = await supabase
    .from('signal_explainer_map')
    .select('*')
    .in('signal_code', signalCodes)
    .eq('approved', true)
    .order('priority', { ascending: false })
    .order('version', { ascending: false });

  if (error) throw new Error(`fetchExplainerRules: ${error.message}`);

  const seen = new Map<string, SignalExplainerRule>();
  for (const r of (data ?? []) as RawRow[]) {
    const rule = rowToRule(r);
    const key = `${rule.signalCode}::${rule.explanationType}`;
    if (!seen.has(key)) seen.set(key, rule);
  }
  return Array.from(seen.values());
}

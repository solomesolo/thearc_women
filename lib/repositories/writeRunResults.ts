/**
 * Persist all engine run results to Supabase output tables.
 * Idempotent: deletes existing rows for (user_id, run_id, engine_version)
 * then inserts fresh results inside a best-effort serial transaction.
 */
import { getEngineSupabaseClient } from './supabaseEngine';
import type { PersistInput } from '../engine/types';

export async function writeRunResults(input: PersistInput): Promise<void> {
  const { userId, runId, engineVersion, signals, keyAreas, bodySystems, hero, influencers } = input;
  const supabase = getEngineSupabaseClient();

  // ── Delete existing rows for this run (idempotent re-run) ────────────────
  await Promise.all([
    supabase.from('user_signal_results').delete().match({ user_id: userId, run_id: runId, engine_version: engineVersion }),
    supabase.from('user_key_area_results').delete().match({ user_id: userId, run_id: runId, engine_version: engineVersion }),
    supabase.from('user_body_system_results').delete().match({ user_id: userId, run_id: runId, engine_version: engineVersion }),
    supabase.from('user_hero_result').delete().match({ user_id: userId, run_id: runId, engine_version: engineVersion }),
    supabase.from('user_influencer_results').delete().match({ user_id: userId, run_id: runId, engine_version: engineVersion }),
  ]);

  // ── Insert signals ────────────────────────────────────────────────────────
  if (signals.length > 0) {
    const rows = signals.map((s) => ({
      user_id: userId,
      run_id: runId,
      signal_code: s.signalCode,
      is_active: s.isActive,
      signal_strength: s.signalStrength,
      confidence: s.confidence,
      life_stage_modifier_applied: s.lifeStageModifierApplied,
      supporting_answers_json: s.supportingAnswers,
      contradictions_json: s.exclusionsTriggered,
      debug_trace_json: s.debugTrace,
      trigger_score: s.triggerScore,
      engine_version: engineVersion,
    }));
    const { error } = await supabase.from('user_signal_results').insert(rows);
    if (error) throw new Error(`writeRunResults.signals: ${error.message}`);
  }

  // ── Insert key areas ──────────────────────────────────────────────────────
  if (keyAreas.length > 0) {
    const rows = keyAreas.map((ka) => ({
      user_id: userId,
      run_id: runId,
      key_area_code: ka.keyAreaCode,
      resolved_state_code: ka.resolvedStateCode,
      score: ka.score,
      confidence: ka.confidence,
      contributing_signals_json: ka.contributingSignals,
      suppressed_state_candidates_json: ka.suppressedStateCandidates,
      explanation_json: { candidates: ka.explanationCandidates, ruleApplied: ka.ruleApplied },
      engine_version: engineVersion,
    }));
    const { error } = await supabase.from('user_key_area_results').insert(rows);
    if (error) throw new Error(`writeRunResults.keyAreas: ${error.message}`);
  }

  // ── Insert body systems ───────────────────────────────────────────────────
  if (bodySystems.length > 0) {
    const rows = bodySystems.map((bs) => ({
      user_id: userId,
      run_id: runId,
      body_system_code: bs.bodySystemCode,
      resolved_state_code: bs.resolvedStateCode,
      score: bs.score,
      confidence: bs.confidence,
      contributing_signals_json: bs.contributingSignals,
      suppressed_state_candidates_json: bs.suppressedStateCandidates,
      explanation_json: { candidates: bs.explanationCandidates, ruleApplied: bs.ruleApplied },
      engine_version: engineVersion,
    }));
    const { error } = await supabase.from('user_body_system_results').insert(rows);
    if (error) throw new Error(`writeRunResults.bodySystems: ${error.message}`);
  }

  // ── Insert hero ───────────────────────────────────────────────────────────
  const heroRow = {
    user_id: userId,
    run_id: runId,
    hero_code: hero.heroCode,
    score: hero.score,
    confidence: hero.confidence,
    contributing_signals_json: hero.contributingSignals,
    why_selected_json: { reason: hero.whySelected },
    suppressed_hero_candidates_json: hero.suppressedHeroCandidates,
    explanation_json: {},
    engine_version: engineVersion,
  };
  const { error: heroError } = await supabase.from('user_hero_result').insert(heroRow);
  if (heroError) throw new Error(`writeRunResults.hero: ${heroError.message}`);

  // ── Insert influencers (optional) ─────────────────────────────────────────
  if (influencers && influencers.length > 0) {
    const rows = influencers.map((inf) => ({
      user_id: userId,
      run_id: runId,
      influencer_code: inf.code,
      score: inf.score,
      confidence: inf.confidence,
      source_signal_codes: inf.sourceSignalCodes,
      explanation_json: inf.explanation,
      engine_version: engineVersion,
    }));
    const { error } = await supabase.from('user_influencer_results').insert(rows);
    if (error) throw new Error(`writeRunResults.influencers: ${error.message}`);
  }
}

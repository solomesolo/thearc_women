/**
 * Engine orchestrator — single entrypoint for the 7-layer dashboard pipeline.
 *
 * Execution order (deterministic):
 *   1. Normalize survey answers           → NormalizationResult
 *   2. Resolve derived signals            → DerivedSignalResult[]
 *   3. Build influence graph              → InfluenceGraph
 *   4. Resolve key areas                  → KeyAreaResult[]
 *   5. Resolve body systems               → BodySystemResult[]
 *   6. Resolve hero                       → HeroResult
 *   7. Generate explainers                → ExplainerBundle
 *   8. Persist results                    → Supabase output tables
 *   9. Return EngineRunOutput + debug payload
 *
 * The run is deterministic for the same:
 *   - survey input
 *   - survey version
 *   - engine version
 *   - approved DB rows active at that version
 */

import type { EngineRunInput, EngineRunOutput } from './types';

import { fetchNormalizationRules } from '../repositories/fetchNormalizationRules';
import { fetchDerivedSignalRules } from '../repositories/fetchDerivedSignalRules';
import {
  fetchKeyAreaMappings,
  fetchBodySystemMappings,
  fetchHeroMappings,
} from '../repositories/fetchSignalMappings';
import {
  fetchKeyAreaResolutionRules,
  fetchBodySystemResolutionRules,
  fetchHeroResolutionRules,
} from '../repositories/fetchResolutionRules';
import { fetchExplainerRules } from '../repositories/fetchExplainerRules';

import { normalizeSurveyAnswers } from './normalization/normalizeSurveyAnswers';
import { resolveDerivedSignals } from './signals/resolveDerivedSignals';
import { buildInfluenceGraph } from './influence/buildInfluenceGraph';
import { resolveKeyAreas } from './resolution/resolveKeyAreas';
import { resolveBodySystems } from './resolution/resolveBodySystems';
import { resolveHero } from './resolution/resolveHero';
import { generateDashboardExplainers } from './explainers/generateDashboardExplainers';
import { persistDashboardResults } from './persistence/persistDashboardResults';
import { buildDebugPayload } from './debug/buildDebugPayload';

export async function runDashboardEngine(input: EngineRunInput): Promise<EngineRunOutput> {
  const {
    userId,
    runId,
    surveyAnswers,
    optionalLabs,
    surveyVersion = 'arc_core_intake_v1',
    engineVersion,
  } = input;

  const startedAt = Date.now();

  // ── Parallel DB prefetch — load all rule tables before processing ───────────
  const [
    normalizationRules,
    signalRules,
    keyAreaMappings,
    bodySystemMappings,
    heroMappings,
    keyAreaResRules,
    bodySystemResRules,
    heroResRules,
  ] = await Promise.all([
    fetchNormalizationRules(surveyVersion),
    fetchDerivedSignalRules(),
    fetchKeyAreaMappings(),
    fetchBodySystemMappings(),
    fetchHeroMappings(),
    fetchKeyAreaResolutionRules(),
    fetchBodySystemResolutionRules(),
    fetchHeroResolutionRules(),
  ]);

  // ── Layer 1: Normalize answers ───────────────────────────────────────────────
  const normalization = normalizeSurveyAnswers(
    surveyAnswers,
    optionalLabs,
    normalizationRules,
    surveyVersion
  );

  const lifeStage = normalization.lifeStage;

  // ── Layer 2: Derive signals ──────────────────────────────────────────────────
  const signals = resolveDerivedSignals(
    normalization.normalizedAnswers,
    lifeStage,
    signalRules
  );

  // ── Layer 3: Build influence graph ───────────────────────────────────────────
  const influenceGraph = buildInfluenceGraph(
    signals,
    lifeStage,
    keyAreaMappings,
    bodySystemMappings,
    heroMappings
  );

  // ── Layer 4/5: Resolve key areas + body systems (parallel) ──────────────────
  const [keyAreas, bodySystems] = await Promise.all([
    Promise.resolve(resolveKeyAreas(influenceGraph, signals, lifeStage, keyAreaResRules)),
    Promise.resolve(resolveBodySystems(influenceGraph, signals, lifeStage, bodySystemResRules)),
  ]);

  // ── Layer 6: Resolve hero ────────────────────────────────────────────────────
  const hero = resolveHero(
    signals,
    keyAreas,
    bodySystems,
    influenceGraph,
    lifeStage,
    heroResRules
  );

  // ── Layer 7: Generate explainers ─────────────────────────────────────────────
  // Fetch explainer rules only for active signal codes (perf optimization)
  const activeSignalCodes = signals.filter((s) => s.isActive).map((s) => s.signalCode);
  // Also include near-miss inactive codes for ruled_out explanations
  const nearMissCodes = signals.filter((s) => !s.isActive && s.triggerScore >= 10).map((s) => s.signalCode);
  const explainerRules = await fetchExplainerRules([...activeSignalCodes, ...nearMissCodes]);

  const explainers = generateDashboardExplainers({
    signals,
    keyAreas,
    bodySystems,
    hero,
    normalizedAnswers: normalization.normalizedAnswers,
    explainerRules,
  });

  // ── Persist results ──────────────────────────────────────────────────────────
  await persistDashboardResults({
    userId,
    runId,
    engineVersion,
    signals,
    keyAreas,
    bodySystems,
    hero,
  });

  // ── Build debug payload ──────────────────────────────────────────────────────
  const debug = buildDebugPayload({
    normalization,
    signals,
    influenceGraph,
    lifeStage,
    startedAt,
  });

  return {
    runId,
    userId,
    engineVersion,
    result: {
      signals,
      keyAreas,
      bodySystems,
      hero,
      explainers,
    },
    debug,
  };
}

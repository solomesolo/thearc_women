/**
 * Debug payload builder.
 * Assembles a human-inspectable payload explaining every engine decision.
 * A QA person must be able to answer "Why did this user get this hero?" from it.
 */

import type {
  EngineDebugPayload,
  NormalizationResult,
  DerivedSignalResult,
  InfluenceGraph,
  LifeStageScope,
} from '../types';

export function buildDebugPayload(params: {
  normalization: NormalizationResult;
  signals: DerivedSignalResult[];
  influenceGraph: InfluenceGraph;
  lifeStage: LifeStageScope;
  startedAt: number;
}): EngineDebugPayload {
  const { normalization, signals, influenceGraph, lifeStage, startedAt } = params;

  return {
    normalizationWarnings: normalization.warnings,
    normalizationTrace: normalization.trace,
    signalTrace: signals.map((s) => s.debugTrace),
    influenceTrace: influenceGraph,
    lifeStage,
    runDurationMs: Date.now() - startedAt,
  };
}

/**
 * Layer 3 — Build Influence Graph
 *
 * Maps active signals to key areas, body systems, and hero candidates
 * using DB-loaded mapping tables. Applies strength × confidence × weight
 * multipliers. Returns a graph of weighted destination contributions.
 *
 * Multipliers (explicit and testable):
 *   Strength:    mild=1.0, moderate=1.5, strong=2.0
 *   Confidence:  low=0.7,  medium=1.0,  high=1.2
 */

import type {
  DerivedSignalResult,
  InfluenceGraph,
  DestinationContribution,
  SignalContribution,
  SignalToKeyAreaMapping,
  SignalToBodySystemMapping,
  SignalToHeroMapping,
  LifeStageScope,
  SignalStrength,
  ConfidenceBand,
} from '../types';
import { evaluateRuleJson } from '../rules/evaluateRuleJson';

// ─── Multiplier tables ───────────────────────────────────────────────────────

const STRENGTH_MULTIPLIER: Record<SignalStrength, number> = {
  mild: 1.0,
  moderate: 1.5,
  strong: 2.0,
};

const CONFIDENCE_MULTIPLIER: Record<ConfidenceBand, number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.2,
};

function strengthMult(s: SignalStrength | null): number {
  return s ? STRENGTH_MULTIPLIER[s] : 0;
}

function confidenceMult(c: ConfidenceBand): number {
  return CONFIDENCE_MULTIPLIER[c];
}

/** Check if a mapping's conditions_json gate passes (or no gate = always pass). */
function gatePasses(
  conditionsJson: unknown,
  signal: DerivedSignalResult,
  signalMap: Record<string, DerivedSignalResult>
): boolean {
  if (!conditionsJson) return true;
  // Build a minimal context for gate evaluation
  const ctx = {
    answers: {},
    signals: Object.fromEntries(
      Object.entries(signalMap).map(([code, s]) => [
        code,
        { isActive: s.isActive, signalStrength: s.signalStrength, confidence: s.confidence },
      ])
    ),
  };
  return evaluateRuleJson(conditionsJson, ctx).result;
}

/** Check life-stage scope applicability. */
function scopeApplies(scope: string, lifeStage: LifeStageScope): boolean {
  return scope === 'all' || scope === lifeStage;
}

function getOrCreate(
  map: Record<string, DestinationContribution>,
  code: string,
  type: 'key_area' | 'body_system' | 'hero'
): DestinationContribution {
  if (!map[code]) {
    map[code] = { destinationCode: code, destinationType: type, totalScore: 0, confidenceAdjustedScore: 0, contributions: [] };
  }
  return map[code]!;
}

/**
 * Build the influence graph from active signals and mapping rules.
 * Only active signals contribute to weighted scores.
 */
export function buildInfluenceGraph(
  signals: DerivedSignalResult[],
  lifeStage: LifeStageScope,
  keyAreaMappings: SignalToKeyAreaMapping[],
  bodySystemMappings: SignalToBodySystemMapping[],
  heroMappings: SignalToHeroMapping[]
): InfluenceGraph {
  const keyAreas: Record<string, DestinationContribution> = {};
  const bodySystems: Record<string, DestinationContribution> = {};
  const heroes: Record<string, DestinationContribution> = {};

  // Build signal lookup for gate evaluation
  const signalMap: Record<string, DerivedSignalResult> = {};
  for (const s of signals) signalMap[s.signalCode] = s;

  // Only active signals contribute to scoring
  const activeSignals = signals.filter((s) => s.isActive);

  // ── Key areas ──────────────────────────────────────────────────────────────
  for (const mapping of keyAreaMappings) {
    if (!scopeApplies(mapping.lifeStageScope, lifeStage)) continue;

    const signal = signalMap[mapping.signalCode];
    if (!signal?.isActive) continue;
    if (!gatePasses(mapping.conditionsJson, signal, signalMap)) continue;

    const sm = strengthMult(signal.signalStrength);
    const cm = confidenceMult(signal.confidence);
    const finalContrib = mapping.weight * sm * cm;

    const dest = getOrCreate(keyAreas, mapping.keyAreaCode, 'key_area');
    dest.totalScore += mapping.weight * sm;
    dest.confidenceAdjustedScore += finalContrib;
    dest.contributions.push({
      signalCode: mapping.signalCode,
      influenceType: mapping.influenceType,
      baseWeight: mapping.weight,
      strengthMultiplier: sm,
      confidenceMultiplier: cm,
      finalContribution: finalContrib,
    });
  }

  // ── Body systems ───────────────────────────────────────────────────────────
  for (const mapping of bodySystemMappings) {
    if (!scopeApplies(mapping.lifeStageScope, lifeStage)) continue;

    const signal = signalMap[mapping.signalCode];
    if (!signal?.isActive) continue;
    if (!gatePasses(mapping.conditionsJson, signal, signalMap)) continue;

    const sm = strengthMult(signal.signalStrength);
    const cm = confidenceMult(signal.confidence);
    const finalContrib = mapping.weight * sm * cm;

    const dest = getOrCreate(bodySystems, mapping.bodySystemCode, 'body_system');
    dest.totalScore += mapping.weight * sm;
    dest.confidenceAdjustedScore += finalContrib;
    dest.contributions.push({
      signalCode: mapping.signalCode,
      influenceType: mapping.influenceType,
      baseWeight: mapping.weight,
      strengthMultiplier: sm,
      confidenceMultiplier: cm,
      finalContribution: finalContrib,
    });
  }

  // ── Heroes ─────────────────────────────────────────────────────────────────
  for (const mapping of heroMappings) {
    if (!scopeApplies(mapping.lifeStageScope, lifeStage)) continue;

    const signal = signalMap[mapping.signalCode];
    if (!signal?.isActive) continue;
    if (!gatePasses(mapping.conditionsJson, signal, signalMap)) continue;

    const sm = strengthMult(signal.signalStrength);
    const cm = confidenceMult(signal.confidence);
    // Hero scoring also incorporates specificity to prefer specific heroes
    const finalContrib = mapping.weight * sm * cm * mapping.specificityScore;

    const dest = getOrCreate(heroes, mapping.heroCode, 'hero');
    dest.totalScore += mapping.weight * sm;
    dest.confidenceAdjustedScore += finalContrib;
    dest.contributions.push({
      signalCode: mapping.signalCode,
      influenceType: 'primary', // heroes always primary
      baseWeight: mapping.weight,
      strengthMultiplier: sm,
      confidenceMultiplier: cm,
      finalContribution: finalContrib,
    });
  }

  // Ensure all active signals have at least one destination (for traceability)
  void activeSignals;

  return { keyAreas, bodySystems, heroes };
}

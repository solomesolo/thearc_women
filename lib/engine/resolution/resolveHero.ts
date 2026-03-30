/**
 * Layer 6 — Hero Resolution
 *
 * Selects the single best explanatory hero for the user's pattern.
 *
 * Selection strategy:
 *   1. Evaluate all hero_resolution_rules (required signals, exclusions, gates)
 *   2. Score each candidate: confidenceAdjustedScore × specificityBonus
 *   3. Apply non-overlap constraints (if a higher-ranked hero is selected,
 *      constrained heroes are suppressed)
 *   4. Pick the highest scoring qualifying hero
 *   5. Fall back to HERO_BASELINE if no rule qualifies
 *
 * A more specific, evidence-backed hero always beats a generic one.
 */

import type {
  HeroResult,
  HeroResolutionRule,
  InfluenceGraph,
  DerivedSignalResult,
  KeyAreaResult,
  BodySystemResult,
  LifeStageScope,
  ConfidenceBand,
  SuppressedHeroCandidate,
  RuleEvalContext,
} from '../types';
import { evaluateRuleJson } from '../rules/evaluateRuleJson';

const FALLBACK_HERO = 'HERO_BASELINE';
const CONFIDENCE_ORDER: ConfidenceBand[] = ['low', 'medium', 'high'];

function confidenceGte(a: ConfidenceBand, b: ConfidenceBand): boolean {
  return CONFIDENCE_ORDER.indexOf(a) >= CONFIDENCE_ORDER.indexOf(b);
}

function scopeApplies(scope: string, lifeStage: LifeStageScope): boolean {
  return scope === 'all' || scope === lifeStage;
}

function deriveHeroConfidence(
  dest: InfluenceGraph['heroes'][string] | undefined
): ConfidenceBand {
  if (!dest) return 'low';
  if (dest.contributions.length >= 3 && dest.confidenceAdjustedScore >= 4) return 'high';
  if (dest.contributions.length >= 2 || dest.confidenceAdjustedScore >= 2) return 'medium';
  return 'low';
}

function buildCtx(
  signalMap: Record<string, DerivedSignalResult>,
  keyAreaMap: Record<string, KeyAreaResult>
): RuleEvalContext {
  return {
    answers: {},
    signals: Object.fromEntries(
      Object.entries(signalMap).map(([code, s]) => [
        code,
        { isActive: s.isActive, signalStrength: s.signalStrength, confidence: s.confidence },
      ])
    ),
    influenceScores: Object.fromEntries(
      Object.entries(keyAreaMap).map(([code, ka]) => [code, ka.score])
    ),
  };
}

type HeroCandidate = {
  rule: HeroResolutionRule;
  score: number;
  confidence: ConfidenceBand;
  contributingSignals: string[];
};

export function resolveHero(
  signals: DerivedSignalResult[],
  keyAreas: KeyAreaResult[],
  bodySystems: BodySystemResult[],
  influenceGraph: InfluenceGraph,
  lifeStage: LifeStageScope,
  rules: HeroResolutionRule[]
): HeroResult {
  const signalMap: Record<string, DerivedSignalResult> = {};
  for (const s of signals) signalMap[s.signalCode] = s;

  const keyAreaMap: Record<string, KeyAreaResult> = {};
  for (const ka of keyAreas) keyAreaMap[ka.keyAreaCode] = ka;

  const ctx = buildCtx(signalMap, keyAreaMap);

  const qualifyingCandidates: HeroCandidate[] = [];
  const suppressedCandidates: SuppressedHeroCandidate[] = [];

  for (const rule of rules) {
    if (!scopeApplies(rule.lifeStageScope, lifeStage)) continue;

    const heroDest = influenceGraph.heroes[rule.heroCode];

    // Required signals
    if (!rule.requiredSignals.every((c) => signalMap[c]?.isActive)) {
      suppressedCandidates.push({
        heroCode: rule.heroCode,
        score: heroDest?.confidenceAdjustedScore ?? 0,
        reason: `required_signals_not_met`,
      });
      continue;
    }

    // Excluded signals
    if (rule.excludedSignals.some((c) => signalMap[c]?.isActive)) {
      suppressedCandidates.push({
        heroCode: rule.heroCode,
        score: heroDest?.confidenceAdjustedScore ?? 0,
        reason: `excluded_signal_active`,
      });
      continue;
    }

    // Minimum cluster score
    const heroScore = heroDest?.confidenceAdjustedScore ?? 0;
    if (heroScore < rule.minimumClusterScore) {
      suppressedCandidates.push({
        heroCode: rule.heroCode,
        score: heroScore,
        reason: `score_${heroScore}_below_min_${rule.minimumClusterScore}`,
      });
      continue;
    }

    // Minimum confidence
    const confidence = deriveHeroConfidence(heroDest);
    if (!confidenceGte(confidence, rule.minimumConfidence)) {
      suppressedCandidates.push({
        heroCode: rule.heroCode,
        score: heroScore,
        reason: `confidence_below_min`,
      });
      continue;
    }

    // Optional rule_json gate
    if (rule.ruleJson) {
      const eval_ = evaluateRuleJson(rule.ruleJson, ctx);
      if (!eval_.result) {
        suppressedCandidates.push({
          heroCode: rule.heroCode,
          score: heroScore,
          reason: `rule_json_failed`,
        });
        continue;
      }
    }

    // Incorporate specificity into final scoring so specific heroes beat generic ones
    const specificityBonus = 1 + rule.minimumSpecificityScore;
    const finalScore = heroScore * specificityBonus;

    qualifyingCandidates.push({
      rule,
      score: finalScore,
      confidence,
      contributingSignals: heroDest?.contributions.map((c) => c.signalCode) ?? [],
    });
  }

  // Sort qualifying candidates: score desc, then rule_priority desc, then heroCode alpha
  qualifyingCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.rule.rulePriority !== a.rule.rulePriority) return b.rule.rulePriority - a.rule.rulePriority;
    return a.rule.heroCode.localeCompare(b.rule.heroCode);
  });

  // Apply non-overlap constraints: once a hero is selected, remove constrained heroes
  const selectedHeroCodes = new Set<string>();
  let winner: HeroCandidate | null = null;

  for (const candidate of qualifyingCandidates) {
    const heroCode = candidate.rule.heroCode;

    // Skip if this hero was suppressed by an already-selected hero's overlap constraint
    if (selectedHeroCodes.has(heroCode)) continue;

    if (!winner) {
      winner = candidate;
      selectedHeroCodes.add(heroCode);
      // Add non-overlap constraints
      for (const constrained of candidate.rule.nonOverlapConstraints) {
        selectedHeroCodes.add(constrained);
        suppressedCandidates.push({
          heroCode: constrained,
          score: influenceGraph.heroes[constrained]?.confidenceAdjustedScore ?? 0,
          reason: `suppressed_by_overlap_constraint_from_${heroCode}`,
        });
      }
      break;
    }
  }

  if (!winner) {
    // Fallback: HERO_BASELINE
    return {
      heroCode: FALLBACK_HERO,
      score: 0,
      confidence: 'low',
      contributingSignals: [],
      whySelected: 'no_qualifying_rule:fallback_to_baseline',
      suppressedHeroCandidates: suppressedCandidates,
    };
  }

  return {
    heroCode: winner.rule.heroCode,
    score: winner.score,
    confidence: winner.confidence,
    contributingSignals: winner.contributingSignals,
    whySelected: winner.rule.resolutionLogic || `rule:${winner.rule.ruleName}`,
    suppressedHeroCandidates: suppressedCandidates.filter((s) => s.heroCode !== winner!.rule.heroCode),
  };
}

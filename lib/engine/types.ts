/**
 * Canonical TypeScript types for the deterministic 7-layer dashboard engine.
 *
 * Layer flow:
 *   survey answers → NormalizedAnswerMap
 *   → DerivedSignalResult[]
 *   → InfluenceGraph
 *   → KeyAreaResult[] + BodySystemResult[]
 *   → HeroResult
 *   → ExplainerBundle
 *   → EngineRunOutput
 */

// ─── Shared primitives ───────────────────────────────────────────────────────

export type SignalStrength = 'mild' | 'moderate' | 'strong';
export type ConfidenceBand = 'low' | 'medium' | 'high';
export type InfluenceType = 'primary' | 'secondary' | 'contextual';
export type LifeStageScope =
  | 'all'
  | 'reproductive'
  | 'postpartum'
  | 'perimenopause'
  | 'menopause'
  | 'unknown';

export type NormalizedType =
  | 'boolean'
  | 'ordinal'
  | 'numeric'
  | 'canonical_text'
  | 'json'
  | 'unknown';

export type ExplanationType =
  | 'positive_driver'
  | 'negative_driver'
  | 'ruled_out_driver'
  | 'contextual_modifier';

// ─── Layer 1: Survey answer normalization ────────────────────────────────────

export type NormalizedAnswer = {
  questionCode: string;
  rawValue: unknown;
  normalizedValue: unknown;
  normalizedType: NormalizedType;
  ordinalValue: number | null;
  booleanValue: boolean | null;
  numericValue: number | null;
  canonicalCode: string | null;
};

export type NormalizedAnswerMap = Record<string, NormalizedAnswer>;

export type NormalizationTraceEntry = {
  questionCode: string;
  rawValue: unknown;
  outcome: 'mapped' | 'unmapped' | 'missing' | 'numeric_passthrough' | 'boolean_passthrough';
  appliedRuleId?: string;
  warning?: string;
};

export type NormalizationResult = {
  normalizedAnswers: NormalizedAnswerMap;
  rawAnswers: Record<string, unknown>;
  warnings: string[];
  trace: NormalizationTraceEntry[];
  surveyVersion: string;
  lifeStage: LifeStageScope;
};

// ─── Layer 2: Derived signal results ────────────────────────────────────────

export type SignalSupportingAnswer = {
  questionCode: string;
  value: unknown;
  contribution: number;
  rationale?: string;
};

export type SignalDebugTrace = {
  evaluatedRule: unknown;
  matchedConditions: string[];
  unmatchedConditions: string[];
  confidenceReason: string[];
  suppressionReason?: string[];
  rawTriggerScore: number;
  strengthDetermination: string;
};

export type DerivedSignalResult = {
  signalCode: string;
  isActive: boolean;
  signalStrength: SignalStrength | null;
  confidence: ConfidenceBand;
  lifeStageModifierApplied: string | null;
  supportingAnswers: SignalSupportingAnswer[];
  exclusionsTriggered: string[];
  triggerScore: number;
  debugTrace: SignalDebugTrace;
};

// ─── Layer 3: Influence graph ────────────────────────────────────────────────

export type SignalContribution = {
  signalCode: string;
  influenceType: InfluenceType;
  baseWeight: number;
  strengthMultiplier: number;
  confidenceMultiplier: number;
  finalContribution: number;
};

export type DestinationContribution = {
  destinationCode: string;
  destinationType: 'key_area' | 'body_system' | 'hero';
  totalScore: number;
  confidenceAdjustedScore: number;
  contributions: SignalContribution[];
};

export type InfluenceGraph = {
  keyAreas: Record<string, DestinationContribution>;
  bodySystems: Record<string, DestinationContribution>;
  heroes: Record<string, DestinationContribution>;
};

// ─── Layer 4/5: Key area & body system resolution ────────────────────────────

export type SuppressedCandidate = {
  stateCode: string;
  ruleName: string;
  score: number;
  reason: string;
};

export type KeyAreaResult = {
  keyAreaCode: string;
  resolvedStateCode: string;
  score: number;
  confidence: ConfidenceBand;
  contributingSignals: string[];
  suppressedStateCandidates: SuppressedCandidate[];
  explanationCandidates: string[];
  ruleApplied: string;
};

export type BodySystemResult = {
  bodySystemCode: string;
  resolvedStateCode: string;
  score: number;
  confidence: ConfidenceBand;
  contributingSignals: string[];
  suppressedStateCandidates: SuppressedCandidate[];
  explanationCandidates: string[];
  ruleApplied: string;
};

// ─── Layer 6: Hero resolution ────────────────────────────────────────────────

export type SuppressedHeroCandidate = {
  heroCode: string;
  score: number;
  reason: string;
};

export type HeroResult = {
  heroCode: string;
  score: number;
  confidence: ConfidenceBand;
  contributingSignals: string[];
  whySelected: string;
  suppressedHeroCandidates: SuppressedHeroCandidate[];
};

// ─── Layer 7: Explainers ─────────────────────────────────────────────────────

export type ExplainerEntry = {
  signalCode: string;
  explanationType: ExplanationType;
  text: string;
  priority: number;
};

export type ExplainerBundle = {
  hero: ExplainerEntry[];
  keyAreas: Record<string, ExplainerEntry[]>;
  bodySystems: Record<string, ExplainerEntry[]>;
  global: ExplainerEntry[];
};

// ─── DB rule shapes (deserialized from Supabase rows) ────────────────────────

export type NormalizationRule = {
  id: string;
  surveyVersion: string;
  questionCode: string;
  rawValue: string;
  normalizedValue: string | null;
  normalizedType: NormalizedType;
  ordinalValue: number | null;
  booleanValue: boolean | null;
  numericValue: number | null;
  canonicalCode: string | null;
  lifeStageScope: string;
  approved: boolean;
  version: number;
};

export type DerivedSignalFlagRule = {
  id: string;
  signalCode: string;
  signalName: string;
  domain: string;
  sourceVariables: string[];
  triggerLogic: string;
  ruleJson: unknown;
  minTriggerScore: number;
  supportingConditions: unknown;
  exclusionConditions: unknown;
  lifeStageModifier: Array<{ scope: string; thresholdDelta: number; strengthDelta?: string }> | null;
  defaultStrength: SignalStrength;
  confidenceRule: unknown;
  safeLanguageNotes: string;
  approved: boolean;
  version: number;
};

export type SignalToKeyAreaMapping = {
  id: string;
  signalCode: string;
  keyAreaCode: string;
  influenceType: InfluenceType;
  weight: number;
  confidenceEffect: number;
  lifeStageScope: string;
  conditionsJson: unknown;
  approved: boolean;
  version: number;
};

export type SignalToBodySystemMapping = {
  id: string;
  signalCode: string;
  bodySystemCode: string;
  influenceType: InfluenceType;
  weight: number;
  confidenceEffect: number;
  lifeStageScope: string;
  conditionsJson: unknown;
  approved: boolean;
  version: number;
};

export type SignalToHeroMapping = {
  id: string;
  signalCode: string;
  heroCode: string;
  weight: number;
  specificityScore: number;
  priorityScore: number;
  lifeStageScope: string;
  conditionsJson: unknown;
  approved: boolean;
  version: number;
};

export type KeyAreaResolutionRule = {
  id: string;
  keyAreaCode: string;
  stateCode: string;
  ruleName: string;
  rulePriority: number;
  requiredSignals: string[];
  supportingSignals: string[];
  excludedSignals: string[];
  minimumTotalWeight: number;
  minimumConfidence: ConfidenceBand;
  lifeStageScope: string;
  resolutionLogic: string;
  ruleJson: unknown;
  approved: boolean;
  version: number;
};

export type BodySystemResolutionRule = {
  id: string;
  bodySystemCode: string;
  stateCode: string;
  ruleName: string;
  rulePriority: number;
  requiredSignals: string[];
  supportingSignals: string[];
  excludedSignals: string[];
  minimumTotalWeight: number;
  minimumConfidence: ConfidenceBand;
  lifeStageScope: string;
  resolutionLogic: string;
  ruleJson: unknown;
  approved: boolean;
  version: number;
};

export type HeroResolutionRule = {
  id: string;
  heroCode: string;
  ruleName: string;
  rulePriority: number;
  requiredSignals: string[];
  supportingSignals: string[];
  excludedSignals: string[];
  minimumClusterScore: number;
  minimumSpecificityScore: number;
  minimumConfidence: ConfidenceBand;
  nonOverlapConstraints: string[];
  lifeStageScope: string;
  resolutionLogic: string;
  ruleJson: unknown;
  approved: boolean;
  version: number;
};

export type SignalExplainerRule = {
  id: string;
  signalCode: string;
  explanationType: ExplanationType;
  templateText: string;
  requiredSupportingAnswers: string[];
  conditionsJson: unknown;
  priority: number;
  safeLanguageNotes: string;
  approved: boolean;
  version: number;
};

// ─── Rule evaluator ──────────────────────────────────────────────────────────

export type RuleEvalContext = {
  answers: NormalizedAnswerMap;
  signals?: Record<string, { isActive: boolean; signalStrength: SignalStrength | null; confidence: ConfidenceBand }>;
  influenceScores?: Record<string, number>;
};

export type RuleEvalResult = {
  result: boolean;
  matched: string[];
  unmatched: string[];
};

// ─── Engine run I/O ──────────────────────────────────────────────────────────

export type EngineRunInput = {
  userId: string;
  runId: string;
  surveyAnswers: Record<string, unknown>;
  optionalLabs?: Record<string, number>;
  surveyVersion?: string;
  engineVersion: string;
};

export type EngineDebugPayload = {
  normalizationWarnings: string[];
  normalizationTrace: NormalizationTraceEntry[];
  signalTrace: SignalDebugTrace[];
  influenceTrace: InfluenceGraph;
  lifeStage: LifeStageScope;
  runDurationMs: number;
};

export type EngineRunOutput = {
  runId: string;
  userId: string;
  engineVersion: string;
  result: {
    signals: DerivedSignalResult[];
    keyAreas: KeyAreaResult[];
    bodySystems: BodySystemResult[];
    hero: HeroResult;
    explainers: ExplainerBundle;
  };
  debug: EngineDebugPayload;
};

// ─── Persistence ─────────────────────────────────────────────────────────────

export type PersistInput = {
  userId: string;
  runId: string;
  engineVersion: string;
  signals: DerivedSignalResult[];
  keyAreas: KeyAreaResult[];
  bodySystems: BodySystemResult[];
  hero: HeroResult;
  influencers?: Array<{ code: string; score: number; confidence: ConfidenceBand; sourceSignalCodes: string[]; explanation: Record<string, unknown> }>;
};

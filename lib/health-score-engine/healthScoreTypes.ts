export type HealthScorePolicyKey = "weighted_completion_v1";

export type HealthScoreBundleStatus =
  | "missing"
  | "outdated"
  | "planned"
  | "current"
  | "completed_current"
  | "optional"
  | "suppressed";

export type HealthScoreBand = "low" | "moderate" | "strong" | "high";

export type BundleBreakdown = {
  bundle_key: string;
  status: HealthScoreBundleStatus;
  base_weight: number;
  relevance_weight: number; // multiplier
  status_multiplier: number;
  coverage_ratio: number;
  denominator_weight: number;
  numerator_value: number;
  rationale: string[];
};

export type HealthScoreOutput = {
  score: number;
  method: HealthScorePolicyKey;
  band: HealthScoreBand;
  numerator_total: number;
  denominator_total: number;
  bundle_count: number;
  top_gaps: string[];
  bundle_breakdown: BundleBreakdown[];
};


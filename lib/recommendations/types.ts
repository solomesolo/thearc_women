export type BundleKey =
  | "vitamin_d"
  | "iron_status"
  | "b12_folate"
  | "thyroid_basic"
  | "thyroid_extended"
  | "lipid_panel"
  | "glucose_metabolic"
  | "stress_cortisol"
  | "female_hormone_balance"
  | "fertility_reserve"
  | "androgen_balance"
  | "liver_function"
  | "kidney_function"
  | "inflammation_basic"
  | "omega3_status"
  | "magnesium_status"
  | "iodine_status"
  | "sti_panel"
  | "gut_health_basic"
  | "comprehensive_preventive";

export type RecencyEnum = "lt_3m" | "3_6m" | "6_12m" | "gt_12m";
export type BundleStatus = "missing" | "outdated" | "current" | "optional";

export type ScoreEvent = {
  rule_key: string;
  bundle_key: BundleKey;
  score_delta: number;
  reason_code: string;
  reason_payload?: Record<string, unknown>;
};

export type ScoreState = {
  bundle_key: BundleKey;
  score: number;
  reasons: Set<string>;
  events: ScoreEvent[];
};

export type EngineAProfileSnapshotLike = {
  id?: string;
  userEmail?: string;
  userName?: string | null;
  ageGroup?: string | null;
  lifeStage?: string | null;
  goalFlags?: unknown;
  riskFlags?: unknown;
  conditionFlags?: unknown;
  medicationFlags?: unknown;
  familyHistoryFlags?: unknown;
  lifestyleFlags?: unknown;
  lastTests?: unknown;
};

export type RecommendationResultVM = {
  bundle_key: BundleKey;
  display_name: string;
  category: string;
  priority_rank: number;
  priority_score: number;
  status: BundleStatus;
  reasons: string[];
  matched_products: Array<{
    product_id: string;
    name: string;
    match_score: number;
  }>;
};

export type RecommendationRunVM = {
  engine_version: string;
  profile_snapshot_id: string;
  tests_to_action: number;
  top_priorities: RecommendationResultVM[];
  recommendations: RecommendationResultVM[];
  overview_summary: {
    total_recommended: number;
    missing_count: number;
    outdated_count: number;
    current_count: number;
    optional_count: number;
  };
};


export type QuestionKey =
  | "country"
  | "age_range"
  | "life_stage"
  | "goals"
  | "symptoms"
  | "cycle_pattern"
  | "sun_exposure"
  | "diet_pattern"
  | "lifestyle_context"
  | "known_conditions"
  | "medications_or_hormones"
  | "family_history"
  | "last_tests";

export type RawQuestionnaireAnswers = Partial<{
  country: string;
  age_range: string;
  life_stage: string;
  goals: string[];
  symptoms: string[];
  cycle_pattern: string;
  sun_exposure: string;
  diet_pattern: string[];
  lifestyle_context: string[];
  known_conditions: string[];
  medications_or_hormones: string[];
  family_history: string[];
  last_tests: Record<string, string | null>;
}>;

export type DomainKey =
  | "nutrient_status"
  | "thyroid_health"
  | "female_hormones"
  | "fertility"
  | "androgen_balance"
  | "stress_sleep"
  | "metabolic_health"
  | "cardiovascular_health"
  | "gut_health"
  | "inflammation"
  | "organ_function"
  | "sexual_health";

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
  | "gut_health_basic"
  | "sti_panel"
  | "comprehensive_preventive";

export type RecencyEnum = "lt_3m" | "3_6m" | "6_12m" | "gt_12m";
export type RecencyHint = "unknown_or_never" | "recent" | "moderate" | "aging" | "stale";

export type NormalizedProfile = {
  user_name: string;
  country: string | null;
  age_group: string | null;
  age_group_label: string | null;
  life_stage: string | null;
  life_stage_label: string | null;
  goal_flags: string[];
  goal_labels: string[];
  risk_flags: string[];
  condition_flags: string[];
  medication_flags: string[];
  family_history_flags: string[];
  lifestyle_flags: string[];
  domain_affinities: Record<string, number>;
  bundle_affinities: Record<string, number>;
  last_tests: Record<string, RecencyEnum | null>;
  recency_hints: Record<string, RecencyHint>;
  profile_completeness_percent: number;
  retake_state:
    | "not_needed"
    | "recommended_after_90_days"
    | "recommended_after_major_profile_change"
    | "incomplete_assessment_exists";
  profile_summary: Record<string, unknown>;
  raw_profile: RawQuestionnaireAnswers;
};


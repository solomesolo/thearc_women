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

export type RecencyStatus = "missing" | "outdated" | "current";
export type ExecutionStatus = "none" | "planned" | "completed";
export type FinalStatus = RecencyStatus | "planned" | "completed";
export type StateGroup = "action_needed" | "in_progress" | "done" | "up_to_date";

export type EvidenceSource =
  | "lab_result_verified"
  | "ocr_parsed_result"
  | "manual_result_entry"
  | "questionnaire_last_test"
  | "self_reported_completion"
  | "user_marked_planned";

export type Evidence = {
  bundle_key: BundleKey;
  evidence_source: EvidenceSource;
  evidence_date: Date | null;
  raw_recency_code?: string | null;
  confidence_score: number;
};

export type ActionType = "mark_planned" | "mark_completed" | "unmark_planned" | "reopen";
export type UserAction = {
  bundle_key: BundleKey;
  action_type: ActionType;
  action_at: Date;
};

export type StatusByBundle = Record<
  BundleKey,
  {
    recency_status: RecencyStatus;
    execution_status: ExecutionStatus;
    final_status: FinalStatus;
    state_group: StateGroup;
    effective_interval_months: number;
    evidence_source_used?: EvidenceSource;
    evidence_date_used?: string; // ISO date
  }
>;

export type DashboardCounts = {
  tests_to_action: number;
  planned: number;
  completed: number;
  current: number;
};

export type StatusEngineOutput = {
  by_bundle: Partial<StatusByBundle>;
  dashboard_counts: DashboardCounts;
};


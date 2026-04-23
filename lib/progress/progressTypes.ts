export type RecommendationStatus = "missing" | "outdated" | "current" | "optional";
export type ProgressState = "not_started" | "planned" | "completed";
export type SelectedRoute = "lab" | "home_test" | "doctor" | "private" | null;

export type DashboardProgressCounts = {
  action_needed: number;
  planned: number;
  completed: number;
};

export type ProgressItem = {
  recommendation_instance_id: string; // for now we use bundleKey as stable ID in the mock adapter
  recommendation_status: RecommendationStatus;
  progress_state: ProgressState;
  selected_route: SelectedRoute;
  selected_product_id: string | null;
  selected_action_option_id: string | null;
  planned_for_date: string | null;
  completed_at: string | null;
};

export type ProgressSummaryResponse = {
  counts: DashboardProgressCounts;
};

export type ProgressListResponse = {
  items: ProgressItem[];
};

export type ApplyProgressEventRequest =
  | { recommendation_instance_id: string; event_type: "mark_planned" }
  | { recommendation_instance_id: string; event_type: "mark_completed" }
  | { recommendation_instance_id: string; event_type: "select_lab_option"; selected_route: "lab"; selected_action_option_id?: string; selected_product_id?: string }
  | { recommendation_instance_id: string; event_type: "select_home_test_option"; selected_route: "home_test"; selected_action_option_id?: string; selected_product_id?: string };

export type ApplyProgressEventResponse = {
  recommendation_instance_id: string;
  progress: Omit<ProgressItem, "recommendation_instance_id" | "recommendation_status">;
  counts: DashboardProgressCounts;
};


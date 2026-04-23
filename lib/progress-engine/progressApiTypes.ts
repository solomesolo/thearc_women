import type { ProgressDashboardCounts } from "./progressCounters";

export type ProgressDashboardResponse = {
  dashboard_counts: ProgressDashboardCounts;
};

export type ProgressEventResponse = {
  recommendation_instance_id: string;
  bundle_key: string;
  progress: {
    progress_state: string;
    selected_route?: string;
    selected_product_id?: string;
    selected_action_option_id?: string;
    updated_at: string;
  };
  event: {
    id: string;
    created_at: string;
  };
};


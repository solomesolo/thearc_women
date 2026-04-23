export type DashboardState = "ready" | "needs_assessment" | "no_recommendations";

export type DashboardSummary = {
  version: string;
  dashboard_state: DashboardState;
  header: { title: string; subtitle: string };
  kpis: {
    tests_to_action: number;
    planned: number;
    completed: number;
    health_score: number | null;
  };
  overview_card: { title: string; subtitle: string; cta_route: string; badge_count?: number };
  action_plan_card: { title: string; subtitle: string; cta_route: string };
  top_priorities: Array<{
    rank: number;
    bundle_key: string;
    display_name: string;
    status: string;
    badge_label: string;
  }>;
  score_widget: { label: string; value: number | null; caption: string };
  upcoming_checks: Array<{ time_label: string; title: string; bundle_key?: string; event_type?: string }>;
  profile_summary: { age_group: string; life_stage: string; goals: string; retake_assessment_route: string };
};


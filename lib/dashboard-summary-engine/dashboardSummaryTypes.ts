export type DashboardState = "ready" | "needs_assessment" | "no_recommendations";

export type HeaderVM = {
  title: string;
  subtitle: string;
};

export type KpisVM = {
  tests_to_action: number;
  planned: number;
  completed: number;
  health_score: number | null;
};

export type OverviewCardVM = {
  title: string;
  subtitle: string;
  cta_route: string;
  badge_count?: number;
};

export type ActionPlanCardVM = {
  title: string;
  subtitle: string;
  cta_route: string;
};

export type TopPriorityVM = {
  rank: number;
  bundle_key: string;
  display_name: string;
  status: string;
  badge_label: string;
};

export type ScoreWidgetVM = {
  label: string;
  value: number | null;
  caption: string;
};

export type UpcomingCheckVM = {
  time_label: string;
  title: string;
  bundle_key?: string;
  event_type?: string;
};

export type ProfileSummaryVM = {
  age_group: string;
  life_stage: string;
  goals: string;
  retake_assessment_route: string;
};

export type DashboardSummaryResponse = {
  version: string;
  dashboard_state: DashboardState;
  header: HeaderVM;
  kpis: KpisVM;
  overview_card: OverviewCardVM;
  action_plan_card: ActionPlanCardVM;
  top_priorities: TopPriorityVM[];
  score_widget: ScoreWidgetVM;
  upcoming_checks: UpcomingCheckVM[];
  profile_summary: ProfileSummaryVM;
};


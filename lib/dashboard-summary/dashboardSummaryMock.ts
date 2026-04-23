import type { DashboardSummary } from "./dashboardSummaryTypes";

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  version: "dashboard_summary_v1",
  dashboard_state: "ready",
  header: { title: "Hello, demo@thearc.com", subtitle: "Your personalized health dashboard" },
  kpis: { tests_to_action: 3, planned: 0, completed: 0, health_score: 32 },
  overview_card: { title: "My Overview", subtitle: "Health score and flagged signals", cta_route: "/results/overview" },
  action_plan_card: { title: "Action Plan", subtitle: "3 tests with lab and home options", cta_route: "/results/action-plan" },
  top_priorities: [
    { rank: 1, bundle_key: "vitamin_d", display_name: "Vitamin D", status: "missing", badge_label: "MISSING" },
    { rank: 2, bundle_key: "iron_status", display_name: "Iron / Ferritin", status: "outdated", badge_label: "OUTDATED" },
    { rank: 3, bundle_key: "thyroid_basic", display_name: "Thyroid (TSH)", status: "outdated", badge_label: "OUTDATED" },
  ],
  score_widget: { label: "Health Completeness Score", value: 32, caption: "Based on your current health data" },
  upcoming_checks: [
    { time_label: "THIS MONTH", title: "Vitamin D blood test", bundle_key: "vitamin_d", event_type: "check" },
    { time_label: "NEXT MONTH", title: "Iron / Ferritin check", bundle_key: "iron_status", event_type: "check" },
    { time_label: "IN 6 WEEKS", title: "Thyroid (TSH) check", bundle_key: "thyroid_basic", event_type: "check" },
    { time_label: "IN 3 MONTHS", title: "Follow-up — review Vitamin D result", bundle_key: "vitamin_d", event_type: "follow_up" },
  ],
  profile_summary: {
    age_group: "30–34",
    life_stage: "Regular menstrual cycle",
    goals: "General preventive health, More energy and vitality",
    retake_assessment_route: "/onboarding/start",
  },
};


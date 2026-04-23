import type { DashboardState } from "./dashboardSummaryTypes";

export function resolveDashboardState(input: {
  hasProfile: boolean;
  recommendationCount: number;
}): DashboardState {
  if (!input.hasProfile) return "needs_assessment";
  if (input.recommendationCount <= 0) return "no_recommendations";
  return "ready";
}


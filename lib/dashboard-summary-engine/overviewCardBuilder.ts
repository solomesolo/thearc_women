import type { OverviewCardVM } from "./dashboardSummaryTypes";

export function buildOverviewCard(input: { badgeCount: number }): OverviewCardVM {
  return {
    title: "My Overview",
    subtitle: "Health score and flagged signals",
    cta_route: "/results/overview",
    badge_count: input.badgeCount,
  };
}


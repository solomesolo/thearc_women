import type { ActionPlanCardVM } from "./dashboardSummaryTypes";

export function buildActionPlanCard(input: { testsToAction: number }): ActionPlanCardVM {
  const n = input.testsToAction;
  return {
    title: "Action Plan",
    subtitle: `${n} tests with lab and home options`,
    cta_route: "/results/action-plan",
  };
}


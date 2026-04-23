import type { KpisVM } from "./dashboardSummaryTypes";

export function buildKpis(input: {
  progressCounts: { action_needed: number; planned: number; completed: number } | null;
  healthScore: number | null;
}): KpisVM {
  return {
    tests_to_action: input.progressCounts?.action_needed ?? 0,
    planned: input.progressCounts?.planned ?? 0,
    completed: input.progressCounts?.completed ?? 0,
    health_score: input.healthScore,
  };
}


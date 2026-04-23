import type { ProgressState, RecommendationStatus } from "./progressTypes";

export type ProgressDashboardCounts = {
  action_needed: number;
  planned: number;
  completed: number;
};

export function computeProgressDashboardCounts(
  rows: Array<{ recommendation_status: RecommendationStatus; progress_state: ProgressState }>,
): ProgressDashboardCounts {
  let action_needed = 0;
  let planned = 0;
  let completed = 0;

  for (const r of rows) {
    if (r.progress_state === "completed") {
      completed += 1;
      continue;
    }

    if (r.recommendation_status === "missing" || r.recommendation_status === "outdated") {
      if (r.progress_state === "planned") planned += 1;
      else action_needed += 1; // not_started
    }
  }

  return { action_needed, planned, completed };
}


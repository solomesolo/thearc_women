/**
 * Dashboard data adapter — Phase 0.
 * Builds a single view model from either dummy input or (later) survey engine output.
 * Swap the survey engine by changing the input passed to buildDashboardViewModel.
 *
 * Only this adapter should read from dashboard dummy data; all UI consumes DashboardVM.
 */

import type { DashboardVM, DummyInput, SurveyOutput } from "@/types/dashboard";
import { getDummyPayloadByTimeRange } from "@/data/dashboardDummy";

function isDummyInput(input: DummyInput | SurveyOutput): input is DummyInput {
  return (input as DummyInput)._source === "dummy";
}

/**
 * Builds the dashboard view model from either dummy data or survey/assessment output.
 * - For Phase 0: call with dummy input (e.g. buildDashboardViewModel({ _source: 'dummy', timeRange: '7d' })).
 * - Changing timeRange swaps values in the VM (dummy variants for today / 7d / 30d).
 * - Later: pass survey engine output and implement mapping from SurveyOutput → DashboardVM here.
 */
export function buildDashboardViewModel(
  input: SurveyOutput | DummyInput
): DashboardVM {
  if (isDummyInput(input)) {
    return buildFromDummy(input.timeRange ?? "7d");
  }
  return buildFromSurvey(input);
}

function buildFromDummy(timeRange: "today" | "7d" | "30d"): DashboardVM {
  const payload = getDummyPayloadByTimeRange(timeRange);
  return {
    lens: payload.lens,
    systems: [...payload.systems],
    clusters: [...payload.clusters],
    monitoringAreas: [...payload.monitoringAreas],
    knowledgeCards: [...payload.knowledgeCards],
    labs: [...payload.labs],
    priorities: [...payload.priorities],
    trackingSignals: [...payload.trackingSignals],
    rootPatterns: [...payload.rootPatterns],
    weeklyInsights: [...payload.weeklyInsights],
    traces: [...payload.traces],
    strategies: [...payload.strategies],
  };
}

/**
 * Maps survey/assessment engine output to DashboardVM.
 * Phase 0: returns dummy-based VM; replace with real mapping when survey engine is wired.
 */
function buildFromSurvey(_output: SurveyOutput): DashboardVM {
  // TODO: map profile, lens, and any engine outputs to DashboardVM.
  // For now, use dummy data so the dashboard page can render.
  return buildFromDummy("7d");
}

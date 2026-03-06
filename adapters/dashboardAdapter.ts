/**
 * Dashboard data adapter — Phase 0.
 * Builds a single view model from either dummy input or (later) survey engine output.
 * Swap the survey engine by changing the input passed to buildDashboardViewModel.
 *
 * Only this adapter should read from dashboard dummy data; all UI consumes DashboardVM.
 */

import type {
  DashboardVM,
  DummyInput,
  EngineOutputJson,
  Lens,
  ReasoningTrace,
  RootPattern,
  SurveyOutput,
  System,
  Cluster,
} from "@/types/dashboard";
import {
  getDummyPayloadByTimeRange,
  dummyMonitoringAreas,
  dummyKnowledgeCards,
  dummyLabs,
  dummyPriorities,
  dummyTrackingSignals,
  dummyWeeklyInsights,
  dummyStrategies,
} from "@/data/dashboardDummy";

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
    const timeRange = (input as DummyInput).timeRange ?? "7d";
    const payload = (input as DummyInput).payload ?? getDummyPayloadByTimeRange(timeRange);
    return buildFromDummyPayload(payload);
  }
  return buildFromSurvey(input);
}

function buildFromDummyPayload(
  payload: ReturnType<typeof getDummyPayloadByTimeRange>
): DashboardVM {
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

function buildFromDummy(timeRange: "today" | "7d" | "30d"): DashboardVM {
  return buildFromDummyPayload(getDummyPayloadByTimeRange(timeRange));
}

function evidenceLevelToEvidence(
  level: string | null | undefined
): "strong" | "established" | "emerging" | "exploratory" {
  if (level === "High") return "strong";
  if (level === "Moderate") return "established";
  if (level === "Emerging") return "emerging";
  if (level === "Clinical_Practice") return "exploratory";
  return "exploratory";
}

/**
 * Maps survey/assessment engine output to DashboardVM.
 */
function buildFromSurvey(surveyOutput: SurveyOutput): DashboardVM {
  const out: EngineOutputJson = surveyOutput.output;
  const sections = out.dashboard_sections ?? {};
  const lensCard = sections.primary_lens_card ?? {};
  const lensResult = out.lens ?? {};
  const lens: Lens = {
    id: lensResult.primary_lens_id ?? "LENS_BASELINE",
    title: lensCard.title ?? "Your lens",
    oneLine: lensCard.body ?? "",
    traceId: lensResult.reasoning_trace_id ?? lensCard.show_reasoning_trace_id ?? undefined,
  };

  const systemItems = sections.systems_map?.items ?? [];
  const systems: System[] = systemItems.map((item) => ({
    id: item.system_id ?? "",
    label: item.label ?? item.system_id ?? "",
    status: (item.status as "stable" | "variable" | "needs_attention") ?? "stable",
    traceId: item.reasoning_trace_id ?? undefined,
    micro: item.short_explanation,
  }));

  const clusterList = sections.clusters_panel?.clusters ?? out.clusters ?? [];
  const clusters: Cluster[] = clusterList.map((c) => ({
    id: c.cluster_id ?? "",
    label: c.cluster_id ?? "",
    systemIds: [],
    traceId: c.reasoning_trace_id ?? undefined,
  }));

  const patternList = sections.root_patterns_panel?.root_patterns ?? out.root_patterns ?? [];
  const rootPatterns: RootPattern[] = patternList.map((p) => ({
    id: p.pattern_id ?? "",
    title: p.pattern_id ?? "",
    summary: `Confidence ${p.confidence ?? 0}%.`,
    signalTags: [],
    evidence: evidenceLevelToEvidence(p.evidence_level),
    traceId: p.reasoning_trace_id ?? undefined,
  }));

  const tracesMap = out.debug_meta?.reasoning_traces ?? {};
  const traces: ReasoningTrace[] = Object.entries(tracesMap).map(([id, t]) => ({
    id,
    title: t.entity_id ?? t.summary ?? id,
    signals: [],
    interpretation: t.summary ?? "",
    chainSteps: [
      ...(t.inputs ? [{ label: "Inputs", detail: JSON.stringify(t.inputs) }] : []),
      ...(t.calculations ? [{ label: "Calculations", detail: JSON.stringify(t.calculations) }] : []),
      ...(t.outputs ? [{ label: "Outputs", detail: JSON.stringify(t.outputs) }] : []),
    ],
    evidence: "exploratory",
    watchNext: [],
  }));

  return {
    lens,
    systems,
    clusters,
    monitoringAreas: [...dummyMonitoringAreas],
    knowledgeCards: [...dummyKnowledgeCards],
    labs: [...dummyLabs],
    priorities: [...dummyPriorities],
    trackingSignals: [...dummyTrackingSignals],
    rootPatterns,
    weeklyInsights: [...dummyWeeklyInsights],
    traces,
    strategies: [...dummyStrategies],
  };
}

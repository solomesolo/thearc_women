/**
 * Dashboard types — Phase 0 foundations.
 * Used by the dashboard page and adapter; swap survey engine via adapter input.
 */

// —— Entities ——

export type Lens = {
  id: string;
  title: string;
  oneLine: string;
  confidence?: "low" | "medium" | "high";
  /** Trace to open when "Show reasoning" is clicked. */
  traceId?: string;
};

export type SystemStatus = "stable" | "variable" | "needs_attention";

export type System = {
  id: string;
  label: string;
  description?: string;
  traceId?: string;
  status?: SystemStatus;
  /** Optional one-line micro for the tile (e.g. "Sleep variability elevated"). */
  micro?: string;
};

export type Cluster = {
  id: string;
  label: string;
  systemIds: string[];
  summary?: string;
  /** Trace to open when "Why?" is clicked. */
  traceId?: string;
};

export type MonitoringArea = {
  id: string;
  label: string;
  description?: string;
  signalIds: string[];
  priority?: number;
  /** Slug for blog article detail route (e.g. /blog/[slug]). */
  slug?: string;
};

export type KnowledgeCard = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  category: string;
  readTime: string;
  whyItMattersForYou?: string;
};

export type Lab = {
  id: string;
  name: string;
  reflects?: string;
  whenToCheck?: string;
  protocolId?: string;
};

export type Priority = {
  id: string;
  label: string;
  focus: string;
  order: number;
  lensId?: string;
  /** Route or modal id for "framework" (e.g. /dashboard/framework/[id]). */
  frameworkId?: string;
};

export type TrackingSignal = {
  id: string;
  label: string;
  category: "wearables" | "symptoms" | "cycle" | "labs";
  connectedDomains: string[];
  whatItIs?: string;
};

export type RootPattern = {
  id: string;
  title: string;
  summary: string;
  signalTags: string[];
  evidence: "strong" | "established" | "emerging" | "exploratory";
  traceId?: string;
};

export type WeeklyInsight = {
  id: string;
  title: string;
  noticed: string[];
  interpretation: string;
  watchNext: string[];
  traceIds?: string[];
  weekLabel?: string;
};

/** For Preventive Strategy Library: filterable by life stage, symptoms, biomarkers. */
export type PreventiveStrategy = {
  id: string;
  title: string;
  oneLine: string;
  /** Labels for filter chips (life stage). */
  lifeStage?: string[];
  /** Labels for filter chips (symptoms). */
  symptoms?: string[];
  /** Labels for filter chips (biomarkers). */
  biomarkers?: string[];
};

export type TraceChainStep = { label: string; detail?: string };

/** Reasoning Trace — step-by-step interpretation for the dashboard. */
export type ReasoningTrace = {
  id: string;
  title: string;
  signals: string[];
  interpretation: string;
  chainSteps: TraceChainStep[];
  evidence: "strong" | "established" | "emerging" | "exploratory";
  watchNext: string[];
  relatedLinks?: { label: string; href: string }[];
};

// —— Adapter input (survey engine swap) ——

/** Engine output shape (subset) from Python engine for adapter mapping. */
export type EngineOutputJson = {
  lens?: {
    primary_lens_id?: string;
    primary_lens_score?: number;
    secondary_lens_id?: string | null;
    reasoning_trace_id?: string | null;
  };
  clusters?: Array<{
    cluster_id?: string;
    strength?: number;
    confidence?: number;
    reasoning_trace_id?: string | null;
  }>;
  systems?: Array<{
    system_id?: string;
    score?: number;
    status?: string;
    reasoning_trace_id?: string | null;
  }>;
  root_patterns?: Array<{
    pattern_id?: string;
    score?: number;
    confidence?: number;
    evidence_level?: string | null;
    reasoning_trace_id?: string | null;
  }>;
  dashboard_sections?: {
    primary_lens_card?: { title?: string; body?: string; show_reasoning_trace_id?: string | null };
    systems_map?: {
      items?: Array<{
        system_id?: string;
        label?: string;
        score?: number;
        status?: string;
        reasoning_trace_id?: string | null;
        short_explanation?: string;
      }>;
    };
    clusters_panel?: { clusters?: Array<{ cluster_id?: string; strength?: number; confidence?: number; reasoning_trace_id?: string | null }> };
    root_patterns_panel?: {
      root_patterns?: Array<{
        pattern_id?: string;
        score?: number;
        confidence?: number;
        evidence_level?: string | null;
        reasoning_trace_id?: string | null;
      }>;
    };
  };
  debug_meta?: {
    reasoning_traces?: Record<
      string,
      {
        trace_type?: string;
        entity_id?: string;
        summary?: string;
        inputs?: Record<string, unknown>;
        calculations?: Record<string, unknown>;
        outputs?: Record<string, unknown>;
        links?: Record<string, unknown>;
      }
    >;
  };
};

/** Output from the survey/assessment engine (from GET /api/dashboard). */
export type SurveyOutput = {
  _source: "survey";
  output: EngineOutputJson;
  timeRange?: DashboardTimeRange;
};

/** Time range for dashboard; swapping changes which dummy variant (or future API window) is used. */
export type DashboardTimeRange = "today" | "7d" | "30d";

/** Dummy payload shape (same as getDummyPayloadByTimeRange return). */
export type DummyPayload = {
  lens: Lens;
  systems: System[];
  clusters: Cluster[];
  monitoringAreas: MonitoringArea[];
  knowledgeCards: KnowledgeCard[];
  labs: Lab[];
  priorities: Priority[];
  trackingSignals: TrackingSignal[];
  rootPatterns: RootPattern[];
  weeklyInsights: WeeklyInsight[];
  traces: ReasoningTrace[];
  strategies: PreventiveStrategy[];
};

/** Dummy input for Phase 0; adapter returns view model from static dummy data. */
export type DummyInput = {
  _source: "dummy";
  timeRange?: DashboardTimeRange;
  /** When provided (e.g. from API), use this instead of getDummyPayloadByTimeRange. */
  payload?: DummyPayload;
};

// —— View model (adapter output) ——

export type DashboardVM = {
  lens: Lens;
  systems: System[];
  clusters: Cluster[];
  monitoringAreas: MonitoringArea[];
  knowledgeCards: KnowledgeCard[];
  labs: Lab[];
  priorities: Priority[];
  trackingSignals: TrackingSignal[];
  rootPatterns: RootPattern[];
  weeklyInsights: WeeklyInsight[];
  traces: ReasoningTrace[];
  strategies: PreventiveStrategy[];
};

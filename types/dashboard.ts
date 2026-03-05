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
  /** Slug for knowledge detail route (e.g. /knowledge/[slug]). */
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

/** Future: output from the survey/assessment engine. */
export type SurveyOutput = {
  _source: "survey";
  profile?: {
    lifeStage?: string | null;
    cyclePattern?: string | null;
    goals?: string[];
    symptoms?: string[];
    riskFactors?: string[];
    trainingVolume?: string | null;
    stressLevel?: string | null;
    generatedTags?: string[];
  };
  lens?: { id: string; title: string; oneLine: string };
  /** Extend with more engine outputs as needed. */
};

/** Time range for dashboard; swapping changes which dummy variant (or future API window) is used. */
export type DashboardTimeRange = "today" | "7d" | "30d";

/** Dummy input for Phase 0; adapter returns view model from static dummy data. */
export type DummyInput = {
  _source: "dummy";
  timeRange?: DashboardTimeRange;
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

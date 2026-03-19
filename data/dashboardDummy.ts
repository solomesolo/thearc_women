/**
 * Dummy data for dashboard Phase 0.
 * Adapter uses this when input is DummyInput; replace with survey engine output later.
 */

import type {
  Lens,
  System,
  Cluster,
  MonitoringArea,
  KnowledgeCard,
  Lab,
  Priority,
  TrackingSignal,
  RootPattern,
  WeeklyInsight,
  ReasoningTrace,
  DashboardTimeRange,
  PreventiveStrategy,
} from "@/types/dashboard";

export const dummyLens: Lens = {
  id: "stress_nervous_system",
  title: "Stress & nervous system",
  oneLine: "Your profile points to stress and recovery as a primary lens for interpretation.",
  confidence: "high",
  traceId: "stress-load-hrv-suppression",
};

export const dummySystems: System[] = [
  { id: "Hormones", label: "Hormonal Rhythm", description: "Modulate sleep, recovery, metabolism.", traceId: "hormones-sleep-metabolism", status: "stable" },
  { id: "Metabolism", label: "Metabolic Health", description: "Shapes energy stability and recovery.", traceId: "metabolic-variability-mid-cycle", status: "variable" },
  { id: "Stress", label: "Stress Response", description: "Impacts sleep quality and recovery capacity.", traceId: "stress-load-hrv-suppression", status: "needs_attention", micro: "Sleep variability elevated" },
  { id: "Sleep", label: "Sleep Architecture", description: "Amplifies or buffers fatigue patterns.", traceId: "sleep-disruption-pre-onset", status: "variable" },
  { id: "Recovery", label: "Recovery Capacity", description: "Reflects total load and cycle context.", traceId: "late-luteal-recovery-dip", status: "variable" },
  { id: "Biomarkers", label: "Biomarkers", description: "Snapshots that become meaningful in timelines.", traceId: "micronutrient-reserve-low-signal", status: "stable" },
  { id: "Inflammation", label: "Inflammation", description: "Systemic and local markers in context.", traceId: "stress-load-hrv-suppression", status: "stable" },
  { id: "Nutrition", label: "Nutrition", description: "Fueling and micronutrients.", traceId: "metabolic-variability-mid-cycle", status: "stable" },
];

export const dummyClusters: Cluster[] = [
  { id: "c1", label: "Stress & recovery", systemIds: ["Stress", "Recovery", "Sleep"], summary: "Load, recovery, and sleep interaction.", traceId: "late-luteal-recovery-dip" },
  { id: "c2", label: "Hormones & metabolism", systemIds: ["Hormones", "Metabolism"], summary: "Cycle and energy interplay.", traceId: "hormones-sleep-metabolism" },
  { id: "c3", label: "Biomarkers & context", systemIds: ["Biomarkers", "Hormones"], summary: "Labs in context of phase and symptoms.", traceId: "micronutrient-reserve-low-signal" },
];

export const dummyMonitoringAreas: MonitoringArea[] = [
  { id: "ma1", label: "Recovery & HRV", description: "Watch recovery score and HRV trends to spot stress vs. recovery shifts.", signalIds: ["recovery-score", "hrv"], priority: 1, slug: "hrv-and-recovery" },
  { id: "ma2", label: "Sleep quality", description: "Sleep consistency affects energy and hormone balance—especially across phases.", signalIds: ["sleep-fragmentation", "sleep-duration"], priority: 2, slug: "cortisol-ranges-by-phase" },
  { id: "ma3", label: "Energy & phase", description: "Track energy stability by cycle phase to separate normal shifts from outliers.", signalIds: ["energy-stability", "cycle-phase"], priority: 3, slug: "cortisol-ranges-by-phase" },
];

export const dummyKnowledgeCards: KnowledgeCard[] = [
  {
    id: "kc1",
    slug: "cortisol-ranges-by-phase",
    title: "Why cortisol ranges differ by phase",
    abstract: "Reference intervals in studies often don't stratify by cycle phase.",
    category: "Hormones",
    readTime: "4 min",
    whyItMattersForYou: "Lab 'normal' may not match your phase.",
  },
  {
    id: "kc2",
    slug: "hrv-and-recovery",
    title: "HRV and recovery in female athletes",
    abstract: "How stress and cycle phase affect HRV interpretation.",
    category: "Training & Recovery",
    readTime: "5 min",
    whyItMattersForYou: "Your recovery baseline can shift by phase.",
  },
];

export const dummyLabs: Lab[] = [
  { id: "ferritin", name: "Ferritin", reflects: "Iron storage and availability.", whenToCheck: "When fatigue persists despite sleep.", protocolId: "energy" },
  { id: "tsh", name: "TSH", reflects: "Thyroid function.", whenToCheck: "When energy, weight, or temperature suggest thyroid.", protocolId: "hormonal" },
  { id: "vitamin-d", name: "Vitamin D", reflects: "Status and immune support.", whenToCheck: "Routine screening; low energy or mood.", protocolId: "energy" },
];

export const dummyPriorities: Priority[] = [
  { id: "p1", label: "Recovery first", focus: "Prioritize sleep and recovery before adding load.", order: 1, lensId: "stress_nervous_system", frameworkId: "recovery" },
  { id: "p2", label: "Phase-aware training", focus: "Match intensity to cycle phase when possible.", order: 2, lensId: "stress_nervous_system", frameworkId: "phase-aware" },
  { id: "p3", label: "Stress signals", focus: "Watch HRV and resting HR trends.", order: 3, lensId: "stress_nervous_system", frameworkId: "stress-signals" },
];

export const dummyTrackingSignals: TrackingSignal[] = [
  { id: "recovery-score", label: "Recovery score", category: "wearables", connectedDomains: ["Recovery", "Stress", "Sleep"], whatItIs: "Composite of HRV, resting HR, and sleep." },
  { id: "sleep-fragmentation", label: "Sleep fragmentation", category: "wearables", connectedDomains: ["Sleep", "Hormones", "Stress"], whatItIs: "Wake-ups and light sleep segments." },
  { id: "energy-stability", label: "Energy stability", category: "symptoms", connectedDomains: ["Metabolism", "Hormones"], whatItIs: "Day-to-day energy consistency." },
  { id: "cycle-phase", label: "Cycle phase", category: "cycle", connectedDomains: ["Hormones", "Metabolism", "Sleep"], whatItIs: "Menstrual cycle phase for context." },
];

export const dummyRootPatterns: RootPattern[] = [
  { id: "rp1", title: "Late luteal recovery dip", summary: "Recovery and sleep often dip in late luteal.", signalTags: ["recovery score", "sleep variability"], evidence: "established", traceId: "late-luteal-recovery-dip" },
  { id: "rp2", title: "Stress load and HRV", summary: "Sustained stress can suppress HRV.", signalTags: ["HRV", "resting HR", "recovery"], evidence: "strong", traceId: "stress-load-hrv-suppression" },
  { id: "rp3", title: "Sleep disruption before onset", summary: "Sleep architecture can shift in the days before menstrual onset.", signalTags: ["sleep fragmentation", "cycle phase"], evidence: "established", traceId: "sleep-disruption-pre-onset" },
  { id: "rp4", title: "Metabolic variability mid-cycle", summary: "Energy and appetite often vary with cycle phase.", signalTags: ["energy", "appetite", "glucose"], evidence: "established", traceId: "metabolic-variability-mid-cycle" },
];

export const dummyStrategies: PreventiveStrategy[] = [
  { id: "s1", title: "Recovery-first training", oneLine: "Structure load and recovery so sleep and HRV lead.", lifeStage: ["Reproductive", "Perimenopause"], symptoms: ["Fatigue"], biomarkers: [] },
  { id: "s2", title: "Phase-aware intensity", oneLine: "Adjust intensity by cycle phase to support consistency.", lifeStage: ["Reproductive", "Perimenopause"], symptoms: ["Fatigue", "Mood or focus shifts"], biomarkers: [] },
  { id: "s3", title: "Iron and energy", oneLine: "When to consider ferritin and how it fits fatigue.", lifeStage: ["Reproductive", "Perimenopause", "Postmenopause"], symptoms: ["Fatigue"], biomarkers: ["Ferritin"] },
  { id: "s4", title: "Thyroid awareness", oneLine: "When energy, weight, or temperature suggest thyroid.", lifeStage: ["Perimenopause", "Postmenopause"], symptoms: ["Fatigue", "Mood or focus shifts"], biomarkers: ["TSH"] },
  { id: "s5", title: "Vitamin D and mood", oneLine: "Routine screening and context for low energy or mood.", lifeStage: ["Reproductive", "Perimenopause", "Postmenopause"], symptoms: ["Mood or focus shifts"], biomarkers: ["Vitamin D"] },
];

const weeklyInsightsToday: WeeklyInsight[] = [
  {
    id: "wi-today",
    title: "Today",
    noticed: ["Recovery score in range.", "Sleep last night: 6h 20m."],
    interpretation: "Single-day view; trends become clearer over 7d or 30d.",
    watchNext: ["Check again after a few days for pattern."],
    traceIds: [],
    weekLabel: "Today",
  },
];

const weeklyInsights7d: WeeklyInsight[] = [
  {
    id: "wi-7d",
    title: "Last 7 days",
    noticed: ["Recovery score dipped mid-week.", "Sleep variability increased."],
    interpretation: "Pattern aligns with late luteal phase; common and often not a concern.",
    watchNext: ["Track sleep timing.", "Note energy stability."],
    traceIds: ["late-luteal-recovery-dip"],
    weekLabel: "Mar 1–7",
  },
];

const weeklyInsights30d: WeeklyInsight[] = [
  {
    id: "wi-30d-1",
    title: "Last 30 days",
    noticed: ["Three recovery dips, aligned with cycle.", "Sleep consistency improved in week 2."],
    interpretation: "Recurring pattern in late luteal; sleep interventions may be helping.",
    watchNext: ["Compare next cycle.", "Keep sleep timing consistent."],
    traceIds: ["late-luteal-recovery-dip", "stress-load-hrv-suppression"],
    weekLabel: "Feb 5 – Mar 5",
  },
];

export const dummyWeeklyInsights: WeeklyInsight[] = weeklyInsights7d;

export const dummyTraces: ReasoningTrace[] = [
  {
    id: "late-luteal-recovery-dip",
    title: "Late luteal recovery dip",
    signals: ["recovery score drop", "sleep variability", "resting HR rise"],
    interpretation: "Recovery and sleep often dip in late luteal phase due to thermoregulation and hormonal shifts.",
    chainSteps: [
      { label: "Signals", detail: "Recovery score drops, sleep variability increases." },
      { label: "System interpretation", detail: "Stress and hormonal systems may be interacting." },
      { label: "Pattern", detail: "Timing aligns with luteal phase." },
      { label: "Context", detail: "Common pattern; not necessarily a problem." },
    ],
    evidence: "established",
    watchNext: ["Track sleep timing consistency.", "Note energy stability this week."],
  },
  {
    id: "stress-load-hrv-suppression",
    title: "Stress load and HRV suppression",
    signals: ["HRV trend", "resting HR", "recovery score"],
    interpretation: "Sustained stress load can suppress HRV and elevate resting HR.",
    chainSteps: [
      { label: "Signals", detail: "HRV down, resting HR up over several days." },
      { label: "System interpretation", detail: "Stress and recovery systems under load." },
      { label: "Pattern", detail: "Incomplete recovery between days." },
    ],
    evidence: "strong",
    watchNext: ["Prioritize sleep and recovery.", "Consider load distribution."],
  },
  {
    id: "sleep-disruption-pre-onset",
    title: "Sleep disruption before onset",
    signals: ["sleep fragmentation", "wake-ups", "cycle phase"],
    interpretation: "Sleep architecture can shift in the days before menstrual onset.",
    chainSteps: [
      { label: "Signals", detail: "More wake-ups, lighter sleep." },
      { label: "System interpretation", detail: "Hormonal transition affects sleep regulation." },
      { label: "Pattern", detail: "Recurring in pre-onset window." },
    ],
    evidence: "established",
    watchNext: ["Compare with previous cycles.", "Note if it resolves post-onset."],
  },
  {
    id: "metabolic-variability-mid-cycle",
    title: "Metabolic variability mid-cycle",
    signals: ["energy fluctuations", "appetite", "glucose stability"],
    interpretation: "Energy and appetite often vary with cycle phase; mid-cycle shifts are common.",
    chainSteps: [
      { label: "Signals", detail: "Energy and appetite patterns shift." },
      { label: "System interpretation", detail: "Hormonal and metabolic systems interacting." },
      { label: "Pattern", detail: "Aligns with follicular–ovulatory transition." },
    ],
    evidence: "established",
    watchNext: ["Track energy 1–5 and meal timing.", "Note consistency of symptoms."],
  },
  {
    id: "micronutrient-reserve-low-signal",
    title: "Micronutrient reserve low-signal pattern",
    signals: ["ferritin", "vitamin D", "energy and recovery"],
    interpretation: "Low reserves can show up as persistent fatigue and slower recovery before labs flag.",
    chainSteps: [
      { label: "Signals", detail: "Energy and recovery trends; optional labs." },
      { label: "System interpretation", detail: "Micronutrient systems may be involved." },
      { label: "Context", detail: "Non-diagnostic; supports awareness and follow-up with a provider." },
    ],
    evidence: "emerging",
    watchNext: ["Discuss testing with your provider.", "Track energy and recovery trends."],
  },
  {
    id: "hormones-sleep-metabolism",
    title: "Hormones interact with sleep and metabolism",
    signals: ["cycle phase", "temperature", "sleep changes"],
    interpretation: "Hormonal shifts influence sleep architecture and metabolic signals.",
    chainSteps: [
      { label: "Signals", detail: "Cycle phase, temperature, sleep metrics." },
      { label: "System interpretation", detail: "Hormones, sleep, and metabolism linked." },
      { label: "Pattern", detail: "Phase-dependent variation is common." },
    ],
    evidence: "established",
    watchNext: ["Track sleep and energy by phase.", "Note symptom consistency."],
  },
];

/** Single dummy payload (default 7d); adapter uses this when input is DummyInput. */
export const dummyDashboardPayload = {
  lens: dummyLens,
  systems: dummySystems,
  clusters: dummyClusters,
  monitoringAreas: dummyMonitoringAreas,
  knowledgeCards: dummyKnowledgeCards,
  labs: dummyLabs,
  priorities: dummyPriorities,
  trackingSignals: dummyTrackingSignals,
  rootPatterns: dummyRootPatterns,
  weeklyInsights: dummyWeeklyInsights,
  traces: dummyTraces,
  strategies: dummyStrategies,
} as const;

/** Time-range–scoped dummy payload; swapping range swaps VM values (e.g. weeklyInsights). */
export function getDummyPayloadByTimeRange(range: DashboardTimeRange) {
  const weeklyInsights =
    range === "today" ? weeklyInsightsToday : range === "7d" ? weeklyInsights7d : weeklyInsights30d;
  return {
    lens: dummyLens,
    systems: dummySystems,
    clusters: dummyClusters,
    monitoringAreas: dummyMonitoringAreas,
    knowledgeCards: dummyKnowledgeCards,
    labs: dummyLabs,
    priorities: dummyPriorities,
    trackingSignals: dummyTrackingSignals,
    rootPatterns: dummyRootPatterns,
    weeklyInsights,
    traces: dummyTraces,
    strategies: dummyStrategies,
  };
}

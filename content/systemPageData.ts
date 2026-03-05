export type EvidenceLevel = "strong" | "established" | "emerging" | "exploratory";

export type TraceChainStep = { label: string; detail?: string };

export type ReasoningTrace = {
  id: string;
  title: string;
  signals: string[];
  interpretation: string;
  chainSteps: TraceChainStep[];
  evidence: EvidenceLevel;
  watchNext: string[];
  relatedLinks?: { label: string; href: string }[];
};

export type Domain = {
  id: string;
  label: string;
  traceId?: string;
};

export type Signal = {
  id: string;
  label: string;
  category: "wearables" | "symptoms" | "cycle" | "labs";
  connectedDomains: string[];
  patterns: string[];
  whatItIs: string;
  traceId?: string;
};

export type Edge = {
  domainA: string;
  domainB: string;
  insightId: string;
};

export type Insight = {
  id: string;
  title: string;
  sentence: string;
  signalTags: string[];
  evidence: EvidenceLevel;
  traceId: string;
};

export type PipelineStep = {
  id: string;
  label: string;
  intro: string;
  bullets: string[];
  exampleTraceId: string;
};

export type MonthCard = {
  label: string;
  summary: string;
  patternBullets: string[];
  watchNext: string[];
  traceId: string;
};

export type ProofPanelItem = {
  id: string;
  label: string;
  claim: string;
  relatedSignals: string[];
  traceId: string;
  ctaLabel?: string;
};

export type WeeklyBriefTab = "patterns" | "interactions" | "research";
export type WeeklyBriefContent = {
  noticed: string[];
  interpretation: string;
  watchNext: string[];
  traceIds?: string[];
};

export type EvidenceLevelDef = {
  id: EvidenceLevel;
  label: string;
  definition: string;
  whatWeInclude: string[];
  exampleInsight: string;
  exampleTraceId: string;
};

export const DOMAINS: Domain[] = [
  { id: "Hormones", label: "Hormones", traceId: "hormones-sleep-metabolism" },
  { id: "Metabolism", label: "Metabolism", traceId: "metabolic-variability-mid-cycle" },
  { id: "Stress", label: "Stress", traceId: "stress-load-hrv-suppression" },
  { id: "Sleep", label: "Sleep", traceId: "sleep-disruption-pre-onset" },
  { id: "Recovery", label: "Recovery", traceId: "late-luteal-recovery-dip" },
  { id: "Biomarkers", label: "Biomarkers", traceId: "micronutrient-reserve-low-signal" },
];

export const TRACES: ReasoningTrace[] = [
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

export const SIGNALS: Signal[] = [
  {
    id: "recovery-score",
    label: "Recovery score",
    category: "wearables",
    connectedDomains: ["Recovery", "Stress", "Sleep"],
    patterns: ["Dips in late luteal.", "Lower after poor sleep."],
    whatItIs: "Composite of HRV, resting HR, and sleep used by many wearables.",
    traceId: "late-luteal-recovery-dip",
  },
  {
    id: "sleep-fragmentation",
    label: "Sleep fragmentation",
    category: "wearables",
    connectedDomains: ["Sleep", "Hormones", "Stress"],
    patterns: ["Increases pre-onset.", "Worse under stress."],
    whatItIs: "Frequency of wake-ups and light sleep segments.",
    traceId: "sleep-disruption-pre-onset",
  },
  {
    id: "resting-hr",
    label: "Resting heart rate",
    category: "wearables",
    connectedDomains: ["Recovery", "Stress", "Metabolism"],
    patterns: ["Rises with load or illness.", "Phase-related variation."],
    whatItIs: "Resting HR trend from wearable or morning measurement.",
    traceId: "stress-load-hrv-suppression",
  },
  {
    id: "energy-level",
    label: "Energy level",
    category: "symptoms",
    connectedDomains: ["Metabolism", "Hormones", "Recovery"],
    patterns: ["Afternoon dip.", "Phase-dependent."],
    whatItIs: "Self-reported energy (e.g. 1–5 scale).",
    traceId: "metabolic-variability-mid-cycle",
  },
  {
    id: "cycle-phase",
    label: "Cycle phase",
    category: "cycle",
    connectedDomains: ["Hormones", "Sleep", "Metabolism"],
    patterns: ["Timing of symptoms.", "Recovery by phase."],
    whatItIs: "Current phase (e.g. follicular, ovulatory, luteal).",
    traceId: "hormones-sleep-metabolism",
  },
  {
    id: "ferritin",
    label: "Ferritin",
    category: "labs",
    connectedDomains: ["Biomarkers", "Recovery", "Metabolism"],
    patterns: ["Low end of range and fatigue.", "Improvement with correction."],
    whatItIs: "Iron storage marker; often checked with full blood count.",
    traceId: "micronutrient-reserve-low-signal",
  },
];

export const EDGES: Edge[] = [
  { domainA: "Hormones", domainB: "Sleep", insightId: "hormones-sleep" },
  { domainA: "Hormones", domainB: "Metabolism", insightId: "hormones-metabolism" },
  { domainA: "Stress", domainB: "Sleep", insightId: "stress-sleep" },
  { domainA: "Stress", domainB: "Recovery", insightId: "stress-recovery" },
  { domainA: "Sleep", domainB: "Recovery", insightId: "sleep-recovery" },
  { domainA: "Metabolism", domainB: "Biomarkers", insightId: "metabolism-biomarkers" },
];

export const INSIGHTS: Insight[] = [
  {
    id: "hormones-sleep",
    title: "Hormones ↔ Sleep",
    sentence: "Hormonal phases influence sleep architecture and fragmentation.",
    signalTags: ["cycle phase", "temperature", "sleep changes"],
    evidence: "established",
    traceId: "hormones-sleep-metabolism",
  },
  {
    id: "hormones-metabolism",
    title: "Hormones ↔ Metabolism",
    sentence: "Energy and appetite often vary with hormonal phase.",
    signalTags: ["energy patterns", "appetite", "glucose stability"],
    evidence: "established",
    traceId: "metabolic-variability-mid-cycle",
  },
  {
    id: "stress-sleep",
    title: "Stress ↔ Sleep",
    sentence: "Stress load can fragment sleep and reduce quality.",
    signalTags: ["cortisol rhythm", "sleep quality", "recovery scores"],
    evidence: "strong",
    traceId: "stress-load-hrv-suppression",
  },
  {
    id: "stress-recovery",
    title: "Stress ↔ Recovery",
    sentence: "Incomplete recovery often reflects sustained stress load.",
    signalTags: ["HRV", "resting HR", "recovery score"],
    evidence: "strong",
    traceId: "stress-load-hrv-suppression",
  },
  {
    id: "sleep-recovery",
    title: "Sleep ↔ Recovery",
    sentence: "Sleep quality directly affects next-day recovery metrics.",
    signalTags: ["sleep duration", "fragmentation", "recovery score"],
    evidence: "strong",
    traceId: "late-luteal-recovery-dip",
  },
  {
    id: "metabolism-biomarkers",
    title: "Metabolism ↔ Biomarkers",
    sentence: "Metabolic and inflammatory markers reflect system state.",
    signalTags: ["glucose", "lipids", "inflammatory markers"],
    evidence: "established",
    traceId: "micronutrient-reserve-low-signal",
  },
];

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "signals",
    label: "Signals",
    intro: "Your body produces signals through wearables, symptoms, cycle, and labs.",
    bullets: ["Recovery score, sleep, resting HR.", "Energy, mood, appetite.", "Cycle phase and lab trends."],
    exampleTraceId: "late-luteal-recovery-dip",
  },
  {
    id: "interpretation",
    label: "System interpretation",
    intro: "The system interprets how different physiological systems may be interacting.",
    bullets: ["Link signals to domains.", "Consider timing and context.", "Avoid single-signal conclusions."],
    exampleTraceId: "stress-load-hrv-suppression",
  },
  {
    id: "patterns",
    label: "Pattern recognition",
    intro: "Patterns become visible across time and cycle.",
    bullets: ["Phase-dependent trends.", "Recurring sequences.", "Baseline vs. change."],
    exampleTraceId: "metabolic-variability-mid-cycle",
  },
  {
    id: "preventive",
    label: "Preventive awareness",
    intro: "Awareness supports where to watch and when to follow up.",
    bullets: ["Early signals.", "Long-term trends.", "When to discuss with a provider."],
    exampleTraceId: "micronutrient-reserve-low-signal",
  },
];

export const HEALTH_MEMORY_MONTHS: MonthCard[] = [
  { label: "Sep", summary: "Recovery dip in late luteal; sleep variability increased.", patternBullets: ["Recovery score dip", "Sleep variability up"], watchNext: ["Track sleep timing.", "Note energy stability."], traceId: "late-luteal-recovery-dip" },
  { label: "Oct", summary: "Similar pattern; energy more stable in follicular phase.", patternBullets: ["Phase-dependent energy", "Follicular stability"], watchNext: ["Compare with Sep.", "Continue phase tracking."], traceId: "metabolic-variability-mid-cycle" },
  { label: "Nov", summary: "Stress load elevated; HRV and recovery declined for 10 days.", patternBullets: ["HRV decline", "Sustained load"], watchNext: ["Prioritize recovery.", "Review load distribution."], traceId: "stress-load-hrv-suppression" },
  { label: "Dec", summary: "Sleep disruption in pre-onset window in 2 cycles.", patternBullets: ["Pre-onset fragmentation", "Recurring pattern"], watchNext: ["Note if resolves post-onset.", "Compare cycles."], traceId: "sleep-disruption-pre-onset" },
  { label: "Jan", summary: "Ferritin low end; fatigue and recovery tracked.", patternBullets: ["Low ferritin", "Fatigue trend"], watchNext: ["Discuss testing with provider.", "Track energy."], traceId: "micronutrient-reserve-low-signal" },
  { label: "Feb", summary: "Patterns consistent; brief highlights weekly.", patternBullets: ["Stable patterns", "Weekly brief"], watchNext: ["Keep current tracking.", "Review monthly."], traceId: "late-luteal-recovery-dip" },
];

export const WEEKLY_BRIEF: Record<WeeklyBriefTab, WeeklyBriefContent> = {
  patterns: {
    noticed: [
      "Recovery score dipped in late luteal.",
      "Sleep fragmentation increased pre-onset.",
      "Energy more stable in follicular phase.",
    ],
    interpretation: "Cycle phase is influencing recovery and sleep in a recurring way.",
    watchNext: ["Track sleep timing this week.", "Note energy 1–5 by phase."],
    traceIds: ["late-luteal-recovery-dip", "sleep-disruption-pre-onset"],
  },
  interactions: {
    noticed: [
      "Hormones ↔ Sleep: phase-dependent fragmentation.",
      "Stress ↔ Recovery: HRV and recovery linked to load.",
      "Metabolism ↔ Biomarkers: ferritin and energy trend.",
    ],
    interpretation: "Multiple systems interacting; no single cause.",
    watchNext: ["Review which edges matter most for you.", "Add one signal if helpful."],
    traceIds: ["hormones-sleep-metabolism", "stress-load-hrv-suppression"],
  },
  research: {
    noticed: [
      "New study on sleep variability across menstrual phases.",
      "Review on HRV and recovery in female athletes.",
    ],
    interpretation: "Evidence supports phase-dependent interpretation of your signals.",
    watchNext: ["Revisit interpretation in 2 weeks.", "Compare with your patterns."],
    traceIds: ["sleep-disruption-pre-onset"],
  },
};

export const EVIDENCE_LEVELS: EvidenceLevelDef[] = [
  {
    id: "strong",
    label: "Clinical studies",
    definition: "Findings from clinical trials or large observational studies.",
    whatWeInclude: ["Randomized trials.", "Large cohort studies.", "Consistent meta-analyses."],
    exampleInsight: "Sleep quality affects next-day recovery metrics.",
    exampleTraceId: "late-luteal-recovery-dip",
  },
  {
    id: "established",
    label: "Established physiology",
    definition: "Well-established physiological mechanisms and consistent evidence.",
    whatWeInclude: ["Mechanism well understood.", "Consistent across studies.", "Widely accepted in practice."],
    exampleInsight: "Hormonal phases influence sleep architecture.",
    exampleTraceId: "hormones-sleep-metabolism",
  },
  {
    id: "emerging",
    label: "Emerging research",
    definition: "Growing evidence but not yet consensus; useful for awareness.",
    whatWeInclude: ["Promising studies.", "Mechanisms under study.", "Context-dependent."],
    exampleInsight: "Low micronutrient reserves may show as fatigue before labs flag.",
    exampleTraceId: "micronutrient-reserve-low-signal",
  },
  {
    id: "exploratory",
    label: "Exploratory",
    definition: "Early or limited evidence; for curiosity and discussion with a provider.",
    whatWeInclude: ["Preliminary findings.", "Small studies.", "Anecdotal patterns."],
    exampleInsight: "Some report symptom patterns that align with cycle; more data needed.",
    exampleTraceId: "metabolic-variability-mid-cycle",
  },
];

export const SYSTEM2_HERO = {
  h1: "How The Arc thinks",
  lead: "Signals become insight when they're connected to your biology—not just listed.",
  proofLabel: "PROOF",
  proofLead: "Signals become insight when they're connected to your biology, not just listed.",
  proofPanels: [
    { id: "Hormones", label: "Hormones", claim: "Cycle-driven hormonal shifts influence energy, sleep, and metabolism.", relatedSignals: ["cycle phase", "temperature", "sleep changes"], traceId: "hormones-sleep-metabolism", ctaLabel: "Show reasoning" },
    { id: "Metabolism", label: "Metabolism", claim: "Metabolic signals interact with hormones, energy, and recovery.", relatedSignals: ["energy patterns", "glucose stability", "appetite"], traceId: "metabolic-variability-mid-cycle", ctaLabel: "Show reasoning" },
    { id: "Stress", label: "Stress", claim: "Stress load affects sleep, recovery, and hormonal balance.", relatedSignals: ["cortisol rhythm", "sleep quality", "recovery scores"], traceId: "stress-load-hrv-suppression", ctaLabel: "Show reasoning" },
    { id: "Sleep", label: "Sleep", claim: "Sleep architecture changes across hormonal phases.", relatedSignals: ["sleep fragmentation", "phase shifts", "wake-ups"], traceId: "sleep-disruption-pre-onset", ctaLabel: "Show reasoning" },
    { id: "Recovery", label: "Recovery", claim: "Recovery capacity influences stress resilience and performance.", relatedSignals: ["HRV", "resting HR", "recovery score"], traceId: "late-luteal-recovery-dip", ctaLabel: "Show reasoning" },
    { id: "Biomarkers", label: "Biomarkers", claim: "Lab and wearable data gain meaning when seen in biological context.", relatedSignals: ["ferritin", "vitamin D", "inflammatory markers"], traceId: "micronutrient-reserve-low-signal", ctaLabel: "Show reasoning" },
  ] as ProofPanelItem[],
};

export type SystemCTAData = {
  headline: string;
  lead: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href?: string; onClick?: () => void };
  microNote?: string;
};

export const SYSTEM2_CTA: SystemCTAData = {
  headline: "Ready to see your signals in context?",
  lead: "Explore how the Arc connects sleep, hormones, stress, metabolism, and recovery over time.",
  primaryCta: { label: "Start exploring", href: "/survey" },
  secondaryCta: { label: "Learn more", href: "/about" },
  microNote: "Understanding your biology should not feel complicated.",
};

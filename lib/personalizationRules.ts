/**
 * Rule-based mapping from goals + signals to personalization output.
 * No AI; deterministic from selection.
 */

export type PersonalizationOutput = {
  startingLensTitle: string;
  startingLensReason: string;
  threeFocusAreas: [string, string, string];
  weeklyBriefPreview: {
    now: string;
    next: string;
    preventive: string;
  };
};

/** Priority order for resolving a single starting lens when multiple rules match */
const FOCUS_PRIORITY: Array<{
  key: string;
  title: string;
  goalTriggers: string[];
  signalTriggers: string[];
  reasonTemplate: string;
  focusAreas: [string, string, string];
  brief: { now: string; next: string; preventive: string };
}> = [
  {
    key: "performance",
    title: "Performance & Recovery",
    goalTriggers: ["Training performance"],
    signalTriggers: ["Training feels off"],
    reasonTemplate: "Based on your focus on training and recovery.",
    focusAreas: [
      "Load and recovery balance",
      "Training response patterns",
      "Inflammation and adaptation",
    ],
    brief: {
      now: "Current load vs. recovery capacity",
      next: "Suggested adjustments for your next block",
      preventive: "Recovery and injury risk context",
    },
  },
  {
    key: "energy",
    title: "Energy & Stress Load",
    goalTriggers: ["Energy stability"],
    signalTriggers: ["Exhausted despite sleep"],
    reasonTemplate: "Based on your focus on energy and stress.",
    focusAreas: [
      "Energy and cognitive clarity",
      "Stress and recovery interaction",
      "Sleep and restoration",
    ],
    brief: {
      now: "Energy and stress load this week",
      next: "Rest and pacing suggestions",
      preventive: "Sustained load and burnout context",
    },
  },
  {
    key: "hormonal",
    title: "Hormonal Dynamics",
    goalTriggers: ["Hormonal transition"],
    signalTriggers: ["Cycle changes"],
    reasonTemplate: "Based on your focus on hormonal and cycle context.",
    focusAreas: [
      "Cycle and phase context",
      "Hormonal transition support",
      "Symptoms and variability",
    ],
    brief: {
      now: "Phase and symptom context",
      next: "Phase-aware recommendations",
      preventive: "Transition and long-term patterns",
    },
  },
  {
    key: "risk",
    title: "Preventive Risk & Screening Prep",
    goalTriggers: ["Family history / risk"],
    signalTriggers: [],
    reasonTemplate: "Based on your interest in preventive and risk context.",
    focusAreas: [
      "Risk factors and family history",
      "Screening and baseline context",
      "Lifestyle and prevention",
    ],
    brief: {
      now: "Relevant risk and screening context",
      next: "Prep and conversation prompts",
      preventive: "Long-term risk and monitoring",
    },
  },
  {
    key: "skin",
    title: "Skin Signals & Metabolic Context",
    goalTriggers: ["Skin / hair changes"],
    signalTriggers: [],
    reasonTemplate: "Based on your focus on skin and metabolic signals.",
    focusAreas: [
      "Skin and hair as signals",
      "Metabolic and hormonal context",
      "Nutrition and supplementation context",
    ],
    brief: {
      now: "Skin and metabolic signals",
      next: "Context and next steps",
      preventive: "Trends and baseline",
    },
  },
];

const DEFAULT_OUTPUT: PersonalizationOutput = {
  startingLensTitle: "Your physiology",
  startingLensReason: "Select goals or signals above to tailor your starting lens.",
  threeFocusAreas: [
    "Energy and recovery",
    "Patterns and variability",
    "Preventive context",
  ],
  weeklyBriefPreview: {
    now: "This week’s snapshot",
    next: "Suggested focus",
    preventive: "Long-term context",
  },
};

/**
 * Compute personalization output from selected goals (max 3) and signals (max 2).
 * First matching rule in priority order wins; otherwise returns default.
 */
export function getPersonalizationOutput(
  goals: string[],
  signals: string[]
): PersonalizationOutput {
  const goalSet = new Set(goals.map((g) => g.toLowerCase().trim()));
  const signalSet = new Set(signals.map((s) => s.toLowerCase().trim()));

  for (const rule of FOCUS_PRIORITY) {
    const goalMatch = rule.goalTriggers.some((t) => goalSet.has(t.toLowerCase()));
    const signalMatch =
      rule.signalTriggers.length > 0 &&
      rule.signalTriggers.some((t) => signalSet.has(t.toLowerCase()));
    if (goalMatch || signalMatch) {
      const refs: string[] = [];
      if (goals.length > 0) refs.push(goals[0]);
      if (signals.length > 0) refs.push(signals[0]);
      const reason =
        refs.length > 0
          ? `Based on ${refs.join(" and ").toLowerCase()}.`
          : rule.reasonTemplate;
      return {
        startingLensTitle: rule.title,
        startingLensReason: reason,
        threeFocusAreas: rule.focusAreas,
        weeklyBriefPreview: rule.brief,
      };
    }
  }

  return DEFAULT_OUTPUT;
}

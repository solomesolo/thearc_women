/**
 * Module library: Protect / Support / Observe templates per contributor.
 * Plans are composed from top contributor + training volume + wearable.
 */

import type { ContributorId } from "./contributors";
import type { TrainingVolume, Wearable } from "./types";

export interface ModuleTemplate {
  protect: string;
  support: string;
  observe: string;
  explanation: string;
}

export const MODULES: Record<ContributorId, ModuleTemplate> = {
  load_recovery_mismatch: {
    protect:
      "For 48 hours, protect recovery capacity: keep intensity below your usual peak, maintain movement frequency.",
    support:
      "Prioritize sleep opportunity and post-training recovery routine (protein + hydration).",
    observe:
      "Track perceived soreness duration and whether sessions feel heavy or smooth.",
    explanation:
      "When training quality drops after load increases, it often reflects recovery debt rather than loss of fitness.",
  },
  low_energy_availability: {
    protect: "Avoid stacking high intensity + calorie restriction this week.",
    support:
      "Increase consistency of fueling around training (especially carbs before/after), and keep protein stable.",
    observe:
      "Watch for morning energy, cravings, irritability, and unusual cold sensitivity.",
    explanation:
      "In active women, performance and mood can shift quickly when energy availability drops—even if weight changes are small.",
  },
  autonomic_strain: {
    protect:
      "Avoid adding new stressors (late training, high caffeine late day, back-to-back high-load days).",
    support:
      "Add one daily downshift routine (10 minutes): breath, walk, or heat/sauna—choose one.",
    observe:
      "Track stress reactivity (how quickly you feel wired) and sleep onset quality.",
    explanation:
      "Stress sensitivity fluctuates with nervous system state; recovery improves when load is matched to capacity.",
  },
  hormonal_modulation: {
    protect:
      "Avoid interpreting variability as failure—expect shifts and plan around them.",
    support:
      "Stabilize basics: consistent meals, hydration, and recovery routines.",
    observe:
      "Track cycle-related pattern: sleep, mood, training response, cravings—note timing.",
    explanation:
      "Female physiology is phase-dependent; patterns become predictable when you observe them with context.",
  },
  circadian_disruption: {
    protect: "Avoid late intense training and late heavy meals for 3–4 days.",
    support:
      "Anchor mornings: outdoor light + consistent wake time; keep caffeine earlier.",
    observe: "Track sleep timing consistency and afternoon energy dip.",
    explanation:
      "After travel, sleep can be long but non-restorative until circadian cues realign.",
  },
  post_illness_debt: {
    protect:
      "Treat this week as a re-entry week: keep intensity conservative even if motivation returns.",
    support:
      "Prioritize hydration, protein, and sleep window; add low-intensity movement.",
    observe:
      "Watch for heart rate creep during easy sessions or unusually high perceived effort.",
    explanation:
      "After illness, the nervous system and inflammatory recovery may lag behind symptom resolution.",
  },
};

/** Intensity adjustment by training volume (for plan details) */
export function getIntensityGuidance(volume: TrainingVolume): string {
  switch (volume) {
    case "high":
      return "Reduce intensity 15–20% for 48–72 hours.";
    case "moderate":
      return "Reduce intensity 10–15% for 48 hours.";
    case "low":
      return "Keep activity; focus on consistency and recovery.";
    default:
      return "Keep intensity moderate; prioritize recovery.";
  }
}

/** Monitor signals: no wearable vs wearable */
export const MONITOR_NO_WEARABLE = [
  "AM energy 1–5",
  "Sleep quality 1–5",
  "Training RPE vs usual",
];

export const MONITOR_WEARABLE = [
  "Resting HR trend",
  "Sleep duration / efficiency",
  "HRV trend (if available)",
];

export function getMonitorSignals(wearable: Wearable | undefined): { noWearable: string[]; wearable: string[] } {
  return {
    noWearable: [...MONITOR_NO_WEARABLE],
    wearable: [...MONITOR_WEARABLE],
  };
}

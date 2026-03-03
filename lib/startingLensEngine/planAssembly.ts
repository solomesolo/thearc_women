/**
 * Plan assembly: top contributor + context → 7-day plan (Protect / Support / Observe).
 * Days 1–2: stabilize (protect), Days 3–5: rebuild quality (support), Days 6–7: reassess (observe).
 */

import type { PlanDayBlock } from "./types";
import type { ContributorId } from "./contributors";
import { MODULES, getIntensityGuidance, getMonitorSignals } from "./modules";
import type { TrainingVolume, Wearable } from "./types";

export function assemblePlan(
  topContributorId: ContributorId,
  trainingVolume: TrainingVolume | undefined,
  wearable: Wearable | undefined
): { goal: string; plan: PlanDayBlock[]; monitor: { noWearable: string[]; wearable: string[] } } {
  const mod = MODULES[topContributorId];
  const intensity = getIntensityGuidance(trainingVolume ?? "moderate");
  const monitor = getMonitorSignals(wearable);

  const goal = "Stabilize recovery capacity without losing momentum.";

  const plan: PlanDayBlock[] = [
    {
      dayRange: "Days 1–2",
      focus: ["Reduce intensity", "Prioritize sleep window"],
      details: [
        intensity,
        mod.protect,
        "Focus on protection: avoid stacking stressors.",
      ],
    },
    {
      dayRange: "Days 3–5",
      focus: ["Rebuild training quality", "Fueling consistency"],
      details: [
        mod.support,
        "Gradually reintroduce quality sessions if energy allows.",
        "Keep protein and hydration consistent.",
      ],
    },
    {
      dayRange: "Days 6–7",
      focus: ["Assess adaptation", "Decide next block"],
      details: [
        mod.observe,
        "Review how you felt across the week.",
        "Decide whether to maintain, increase, or hold load for the next block.",
      ],
    },
  ];

  return { goal, plan, monitor };
}

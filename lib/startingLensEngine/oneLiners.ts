/**
 * One-line interpretations per lens (for output.lens.oneLine).
 */

import type { LensId } from "./types";

export const LENS_ONE_LINES: Record<LensId, string> = {
  performance_recovery:
    "Your inputs suggest a temporary mismatch between training load and recovery capacity.",
  energy_metabolic:
    "Energy and fueling patterns are likely influencing how you feel in training and daily life.",
  hormonal_dynamics:
    "Cycle or life-stage context may be driving variability in energy, sleep, or mood.",
  stress_nervous_system:
    "Stress load and nervous system recovery are likely playing a role in how you feel.",
  body_composition_appetite:
    "Body composition and appetite regulation are in focus; consistency in fueling and recovery matters.",
  preventive_risk:
    "This is a prevention-first lens: building a health memory and clarifying what to monitor over time.",
};

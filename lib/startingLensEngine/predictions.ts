/**
 * Conditional predictions: "If X then likely Y" with confidence.
 * Two predictions per output, based on lens and top contributor.
 */

import type { LensId } from "./types";
import type { ContributorId } from "./contributors";
import type { PredictionResult } from "./types";

const PREDICTION_PAIRS: Record<
  string,
  [PredictionResult, PredictionResult]
> = {
  load_recovery_mismatch: [
    {
      label: "If you reduce intensity for 48 hours",
      expected: "training should feel smoother by mid-week",
      confidence: "medium",
    },
    {
      label: "If sleep remains disrupted",
      expected: "fatigue and mood volatility may persist",
      confidence: "medium",
    },
  ],
  low_energy_availability: [
    {
      label: "If you stabilize fueling around training",
      expected: "energy stability often improves within 5–7 days",
      confidence: "medium",
    },
    {
      label: "If deficit and intensity stay high",
      expected: "fatigue and cravings may continue or worsen",
      confidence: "medium",
    },
  ],
  autonomic_strain: [
    {
      label: "If you add one daily downshift",
      expected: "sleep onset often improves within 3–5 nights",
      confidence: "medium",
    },
    {
      label: "If stress load stays elevated",
      expected: "sleep and recovery may remain inconsistent",
      confidence: "medium",
    },
  ],
  hormonal_modulation: [
    {
      label: "If you track timing-based patterns",
      expected: "variability becomes more predictable over 1–3 cycles",
      confidence: "low",
    },
    {
      label: "If basics stay consistent",
      expected: "symptoms often feel more manageable even when variable",
      confidence: "medium",
    },
  ],
  circadian_disruption: [
    {
      label: "If you anchor wake time and morning light",
      expected: "sleep and energy usually realign within 3–5 days",
      confidence: "medium",
    },
    {
      label: "If late training and meals continue",
      expected: "afternoon dip and sleep quality may lag",
      confidence: "medium",
    },
  ],
  post_illness_debt: [
    {
      label: "If you keep intensity conservative this week",
      expected: "recovery and energy typically normalize within 7–10 days",
      confidence: "medium",
    },
    {
      label: "If you push intensity too soon",
      expected: "fatigue or relapse in energy may extend recovery",
      confidence: "medium",
    },
  ],
};

export function getPredictions(
  topContributorId: ContributorId,
  _lensId: LensId
): PredictionResult[] {
  const pair = PREDICTION_PAIRS[topContributorId] ?? PREDICTION_PAIRS.load_recovery_mismatch;
  return pair;
}

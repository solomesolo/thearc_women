/**
 * Starting Lens v2: deterministic rule engine.
 * Inputs → lens score → contributors → modules → assembled plan.
 */

import type { StartingLensInput, StartingLensOutput } from "./types";
import { computeLensScores, selectLens, LENS_TITLES } from "./lensWeights";
import { LENS_ONE_LINES } from "./oneLiners";
import { selectContributors } from "./contributors";
import type { ContributorId } from "./contributors";
import { assemblePlan } from "./planAssembly";
import { getPredictions } from "./predictions";

const MEDICAL_SAFETY = {
  notDiagnosis: true,
  escalation:
    "If symptoms worsen rapidly or include concerning signs, consider seeking clinical advice.",
};

const SOURCES_STYLE = {
  evidenceLevel: "evidence-informed",
  notes:
    "Interpretation is based on common physiological patterns and preventive frameworks, not a diagnosis.",
};

export type { StartingLensInput, StartingLensOutput } from "./types";
export { LENS_TITLES, LENS_IDS } from "./lensWeights";

/**
 * Run the full pipeline: inputs → lens → contributors → plan → output.
 */
export function runLensEngine(input: StartingLensInput): StartingLensOutput {
  const { goals, symptoms, changes, cycleContext, lifeStage, trainingVolume, wearable } = input;
  const hasNothingSignificant = changes.some(
    (c) => c.toLowerCase().includes("nothing significant")
  );

  // Layer 1 — Lens selection
  const scores = computeLensScores({ goals, symptoms, changes });
  const lensId = selectLens(scores);
  const lensTitle = LENS_TITLES[lensId];
  const oneLine = LENS_ONE_LINES[lensId];

  // Layer 2 — Contributors
  const contributors = selectContributors({
    goals,
    symptoms,
    changes,
    lensId,
    cycleContext,
    lifeStage,
    wearable,
    hasNothingSignificant,
  });

  const topContributorId: ContributorId =
    contributors.length > 0
      ? (contributors[0].id as ContributorId)
      : "load_recovery_mismatch";

  // Layer 3 — Next 7 days plan
  const next7Days = assemblePlan(topContributorId, trainingVolume, wearable);

  // Predictions
  const predictions = getPredictions(topContributorId, lensId);

  return {
    lens: {
      id: lensId,
      title: lensTitle,
      oneLine,
    },
    contributors: contributors.map((c) => ({
      id: c.id,
      confidence: c.confidence,
      whyThisFits: c.whyThisFits,
      checkNext: c.checkNext,
    })),
    next7Days,
    predictions,
    medicalSafety: MEDICAL_SAFETY,
    sourcesStyle: SOURCES_STYLE,
  };
}

/**
 * Get only the lens title from inputs (for Knowledge Feed filtering).
 */
export function getLensTitleFromInput(input: StartingLensInput): string {
  const scores = computeLensScores({
    goals: input.goals,
    symptoms: input.symptoms,
    changes: input.changes,
  });
  const lensId = selectLens(scores);
  return LENS_TITLES[lensId];
}

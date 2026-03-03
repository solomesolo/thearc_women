/**
 * Lens scoring rules: Goals, Symptoms, and Recent Changes → lens weights.
 * Sleep weights map to stress_nervous_system. "Recovery debt" from illness maps to performance_recovery.
 */

import type { LensId } from "./types";

export const LENS_IDS: LensId[] = [
  "performance_recovery",
  "energy_metabolic",
  "hormonal_dynamics",
  "stress_nervous_system",
  "body_composition_appetite",
  "preventive_risk",
];

export const LENS_TITLES: Record<LensId, string> = {
  performance_recovery: "Performance & Recovery",
  energy_metabolic: "Energy & Metabolic Load",
  hormonal_dynamics: "Hormonal Dynamics",
  stress_nervous_system: "Stress & Nervous System",
  body_composition_appetite: "Body Composition & Appetite Regulation",
  preventive_risk: "Preventive Risk & Medical Memory",
};

type WeightMap = Partial<Record<LensId, number>>;

/** Goals → Lens weights (normalized option labels for matching) */
export const GOAL_WEIGHTS: Record<string, WeightMap> = {
  "training performance": { performance_recovery: 3, stress_nervous_system: 1, energy_metabolic: 1 },
  "energy stability": { energy_metabolic: 3, stress_nervous_system: 2, hormonal_dynamics: 1 },
  "hormonal transition (peri/meno)": { hormonal_dynamics: 4, stress_nervous_system: 1, energy_metabolic: 1 },
  "hormonal transition": { hormonal_dynamics: 4, stress_nervous_system: 1, energy_metabolic: 1 },
  "family history / risk": { preventive_risk: 5 },
  "family history": { preventive_risk: 5 },
  "sleep quality": { stress_nervous_system: 3, hormonal_dynamics: 1, energy_metabolic: 1 },
  "stress resilience": { stress_nervous_system: 5 }, // Stress+4, Sleep+1 → stress
  "skin / hair changes": { hormonal_dynamics: 2, energy_metabolic: 2 },
  "skin / hair": { hormonal_dynamics: 2, energy_metabolic: 2 },
  "body composition": { energy_metabolic: 3, body_composition_appetite: 2, hormonal_dynamics: 1 },
};

/** Symptoms → Lens weights */
export const SYMPTOM_WEIGHTS: Record<string, WeightMap> = {
  "training feels off": { performance_recovery: 4, energy_metabolic: 2, stress_nervous_system: 1 },
  "exhausted despite sleep": { energy_metabolic: 3, stress_nervous_system: 3, hormonal_dynamics: 1 },
  "sleep disruption": { stress_nervous_system: 4, hormonal_dynamics: 2 },
  "cycle changes": { hormonal_dynamics: 5 },
  "mood / focus shifts": { stress_nervous_system: 3, hormonal_dynamics: 2, energy_metabolic: 1 },
  "mood or focus shifts": { stress_nervous_system: 3, hormonal_dynamics: 2, energy_metabolic: 1 },
  "bloating / inflammation": { energy_metabolic: 3, hormonal_dynamics: 1 },
  "hair shedding / skin flare": { hormonal_dynamics: 3, energy_metabolic: 2 },
  "hair / skin flare": { hormonal_dynamics: 3, energy_metabolic: 2 },
  "weight shifts / cravings": { body_composition_appetite: 4, energy_metabolic: 2, hormonal_dynamics: 1 },
};

/** Recent changes → Lens weights */
export const CHANGE_WEIGHTS: Record<string, WeightMap> = {
  "increased training load": { performance_recovery: 4, energy_metabolic: 2 },
  "reduced fueling / dieting": { energy_metabolic: 4, performance_recovery: 2, body_composition_appetite: 2 },
  "reduced fueling": { energy_metabolic: 4, performance_recovery: 2, body_composition_appetite: 2 },
  "dieting": { energy_metabolic: 4, performance_recovery: 2, body_composition_appetite: 2 },
  "higher work stress": { stress_nervous_system: 7 }, // Stress+5, Sleep+2 → stress
  "travel / jet lag": { stress_nervous_system: 6 }, // Sleep+4, Stress+2 → stress
  "illness / antibiotics": { performance_recovery: 2, energy_metabolic: 2, stress_nervous_system: 1 },
  "illness": { performance_recovery: 2, energy_metabolic: 2, stress_nervous_system: 1 },
  "alcohol ↑ / social load ↑": { stress_nervous_system: 3, energy_metabolic: 1 },
  "new contraception / stopped contraception": { hormonal_dynamics: 4 },
  "new contraception": { hormonal_dynamics: 4 },
  "stopped contraception": { hormonal_dynamics: 4 },
  "entering peri/meno symptoms": { hormonal_dynamics: 5, stress_nervous_system: 2 },
  "entering peri/meno": { hormonal_dynamics: 5, stress_nervous_system: 2 },
  "nothing significant": {}, // no weights; confidence lowered elsewhere
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function lookupWeights(record: Record<string, WeightMap>, options: string[]): WeightMap[] {
  return options.map((opt) => record[normalize(opt)] ?? record[normalize(opt).replace(/\s*\/\s*.*$/, "")] ?? {});
}

function mergeWeights(maps: WeightMap[]): Record<LensId, number> {
  const out = {} as Record<LensId, number>;
  for (const id of LENS_IDS) out[id] = 0;
  for (const m of maps) {
    for (const [id, w] of Object.entries(m)) {
      if (id in out) out[id as LensId] += w;
    }
  }
  return out;
}

export function computeLensScores(input: {
  goals: string[];
  symptoms: string[];
  changes: string[];
}): Record<LensId, number> {
  const fromGoals = mergeWeights(lookupWeights(GOAL_WEIGHTS, input.goals));
  const fromSymptoms = mergeWeights(lookupWeights(SYMPTOM_WEIGHTS, input.symptoms));
  const fromChanges = mergeWeights(lookupWeights(CHANGE_WEIGHTS, input.changes));
  const total: Record<LensId, number> = {} as Record<LensId, number>;
  for (const id of LENS_IDS) {
    total[id] = fromGoals[id] + fromSymptoms[id] + fromChanges[id];
  }
  return total;
}

export function selectLens(scores: Record<LensId, number>): LensId {
  let best: LensId = "performance_recovery";
  let bestScore = 0;
  for (const id of LENS_IDS) {
    if (scores[id] > bestScore) {
      bestScore = scores[id];
      best = id;
    }
  }
  return bestScore > 0 ? best : "performance_recovery";
}

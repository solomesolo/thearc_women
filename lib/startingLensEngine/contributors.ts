/**
 * Contributor selection rules: pattern → contributor id + confidence.
 * After lens selection, pick top 3 contributors using these pattern rules.
 */

import type { Confidence } from "./types";

export type ContributorId =
  | "load_recovery_mismatch"
  | "low_energy_availability"
  | "autonomic_strain"
  | "hormonal_modulation"
  | "circadian_disruption"
  | "post_illness_debt";

export interface ContributorPattern {
  id: ContributorId;
  confidence: Confidence;
  /** One sentence */
  whyThisFits: string;
  checkNext: string[];
}

/** Normalize for matching: lowercase, trim, collapse spaces */
function n(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function hasSymptom(symptoms: string[], ...keys: string[]): boolean {
  const set = new Set(symptoms.map(n));
  return keys.some((k) => set.has(n(k)) || set.has(k.replace(/\/.*$/, "").trim()));
}

function hasChange(changes: string[], ...keys: string[]): boolean {
  const set = new Set(changes.map(n));
  return keys.some((k) => set.has(n(k)) || set.has(k.replace(/\/.*$/, "").trim()));
}

function hasGoal(goals: string[], ...keys: string[]): boolean {
  const set = new Set(goals.map(n));
  return keys.some((k) => set.has(n(k)) || set.has(k.replace(/\/.*$/, "").trim()));
}

export function selectContributors(input: {
  goals: string[];
  symptoms: string[];
  changes: string[];
  lensId: string;
  cycleContext?: string;
  lifeStage?: string;
  wearable?: string;
  hasNothingSignificant: boolean;
}): ContributorPattern[] {
  const { goals, symptoms, changes, lensId, cycleContext, lifeStage, wearable, hasNothingSignificant } = input;
  const out: ContributorPattern[] = [];
  const added = new Set<ContributorId>();

  const confMod = hasNothingSignificant ? -1 : 0;
  const wearableBoost = wearable && wearable !== "none" ? 1 : 0;
  const hormonalUncertain = cycleContext === "irregular" || cycleContext === "unsure";

  function add(
    id: ContributorId,
    baseConf: Confidence,
    why: string,
    check: string[]
  ) {
    if (added.has(id)) return;
    let c: Confidence = baseConf;
    if (confMod < 0) c = c === "high" ? "medium" : c === "medium" ? "low" : "low";
    if (id === "hormonal_modulation" && hormonalUncertain) c = c === "high" ? "medium" : c;
    if (wearableBoost > 0 && (c === "medium" || c === "low")) c = c === "medium" ? "high" : "medium";
    added.add(id);
    out.push({ id, confidence: c, whyThisFits: why, checkNext: check });
  }

  // Load/Recovery mismatch (High)
  if (
    (hasSymptom(symptoms, "training feels off") && hasChange(changes, "increased training load")) ||
    (hasSymptom(symptoms, "training feels off") && hasSymptom(symptoms, "sleep disruption")) ||
    (hasSymptom(symptoms, "training feels off") && hasChange(changes, "illness / antibiotics", "illness"))
  ) {
    add(
      "load_recovery_mismatch",
      "high",
      "Training feels off + recent load increase often aligns with recovery debt rather than loss of fitness.",
      ["Perceived soreness duration", "Resting HR trend (if available)", "Motivation/irritability"]
    );
  }

  // Low energy availability / fueling mismatch (High)
  if (
    (hasChange(changes, "reduced fueling / dieting", "reduced fueling", "dieting") && hasSymptom(symptoms, "training feels off")) ||
    (hasChange(changes, "reduced fueling / dieting", "reduced fueling", "dieting") && hasSymptom(symptoms, "exhausted despite sleep")) ||
    (hasGoal(goals, "body composition") && (hasSymptom(symptoms, "weight shifts / cravings") || hasSymptom(symptoms, "weight shifts", "cravings")))
  ) {
    add(
      "low_energy_availability",
      "high",
      "In active women, performance and mood can shift quickly when energy availability drops—even if weight changes are small.",
      ["Morning energy", "Cravings", "Irritability", "Unusual cold sensitivity"]
    );
  }

  // Autonomic strain / stress load (High)
  if (
    (hasChange(changes, "higher work stress") && hasSymptom(symptoms, "sleep disruption")) ||
    (hasChange(changes, "higher work stress") && hasSymptom(symptoms, "mood / focus shifts", "mood or focus shifts")) ||
    (hasSymptom(symptoms, "exhausted despite sleep") && hasGoal(goals, "stress resilience"))
  ) {
    add(
      "autonomic_strain",
      "high",
      "Stress sensitivity fluctuates with nervous system state; recovery improves when load is matched to capacity.",
      ["Stress reactivity (how quickly you feel wired)", "Sleep onset quality"]
    );
  }

  // Hormonal modulation / transition context (High)
  if (
    hasSymptom(symptoms, "cycle changes") ||
    hasGoal(goals, "hormonal transition (peri/meno)", "hormonal transition") ||
    hasChange(changes, "new contraception / stopped contraception", "new contraception", "stopped contraception") ||
    (lifeStage === "45_plus" && hasSymptom(symptoms, "sleep disruption") && hasSymptom(symptoms, "mood / focus shifts", "mood or focus shifts"))
  ) {
    add(
      "hormonal_modulation",
      "high",
      "Female physiology is phase-dependent; patterns become predictable when you observe them with context.",
      ["Cycle-related pattern: sleep", "Mood", "Training response", "Cravings—note timing"]
    );
  }

  // Circadian disruption (High)
  if (
    (hasChange(changes, "travel / jet lag") && hasSymptom(symptoms, "sleep disruption")) ||
    (hasChange(changes, "travel / jet lag") && hasSymptom(symptoms, "exhausted despite sleep"))
  ) {
    add(
      "circadian_disruption",
      "high",
      "After travel, sleep can be long but non-restorative until circadian cues realign.",
      ["Sleep timing consistency", "Afternoon energy dip"]
    );
  }

  // Post-illness recovery debt (Medium–High)
  if (
    (hasChange(changes, "illness / antibiotics", "illness") && (hasSymptom(symptoms, "training feels off") || hasSymptom(symptoms, "exhausted despite sleep"))) ||
    (hasChange(changes, "illness / antibiotics", "illness") && hasSymptom(symptoms, "sleep disruption"))
  ) {
    add(
      "post_illness_debt",
      "medium",
      "After illness, the nervous system and inflammatory recovery may lag behind symptom resolution.",
      ["Heart rate creep during easy sessions", "Unusually high perceived effort"]
    );
  }

  // Default by lens if nothing matched
  if (out.length === 0) {
    const defaults: Record<string, { id: ContributorId; why: string; check: string[] }> = {
      performance_recovery: {
        id: "load_recovery_mismatch",
        why: "Your inputs suggest a temporary mismatch between training load and recovery capacity.",
        check: ["Perceived soreness duration", "Resting HR trend (if available)", "Motivation/irritability"],
      },
      energy_metabolic: {
        id: "low_energy_availability",
        why: "Energy and fueling consistency often drive how you feel in training and daily life.",
        check: ["Morning energy", "Cravings", "Sleep quality"],
      },
      hormonal_dynamics: {
        id: "hormonal_modulation",
        why: "Cycle and life stage context help explain variability in energy, sleep, and mood.",
        check: ["Cycle-related pattern: sleep", "Mood", "Training response"],
      },
      stress_nervous_system: {
        id: "autonomic_strain",
        why: "Stress load and recovery capacity interact; small adjustments often improve sleep and energy.",
        check: ["Stress reactivity", "Sleep onset quality"],
      },
      body_composition_appetite: {
        id: "low_energy_availability",
        why: "Body composition and appetite respond to training, fueling, and phase—consistency matters.",
        check: ["Cravings", "Energy levels", "Training quality"],
      },
      preventive_risk: {
        id: "hormonal_modulation",
        why: "Building a health memory and monitoring plan supports long-term prevention.",
        check: ["Key metrics you choose to track", "Questions for your doctor"],
      },
    };
    const d = defaults[lensId] ?? defaults.performance_recovery;
    add(d.id, hasNothingSignificant ? "low" : "medium", d.why, d.check);
  }

  return out.slice(0, 3);
}

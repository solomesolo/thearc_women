import type { BundleKey, ScoreEvent } from "@/lib/recommendations/types";

export type RuleContext = {
  age_group: string | null;
  life_stage: string | null;
  goal_flags: string[];
  risk_flags: string[];
  condition_flags: string[];
  medication_flags: string[];
  family_history_flags: string[];
  lifestyle_flags: string[];
};

type Rule = {
  rule_key: string;
  bundle: BundleKey;
  score_delta: number;
  reason_code: string;
  when: (ctx: RuleContext) => boolean;
};

function includesAny(hay: string[], needles: string[]) {
  return needles.some((n) => hay.includes(n));
}

function rule(r: Rule): Rule {
  return r;
}

// Implements the weighted rules described in the spec (Engine B v1).
export const RULES = [
  // Age/life-stage baseline (5.2)
  ...(["18_24", "25_29", "30_34", "35_39"] as const).flatMap((age) => [
    rule({ rule_key: `age_baseline_${age}_vitd`, bundle: "vitamin_d", score_delta: 12, reason_code: "age_baseline", when: (c: RuleContext) => c.age_group === age }),
    rule({ rule_key: `age_baseline_${age}_iron`, bundle: "iron_status", score_delta: 12, reason_code: "age_baseline", when: (c: RuleContext) => c.age_group === age }),
    rule({ rule_key: `age_baseline_${age}_thyroid`, bundle: "thyroid_basic", score_delta: 10, reason_code: "age_baseline", when: (c: RuleContext) => c.age_group === age }),
  ]),
  ...(["25_29", "30_34", "35_39"] as const).flatMap((age) => [
    rule({ rule_key: `age_cardiomet_${age}_lipid`, bundle: "lipid_panel", score_delta: 10, reason_code: "age_cardiometabolic", when: (c: RuleContext) => c.age_group === age }),
    rule({ rule_key: `age_cardiomet_${age}_glucose`, bundle: "glucose_metabolic", score_delta: 10, reason_code: "age_cardiometabolic", when: (c: RuleContext) => c.age_group === age }),
  ]),
  ...(["40_44", "45_49", "50_54", "55_plus"] as const).flatMap((age) => [
    rule({ rule_key: `age_cardiomet_${age}_lipid`, bundle: "lipid_panel", score_delta: age === "55_plus" ? 14 : 10, reason_code: "age_cardiometabolic", when: (c: RuleContext) => c.age_group === age }),
    rule({ rule_key: `age_cardiomet_${age}_glucose`, bundle: "glucose_metabolic", score_delta: age === "55_plus" ? 14 : 10, reason_code: "age_cardiometabolic", when: (c: RuleContext) => c.age_group === age }),
    rule({ rule_key: `age_inflam_${age}`, bundle: "inflammation_basic", score_delta: 8, reason_code: "age_inflammation", when: (c: RuleContext) => c.age_group === age }),
    rule({ rule_key: `age_vitd_${age}`, bundle: "vitamin_d", score_delta: 10, reason_code: "age_baseline", when: (c: RuleContext) => c.age_group === age }),
    ...(age === "55_plus"
      ? [rule({ rule_key: `age_kidney_${age}`, bundle: "kidney_function", score_delta: 10, reason_code: "age_baseline", when: (c: RuleContext) => c.age_group === age })]
      : []),
    rule({ rule_key: `age_thyroid_${age}`, bundle: "thyroid_basic", score_delta: 10, reason_code: "age_baseline", when: (c: RuleContext) => c.age_group === age }),
  ]),

  // Life stage (5.2)
  rule({ rule_key: "life_reproductive_iron", bundle: "iron_status", score_delta: 8, reason_code: "life_stage", when: (c) => c.life_stage === "reproductive" }),
  rule({ rule_key: "life_reproductive_hormones", bundle: "female_hormone_balance", score_delta: 4, reason_code: "life_stage", when: (c) => c.life_stage === "reproductive" }),

  rule({ rule_key: "life_ttc_fertility", bundle: "fertility_reserve", score_delta: 25, reason_code: "life_stage", when: (c) => c.life_stage === "trying_to_conceive" }),
  rule({ rule_key: "life_ttc_hormones", bundle: "female_hormone_balance", score_delta: 18, reason_code: "life_stage", when: (c) => c.life_stage === "trying_to_conceive" }),
  rule({ rule_key: "life_ttc_thyroid", bundle: "thyroid_basic", score_delta: 12, reason_code: "life_stage", when: (c) => c.life_stage === "trying_to_conceive" }),
  rule({ rule_key: "life_ttc_iodine", bundle: "iodine_status", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "trying_to_conceive" }),
  rule({ rule_key: "life_ttc_iron", bundle: "iron_status", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "trying_to_conceive" }),
  rule({ rule_key: "life_ttc_vitd", bundle: "vitamin_d", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "trying_to_conceive" }),

  rule({ rule_key: "life_postpartum_iron", bundle: "iron_status", score_delta: 15, reason_code: "life_stage", when: (c) => c.life_stage === "postpartum" }),
  rule({ rule_key: "life_postpartum_thyroid", bundle: "thyroid_basic", score_delta: 12, reason_code: "life_stage", when: (c) => c.life_stage === "postpartum" }),
  rule({ rule_key: "life_postpartum_vitd", bundle: "vitamin_d", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "postpartum" }),
  rule({ rule_key: "life_postpartum_b12", bundle: "b12_folate", score_delta: 8, reason_code: "life_stage", when: (c) => c.life_stage === "postpartum" }),

  { rule_key: "life_peri_hormones", bundle: "female_hormone_balance", score_delta: 18, reason_code: "life_stage", when: (c) => c.life_stage === "perimenopause" },
  { rule_key: "life_peri_thyroid", bundle: "thyroid_basic", score_delta: 12, reason_code: "life_stage", when: (c) => c.life_stage === "perimenopause" },
  { rule_key: "life_peri_lipid", bundle: "lipid_panel", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "perimenopause" },
  { rule_key: "life_peri_glucose", bundle: "glucose_metabolic", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "perimenopause" },
  { rule_key: "life_peri_vitd", bundle: "vitamin_d", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "perimenopause" },
  { rule_key: "life_peri_inflam", bundle: "inflammation_basic", score_delta: 8, reason_code: "life_stage", when: (c) => c.life_stage === "perimenopause" },

  { rule_key: "life_postmeno_lipid", bundle: "lipid_panel", score_delta: 14, reason_code: "life_stage", when: (c) => c.life_stage === "postmenopause" },
  { rule_key: "life_postmeno_glucose", bundle: "glucose_metabolic", score_delta: 14, reason_code: "life_stage", when: (c) => c.life_stage === "postmenopause" },
  { rule_key: "life_postmeno_thyroid", bundle: "thyroid_basic", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "postmenopause" },
  { rule_key: "life_postmeno_vitd", bundle: "vitamin_d", score_delta: 10, reason_code: "life_stage", when: (c) => c.life_stage === "postmenopause" },
  { rule_key: "life_postmeno_inflam", bundle: "inflammation_basic", score_delta: 8, reason_code: "life_stage", when: (c) => c.life_stage === "postmenopause" },

  // Goals (5.3)
  { rule_key: "goal_prevention", bundle: "comprehensive_preventive", score_delta: 20, reason_code: "goal_prevention", when: (c) => c.goal_flags.includes("goal_prevention") },
  { rule_key: "goal_prevention_vitd", bundle: "vitamin_d", score_delta: 8, reason_code: "goal_prevention", when: (c) => c.goal_flags.includes("goal_prevention") },
  { rule_key: "goal_prevention_thyroid", bundle: "thyroid_basic", score_delta: 6, reason_code: "goal_prevention", when: (c) => c.goal_flags.includes("goal_prevention") },
  { rule_key: "goal_prevention_lipid", bundle: "lipid_panel", score_delta: 8, reason_code: "goal_prevention", when: (c) => c.goal_flags.includes("goal_prevention") },
  { rule_key: "goal_prevention_glucose", bundle: "glucose_metabolic", score_delta: 8, reason_code: "goal_prevention", when: (c) => c.goal_flags.includes("goal_prevention") },

  { rule_key: "goal_energy_iron", bundle: "iron_status", score_delta: 18, reason_code: "goal_energy", when: (c) => c.goal_flags.includes("goal_energy") },
  { rule_key: "goal_energy_vitd", bundle: "vitamin_d", score_delta: 18, reason_code: "goal_energy", when: (c) => c.goal_flags.includes("goal_energy") },
  { rule_key: "goal_energy_b12", bundle: "b12_folate", score_delta: 14, reason_code: "goal_energy", when: (c) => c.goal_flags.includes("goal_energy") },
  { rule_key: "goal_energy_thyroid", bundle: "thyroid_basic", score_delta: 12, reason_code: "goal_energy", when: (c) => c.goal_flags.includes("goal_energy") },
  { rule_key: "goal_energy_mag", bundle: "magnesium_status", score_delta: 8, reason_code: "goal_energy", when: (c) => c.goal_flags.includes("goal_energy") },

  { rule_key: "goal_hormones_female", bundle: "female_hormone_balance", score_delta: 18, reason_code: "goal_hormones", when: (c) => c.goal_flags.includes("goal_hormones") },
  { rule_key: "goal_hormones_thyroid", bundle: "thyroid_basic", score_delta: 8, reason_code: "goal_hormones", when: (c) => c.goal_flags.includes("goal_hormones") },
  { rule_key: "goal_hormones_androgen", bundle: "androgen_balance", score_delta: 10, reason_code: "goal_hormones", when: (c) => c.goal_flags.includes("goal_hormones") },

  { rule_key: "goal_fertility_fertility", bundle: "fertility_reserve", score_delta: 22, reason_code: "goal_fertility", when: (c) => c.goal_flags.includes("goal_fertility") },
  { rule_key: "goal_fertility_female", bundle: "female_hormone_balance", score_delta: 16, reason_code: "goal_fertility", when: (c) => c.goal_flags.includes("goal_fertility") },
  { rule_key: "goal_fertility_thyroid", bundle: "thyroid_basic", score_delta: 10, reason_code: "goal_fertility", when: (c) => c.goal_flags.includes("goal_fertility") },
  { rule_key: "goal_fertility_iodine", bundle: "iodine_status", score_delta: 8, reason_code: "goal_fertility", when: (c) => c.goal_flags.includes("goal_fertility") },

  { rule_key: "goal_metabolic_glucose", bundle: "glucose_metabolic", score_delta: 18, reason_code: "goal_metabolic", when: (c) => c.goal_flags.includes("goal_metabolic") },
  { rule_key: "goal_metabolic_lipid", bundle: "lipid_panel", score_delta: 14, reason_code: "goal_metabolic", when: (c) => c.goal_flags.includes("goal_metabolic") },
  { rule_key: "goal_metabolic_liver", bundle: "liver_function", score_delta: 10, reason_code: "goal_metabolic", when: (c) => c.goal_flags.includes("goal_metabolic") },

  { rule_key: "goal_stress_cortisol", bundle: "stress_cortisol", score_delta: 16, reason_code: "goal_stress_sleep", when: (c) => c.goal_flags.includes("goal_stress_sleep") },
  { rule_key: "goal_stress_mag", bundle: "magnesium_status", score_delta: 10, reason_code: "goal_stress_sleep", when: (c) => c.goal_flags.includes("goal_stress_sleep") },
  { rule_key: "goal_stress_vitd", bundle: "vitamin_d", score_delta: 6, reason_code: "goal_stress_sleep", when: (c) => c.goal_flags.includes("goal_stress_sleep") },

  { rule_key: "goal_gut_gut", bundle: "gut_health_basic", score_delta: 18, reason_code: "goal_gut", when: (c) => c.goal_flags.includes("goal_gut") },
  { rule_key: "goal_gut_iron", bundle: "iron_status", score_delta: 8, reason_code: "goal_gut", when: (c) => c.goal_flags.includes("goal_gut") },
  { rule_key: "goal_gut_b12", bundle: "b12_folate", score_delta: 8, reason_code: "goal_gut", when: (c) => c.goal_flags.includes("goal_gut") },

  { rule_key: "goal_cardio_lipid", bundle: "lipid_panel", score_delta: 18, reason_code: "goal_cardiovascular", when: (c) => c.goal_flags.includes("goal_cardiovascular") },
  { rule_key: "goal_cardio_glucose", bundle: "glucose_metabolic", score_delta: 10, reason_code: "goal_cardiovascular", when: (c) => c.goal_flags.includes("goal_cardiovascular") },
  { rule_key: "goal_cardio_inflam", bundle: "inflammation_basic", score_delta: 10, reason_code: "goal_cardiovascular", when: (c) => c.goal_flags.includes("goal_cardiovascular") },
  { rule_key: "goal_cardio_omega3", bundle: "omega3_status", score_delta: 8, reason_code: "goal_cardiovascular", when: (c) => c.goal_flags.includes("goal_cardiovascular") },

  { rule_key: "goal_thyroid_basic", bundle: "thyroid_basic", score_delta: 18, reason_code: "goal_thyroid", when: (c) => c.goal_flags.includes("goal_thyroid") },
  { rule_key: "goal_thyroid_extended", bundle: "thyroid_extended", score_delta: 12, reason_code: "goal_thyroid", when: (c) => c.goal_flags.includes("goal_thyroid") },
  { rule_key: "goal_thyroid_iodine", bundle: "iodine_status", score_delta: 8, reason_code: "goal_thyroid", when: (c) => c.goal_flags.includes("goal_thyroid") },

  // Risks (5.4) — use flags from Engine A snapshot directly.
  { rule_key: "risk_fatigue_iron", bundle: "iron_status", score_delta: 22, reason_code: "fatigue", when: (c) => c.risk_flags.includes("fatigue") },
  { rule_key: "risk_fatigue_vitd", bundle: "vitamin_d", score_delta: 20, reason_code: "fatigue", when: (c) => c.risk_flags.includes("fatigue") },
  { rule_key: "risk_fatigue_b12", bundle: "b12_folate", score_delta: 16, reason_code: "fatigue", when: (c) => c.risk_flags.includes("fatigue") },
  { rule_key: "risk_fatigue_thyroid", bundle: "thyroid_basic", score_delta: 18, reason_code: "fatigue", when: (c) => c.risk_flags.includes("fatigue") },
  { rule_key: "risk_fatigue_mag", bundle: "magnesium_status", score_delta: 8, reason_code: "fatigue", when: (c) => c.risk_flags.includes("fatigue") },

  { rule_key: "risk_heavy_periods_iron", bundle: "iron_status", score_delta: 24, reason_code: "heavy_periods", when: (c) => c.risk_flags.includes("heavy_periods") },
  { rule_key: "risk_heavy_periods_b12", bundle: "b12_folate", score_delta: 10, reason_code: "heavy_periods", when: (c) => c.risk_flags.includes("heavy_periods") },

  { rule_key: "risk_low_sun_vitd", bundle: "vitamin_d", score_delta: 16, reason_code: "low_sun_exposure", when: (c) => c.risk_flags.includes("low_sun_exposure") || c.lifestyle_flags.includes("low_sun_exposure") },
  { rule_key: "risk_very_low_sun_vitd", bundle: "vitamin_d", score_delta: 22, reason_code: "very_low_sun_exposure", when: (c) => c.risk_flags.includes("very_low_sun_exposure") || c.lifestyle_flags.includes("very_low_sun_exposure") },

  { rule_key: "risk_high_stress_cortisol", bundle: "stress_cortisol", score_delta: 18, reason_code: "high_stress", when: (c) => c.risk_flags.includes("high_stress") || c.lifestyle_flags.includes("high_stress") },
  { rule_key: "risk_high_stress_mag", bundle: "magnesium_status", score_delta: 10, reason_code: "high_stress", when: (c) => c.risk_flags.includes("high_stress") || c.lifestyle_flags.includes("high_stress") },
  { rule_key: "risk_high_stress_vitd", bundle: "vitamin_d", score_delta: 6, reason_code: "high_stress", when: (c) => c.risk_flags.includes("high_stress") || c.lifestyle_flags.includes("high_stress") },

  // Lifestyle-derived risks
  { rule_key: "life_vegan_b12", bundle: "b12_folate", score_delta: 16, reason_code: "vegan", when: (c) => c.lifestyle_flags.includes("vegan") },
  { rule_key: "life_vegan_iron", bundle: "iron_status", score_delta: 12, reason_code: "vegan", when: (c) => c.lifestyle_flags.includes("vegan") },
  { rule_key: "life_vegan_omega3", bundle: "omega3_status", score_delta: 8, reason_code: "vegan", when: (c) => c.lifestyle_flags.includes("vegan") },
  { rule_key: "life_vegan_iodine", bundle: "iodine_status", score_delta: 8, reason_code: "vegan", when: (c) => c.lifestyle_flags.includes("vegan") },

  { rule_key: "life_vegetarian_b12", bundle: "b12_folate", score_delta: 12, reason_code: "vegetarian", when: (c) => c.lifestyle_flags.includes("vegetarian") },
  { rule_key: "life_vegetarian_iron", bundle: "iron_status", score_delta: 10, reason_code: "vegetarian", when: (c) => c.lifestyle_flags.includes("vegetarian") },

  { rule_key: "life_low_fish_omega3", bundle: "omega3_status", score_delta: 12, reason_code: "low_fish", when: (c) => c.lifestyle_flags.includes("low_fish") },
  { rule_key: "life_low_fish_iodine", bundle: "iodine_status", score_delta: 6, reason_code: "low_fish", when: (c) => c.lifestyle_flags.includes("low_fish") },

  // Conditions (5.5)
  { rule_key: "cond_thyroid_disorder_extended", bundle: "thyroid_extended", score_delta: 28, reason_code: "thyroid_disorder", when: (c) => c.condition_flags.includes("thyroid_disorder") },
  { rule_key: "cond_thyroid_disorder_basic", bundle: "thyroid_basic", score_delta: 10, reason_code: "thyroid_disorder", when: (c) => c.condition_flags.includes("thyroid_disorder") },
  { rule_key: "cond_iron_def_history", bundle: "iron_status", score_delta: 30, reason_code: "iron_deficiency_history", when: (c) => c.condition_flags.includes("iron_deficiency_history") },
  { rule_key: "cond_vitd_def_history", bundle: "vitamin_d", score_delta: 30, reason_code: "vitamin_d_deficiency_history", when: (c) => c.condition_flags.includes("vitamin_d_deficiency_history") },
  { rule_key: "cond_high_chol_lipid", bundle: "lipid_panel", score_delta: 24, reason_code: "high_cholesterol_history", when: (c) => c.condition_flags.includes("high_cholesterol_history") },
  { rule_key: "cond_high_chol_glucose", bundle: "glucose_metabolic", score_delta: 8, reason_code: "high_cholesterol_history", when: (c) => c.condition_flags.includes("high_cholesterol_history") },
  { rule_key: "cond_high_chol_inflam", bundle: "inflammation_basic", score_delta: 6, reason_code: "high_cholesterol_history", when: (c) => c.condition_flags.includes("high_cholesterol_history") },
  { rule_key: "cond_prediabetes_glucose", bundle: "glucose_metabolic", score_delta: 28, reason_code: "prediabetes_or_ir", when: (c) => c.condition_flags.includes("prediabetes_or_ir") },
  { rule_key: "cond_prediabetes_lipid", bundle: "lipid_panel", score_delta: 10, reason_code: "prediabetes_or_ir", when: (c) => c.condition_flags.includes("prediabetes_or_ir") },
  { rule_key: "cond_prediabetes_liver", bundle: "liver_function", score_delta: 12, reason_code: "prediabetes_or_ir", when: (c) => c.condition_flags.includes("prediabetes_or_ir") },
  { rule_key: "cond_diabetes_glucose", bundle: "glucose_metabolic", score_delta: 28, reason_code: "diabetes", when: (c) => c.condition_flags.includes("diabetes") },
  { rule_key: "cond_diabetes_kidney", bundle: "kidney_function", score_delta: 18, reason_code: "diabetes", when: (c) => c.condition_flags.includes("diabetes") },
  { rule_key: "cond_diabetes_lipid", bundle: "lipid_panel", score_delta: 10, reason_code: "diabetes", when: (c) => c.condition_flags.includes("diabetes") },
  { rule_key: "cond_endometriosis_iron", bundle: "iron_status", score_delta: 16, reason_code: "endometriosis", when: (c) => c.condition_flags.includes("endometriosis") },
  { rule_key: "cond_endometriosis_inflam", bundle: "inflammation_basic", score_delta: 10, reason_code: "endometriosis", when: (c) => c.condition_flags.includes("endometriosis") },
  { rule_key: "cond_gut_condition_gut", bundle: "gut_health_basic", score_delta: 22, reason_code: "gut_condition", when: (c) => c.condition_flags.includes("gut_condition") },
  { rule_key: "cond_gut_condition_iron", bundle: "iron_status", score_delta: 8, reason_code: "gut_condition", when: (c) => c.condition_flags.includes("gut_condition") },
  { rule_key: "cond_gut_condition_b12", bundle: "b12_folate", score_delta: 8, reason_code: "gut_condition", when: (c) => c.condition_flags.includes("gut_condition") },

  // Family history (5.6)
  { rule_key: "fh_thyroid_basic", bundle: "thyroid_basic", score_delta: 10, reason_code: "fh_thyroid", when: (c) => c.family_history_flags.includes("fh_thyroid") },
  { rule_key: "fh_thyroid_extended", bundle: "thyroid_extended", score_delta: 4, reason_code: "fh_thyroid", when: (c) => c.family_history_flags.includes("fh_thyroid") },
  { rule_key: "fh_diabetes_glucose", bundle: "glucose_metabolic", score_delta: 12, reason_code: "fh_diabetes", when: (c) => c.family_history_flags.includes("fh_diabetes") },
  { rule_key: "fh_cardio_lipid", bundle: "lipid_panel", score_delta: 14, reason_code: "fh_cardiometabolic", when: (c) => c.family_history_flags.includes("fh_cardiometabolic") },
  { rule_key: "fh_cardio_glucose", bundle: "glucose_metabolic", score_delta: 8, reason_code: "fh_cardiometabolic", when: (c) => c.family_history_flags.includes("fh_cardiometabolic") },
  { rule_key: "fh_cardio_inflam", bundle: "inflammation_basic", score_delta: 8, reason_code: "fh_cardiometabolic", when: (c) => c.family_history_flags.includes("fh_cardiometabolic") },
  { rule_key: "fh_autoimmune_basic", bundle: "thyroid_basic", score_delta: 6, reason_code: "fh_autoimmune", when: (c) => c.family_history_flags.includes("fh_autoimmune") },
  { rule_key: "fh_autoimmune_extended", bundle: "thyroid_extended", score_delta: 6, reason_code: "fh_autoimmune", when: (c) => c.family_history_flags.includes("fh_autoimmune") },

  // Medications (5.7)
  { rule_key: "med_thyroid_extended", bundle: "thyroid_extended", score_delta: 20, reason_code: "on_thyroid_medication", when: (c) => c.medication_flags.includes("on_thyroid_medication") },
  { rule_key: "med_iron", bundle: "iron_status", score_delta: 12, reason_code: "on_iron_supplement", when: (c) => c.medication_flags.includes("on_iron_supplement") },
  { rule_key: "med_vitd", bundle: "vitamin_d", score_delta: 12, reason_code: "on_vitamin_d_supplement", when: (c) => c.medication_flags.includes("on_vitamin_d_supplement") },
  { rule_key: "med_fertility", bundle: "fertility_reserve", score_delta: 12, reason_code: "on_fertility_medication", when: (c) => c.medication_flags.includes("on_fertility_medication") },
  { rule_key: "med_fertility_hormones", bundle: "female_hormone_balance", score_delta: 10, reason_code: "on_fertility_medication", when: (c) => c.medication_flags.includes("on_fertility_medication") },
  { rule_key: "med_glp1_glucose", bundle: "glucose_metabolic", score_delta: 10, reason_code: "on_glp1", when: (c) => c.medication_flags.includes("on_glp1") },
  { rule_key: "med_glp1_liver", bundle: "liver_function", score_delta: 8, reason_code: "on_glp1", when: (c) => c.medication_flags.includes("on_glp1") },
  { rule_key: "med_glp1_kidney", bundle: "kidney_function", score_delta: 6, reason_code: "on_glp1", when: (c) => c.medication_flags.includes("on_glp1") },
] as const satisfies Rule[];

export function evaluateRules(ctx: RuleContext): ScoreEvent[] {
  const events: ScoreEvent[] = [];
  for (const r of RULES) {
    if (!r.when(ctx)) continue;
    events.push({
      rule_key: r.rule_key,
      bundle_key: r.bundle,
      score_delta: r.score_delta,
      reason_code: r.reason_code,
    });
  }
  return events;
}

export function ruleContextFromSnapshot(snapshot: any): RuleContext {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
  return {
    age_group: snapshot?.ageGroup ?? null,
    life_stage: snapshot?.lifeStage ?? null,
    goal_flags: arr(snapshot?.goalFlags),
    risk_flags: arr(snapshot?.riskFlags),
    condition_flags: arr(snapshot?.conditionFlags),
    medication_flags: arr(snapshot?.medicationFlags),
    family_history_flags: arr(snapshot?.familyHistoryFlags),
    lifestyle_flags: arr(snapshot?.lifestyleFlags),
  };
}


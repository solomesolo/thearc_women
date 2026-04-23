import type { BundleKey } from "@/lib/status-engine/statusTypes";

export const BASE_INTERVAL_MONTHS: Record<BundleKey, number> = {
  vitamin_d: 12,
  iron_status: 12,
  b12_folate: 12,
  thyroid_basic: 12,
  thyroid_extended: 6,
  lipid_panel: 12,
  glucose_metabolic: 12,
  stress_cortisol: 6,
  female_hormone_balance: 12,
  fertility_reserve: 12,
  androgen_balance: 12,
  liver_function: 12,
  kidney_function: 12,
  inflammation_basic: 12,
  omega3_status: 12,
  magnesium_status: 12,
  iodine_status: 12,
  sti_panel: 12,
  gut_health_basic: 12,
  comprehensive_preventive: 12,
};

export type ProfileSignals = {
  age_group: string | null;
  life_stage: string | null;
  goal_flags: string[];
  risk_flags: string[];
  condition_flags: string[];
  medication_flags: string[];
  family_history_flags: string[];
  lifestyle_flags: string[];
};

function hasAny(arr: string[], keys: string[]) {
  return keys.some((k) => arr.includes(k));
}

function clampMin(v: number, min: number) {
  return v < min ? min : v;
}

export function effectiveIntervalMonths(bundle: BundleKey, profile: ProfileSignals): number {
  let interval = BASE_INTERVAL_MONTHS[bundle];

  const rf = profile.risk_flags;
  const cf = profile.condition_flags;
  const mf = profile.medication_flags;
  const fh = profile.family_history_flags;
  const lf = profile.lifestyle_flags;
  const lifeStage = profile.life_stage;
  const ageGroup = profile.age_group;

  // Matrix overrides (shorten intervals when relevant). Use min() semantics.
  const shorten = (months: number) => {
    interval = Math.min(interval, months);
  };

  // A fatigue
  if (rf.includes("fatigue") && ["vitamin_d", "iron_status", "b12_folate", "thyroid_basic"].includes(bundle)) shorten(6);
  // B hair_loss
  if (rf.includes("hair_loss") && ["iron_status", "thyroid_basic", "androgen_balance", "b12_folate"].includes(bundle)) shorten(6);
  // C low_mood/brain_fog
  if (hasAny(rf, ["low_mood", "brain_fog"]) && ["vitamin_d", "b12_folate", "thyroid_basic"].includes(bundle)) shorten(6);
  // D poor_sleep/high_stress/circadian_disruption
  if (hasAny(rf.concat(lf), ["poor_sleep", "high_stress", "circadian_disruption"])) {
    if (bundle === "stress_cortisol") shorten(3);
    if (bundle === "magnesium_status") shorten(6);
    if (bundle === "vitamin_d") shorten(6);
  }
  // E weight_gain or goal_metabolic
  if (rf.includes("weight_gain") || profile.goal_flags.includes("goal_metabolic")) {
    if (["glucose_metabolic", "thyroid_basic", "lipid_panel", "liver_function"].includes(bundle)) shorten(6);
  }
  // F irregular_cycle
  if (rf.includes("irregular_cycle") && ["female_hormone_balance", "thyroid_basic", "androgen_balance"].includes(bundle)) shorten(6);
  // G heavy_periods
  if (rf.includes("heavy_periods")) {
    if (bundle === "iron_status") shorten(3);
    if (bundle === "b12_folate") shorten(6);
  }
  // H painful_periods
  if (rf.includes("painful_periods") && ["iron_status", "inflammation_basic", "female_hormone_balance"].includes(bundle)) shorten(6);
  // I possible_androgen_excess
  if (rf.includes("possible_androgen_excess") && ["androgen_balance", "female_hormone_balance", "glucose_metabolic"].includes(bundle)) shorten(6);
  // J digestive_symptoms
  if (rf.includes("digestive_symptoms") && ["gut_health_basic", "b12_folate", "iron_status"].includes(bundle)) shorten(6);
  // K frequent_infections
  if (rf.includes("frequent_infections") && ["vitamin_d", "inflammation_basic"].includes(bundle)) shorten(6);
  // L low sun
  if (hasAny(rf.concat(lf), ["low_sun_exposure"])) if (bundle === "vitamin_d") shorten(6);
  if (hasAny(rf.concat(lf), ["very_low_sun_exposure"])) if (bundle === "vitamin_d") shorten(3);
  // M diet
  if (hasAny(lf, ["vegetarian", "vegan", "low_red_meat"])) {
    if (bundle === "iron_status") shorten(6);
    if (bundle === "b12_folate") shorten(6);
  }
  if (lf.includes("restrictive_diet")) {
    if (bundle === "iron_status") shorten(6);
    if (bundle === "b12_folate") shorten(6);
    if (bundle === "magnesium_status") shorten(6);
    if (bundle === "vitamin_d") shorten(6);
  }
  // N low fish
  if (lf.includes("low_fish")) {
    if (bundle === "omega3_status") shorten(6);
    if (bundle === "iodine_status") shorten(6);
  }
  // O high training
  if (lf.includes("high_training_load")) {
    if (bundle === "iron_status") shorten(6);
    if (bundle === "magnesium_status") shorten(6);
    if (bundle === "vitamin_d") shorten(6);
  }
  // P trying_to_conceive
  if (lifeStage === "trying_to_conceive") {
    if (["fertility_reserve", "female_hormone_balance", "thyroid_basic", "iodine_status", "iron_status", "vitamin_d"].includes(bundle)) shorten(6);
  }
  // Q pregnant
  if (lifeStage === "pregnant") {
    if (bundle === "iron_status") shorten(3);
    if (bundle === "vitamin_d") shorten(6);
    if (bundle === "thyroid_basic") shorten(3);
    if (bundle === "glucose_metabolic") shorten(3);
    if (bundle === "iodine_status") shorten(6);
  }
  // R postpartum
  if (lifeStage === "postpartum") {
    if (bundle === "iron_status") shorten(3);
    if (bundle === "thyroid_basic") shorten(6);
    if (bundle === "vitamin_d") shorten(6);
    if (bundle === "glucose_metabolic") shorten(6);
  }
  // S perimenopause
  if (lifeStage === "perimenopause") {
    if (["female_hormone_balance", "thyroid_basic", "lipid_panel", "glucose_metabolic", "inflammation_basic"].includes(bundle)) shorten(6);
  }
  // T postmenopause
  if (lifeStage === "postmenopause") {
    if (["lipid_panel", "glucose_metabolic", "vitamin_d", "thyroid_basic", "inflammation_basic"].includes(bundle)) shorten(6);
  }
  // U PCOS
  if (cf.includes("pcos")) {
    if (["androgen_balance", "female_hormone_balance", "glucose_metabolic", "lipid_panel"].includes(bundle)) shorten(6);
  }
  // V endometriosis
  if (cf.includes("endometriosis")) {
    if (bundle === "iron_status") shorten(3);
    if (bundle === "inflammation_basic") shorten(6);
  }
  // W thyroid_disorder
  if (cf.includes("thyroid_disorder")) {
    if (bundle === "thyroid_extended") shorten(3);
    if (bundle === "thyroid_basic") shorten(3);
  }
  // X iron deficiency history
  if (cf.includes("iron_deficiency_history") && bundle === "iron_status") shorten(3);
  // Y vit d deficiency history
  if (cf.includes("vitamin_d_deficiency_history") && bundle === "vitamin_d") shorten(3);
  // Z prediabetes / diabetes
  if (cf.includes("prediabetes_or_ir")) {
    if (bundle === "glucose_metabolic") shorten(3);
    if (bundle === "lipid_panel") shorten(6);
    if (bundle === "liver_function") shorten(6);
  }
  if (cf.includes("diabetes")) {
    if (bundle === "glucose_metabolic") shorten(3);
    if (bundle === "kidney_function") shorten(6);
    if (bundle === "lipid_panel") shorten(6);
  }
  // AA gut condition
  if (cf.includes("gut_condition")) {
    if (bundle === "gut_health_basic") shorten(6);
    if (bundle === "b12_folate") shorten(6);
    if (bundle === "iron_status") shorten(6);
  }
  // AB family history thyroid
  if (fh.includes("fh_thyroid") && bundle === "thyroid_basic") shorten(6);
  // AC family history diabetes
  if (fh.includes("fh_diabetes") && bundle === "glucose_metabolic") shorten(6);
  // AD cardiometabolic
  if (fh.includes("fh_cardiometabolic")) {
    if (["lipid_panel", "glucose_metabolic", "inflammation_basic"].includes(bundle)) shorten(6);
  }
  // AE early menopause
  if (fh.includes("fh_early_menopause") && ["30_34", "35_39", "40_44"].includes(ageGroup ?? "")) {
    if (bundle === "fertility_reserve") shorten(6);
  }
  // AF medications
  if (mf.includes("on_thyroid_medication")) {
    if (bundle === "thyroid_extended") shorten(3);
    if (bundle === "thyroid_basic") shorten(3);
  }
  if (mf.includes("on_iron_supplement") && bundle === "iron_status") shorten(3);
  if (mf.includes("on_vitamin_d_supplement") && bundle === "vitamin_d") shorten(3);
  if (mf.includes("on_fertility_medication")) {
    if (bundle === "female_hormone_balance") shorten(3);
    if (bundle === "fertility_reserve") shorten(3);
  }
  if (mf.includes("on_glp1")) {
    if (bundle === "glucose_metabolic") shorten(3);
    if (bundle === "liver_function") shorten(6);
    if (bundle === "kidney_function") shorten(6);
  }

  // Never allow < 3 months interval in MVP for simplicity (still deterministic)
  interval = clampMin(interval, 3);
  return interval;
}


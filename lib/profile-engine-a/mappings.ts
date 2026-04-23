import type { BundleKey, DomainKey } from "@/lib/profile-engine-a/types";

export const AGE_GROUP_LABELS: Record<string, string> = {
  under_18: "Under 18",
  "18_24": "18–24",
  "25_29": "25–29",
  "30_34": "30–34",
  "35_39": "35–39",
  "40_44": "40–44",
  "45_49": "45–49",
  "50_54": "50–54",
  "55_plus": "55+",
};

export const LIFE_STAGE_LABELS: Record<string, string> = {
  reproductive: "Regular menstrual cycle",
  trying_to_conceive: "Trying to conceive",
  pregnant: "Pregnant",
  postpartum: "Postpartum",
  perimenopause: "Perimenopause",
  postmenopause: "Postmenopause",
  prefer_not_to_say: "Prefer not to say",
};

export const GOAL_FLAG_BY_OPTION: Record<string, string> = {
  general_preventive_health: "goal_prevention",
  more_energy_and_vitality: "goal_energy",
  hormones_and_cycle_balance: "goal_hormones",
  fertility_and_reproductive_planning: "goal_fertility",
  weight_and_metabolism: "goal_metabolic",
  mood_stress_sleep: "goal_stress_sleep",
  gut_health_and_digestion: "goal_gut",
  cardiovascular_long_term_health: "goal_cardiovascular",
  thyroid_health: "goal_thyroid",
  just_exploring: "goal_exploration",
};

export const GOAL_LABEL_BY_FLAG: Record<string, string> = {
  goal_prevention: "General preventive health",
  goal_energy: "More energy and vitality",
  goal_hormones: "Hormones and cycle balance",
  goal_fertility: "Fertility and reproductive planning",
  goal_metabolic: "Weight and metabolism",
  goal_stress_sleep: "Mood, stress, and sleep",
  goal_gut: "Gut health and digestion",
  goal_cardiovascular: "Cardiovascular long-term health",
  goal_thyroid: "Thyroid health",
  goal_exploration: "Just exploring",
};

export type WeightMap<K extends string> = Partial<Record<K, number>>;

export type RuleOutputs = {
  addRiskFlags?: string[];
  addLifestyleFlags?: string[];
  addConditionFlags?: string[];
  addMedicationFlags?: string[];
  addFamilyHistoryFlags?: string[];
  addDomainWeights?: WeightMap<DomainKey>;
  addBundleWeights?: WeightMap<BundleKey>;
};

export const AGE_GROUP_RULES: Record<string, RuleOutputs> = {
  "18_24": { addDomainWeights: { nutrient_status: 1, female_hormones: 1, metabolic_health: 1 } },
  "25_29": { addDomainWeights: { nutrient_status: 1, female_hormones: 1, thyroid_health: 1 } },
  "30_34": { addDomainWeights: { nutrient_status: 1, thyroid_health: 1, female_hormones: 1, metabolic_health: 1 } },
  "35_39": {
    addDomainWeights: { nutrient_status: 1, thyroid_health: 1, fertility: 1, metabolic_health: 1, cardiovascular_health: 1 },
  },
  "40_44": { addDomainWeights: { metabolic_health: 1, cardiovascular_health: 1, female_hormones: 1, thyroid_health: 1 } },
  "45_49": { addDomainWeights: { cardiovascular_health: 2, metabolic_health: 2, female_hormones: 2, thyroid_health: 1 } },
  "50_54": { addDomainWeights: { cardiovascular_health: 2, metabolic_health: 2, inflammation: 1, nutrient_status: 1 } },
  "55_plus": { addDomainWeights: { cardiovascular_health: 2, metabolic_health: 2, inflammation: 1, organ_function: 1, nutrient_status: 1 } },
};

export const LIFE_STAGE_RULES: Record<string, RuleOutputs> = {
  reproductive: { addDomainWeights: { female_hormones: 1, nutrient_status: 1 } },
  trying_to_conceive: {
    addRiskFlags: ["fertility_focus"],
    addDomainWeights: { fertility: 3, female_hormones: 2, thyroid_health: 1, nutrient_status: 1 },
    addBundleWeights: { fertility_reserve: 3, female_hormone_balance: 2, thyroid_basic: 1, iodine_status: 1, iron_status: 1, vitamin_d: 1 },
  },
  pregnant: { addRiskFlags: ["pregnancy"], addDomainWeights: { nutrient_status: 2, thyroid_health: 1, metabolic_health: 1 } },
  postpartum: { addRiskFlags: ["postpartum"], addDomainWeights: { nutrient_status: 2, thyroid_health: 1, stress_sleep: 1 } },
  perimenopause: {
    addRiskFlags: ["menopause_transition"],
    addDomainWeights: { female_hormones: 3, metabolic_health: 1, cardiovascular_health: 1, thyroid_health: 1 },
  },
  postmenopause: {
    addRiskFlags: ["postmenopause"],
    addDomainWeights: { cardiovascular_health: 2, metabolic_health: 2, nutrient_status: 1, inflammation: 1 },
  },
};

export const GOAL_RULES_BY_FLAG: Record<string, RuleOutputs> = {
  goal_prevention: { addBundleWeights: { comprehensive_preventive: 2, lipid_panel: 1, glucose_metabolic: 1, thyroid_basic: 1, vitamin_d: 1 } },
  goal_energy: { addBundleWeights: { iron_status: 2, vitamin_d: 2, b12_folate: 2, thyroid_basic: 1, magnesium_status: 1 } },
  goal_hormones: { addBundleWeights: { female_hormone_balance: 2, thyroid_basic: 1, androgen_balance: 1 } },
  goal_fertility: { addBundleWeights: { fertility_reserve: 3, female_hormone_balance: 2, thyroid_basic: 1, iodine_status: 1 } },
  goal_metabolic: { addBundleWeights: { glucose_metabolic: 2, lipid_panel: 2, liver_function: 1, thyroid_basic: 1 } },
  goal_stress_sleep: { addBundleWeights: { stress_cortisol: 2, magnesium_status: 1, vitamin_d: 1 } },
  goal_gut: { addBundleWeights: { gut_health_basic: 2, b12_folate: 1, iron_status: 1 } },
  goal_cardiovascular: { addBundleWeights: { lipid_panel: 2, glucose_metabolic: 1, inflammation_basic: 1, omega3_status: 1 } },
  goal_thyroid: { addBundleWeights: { thyroid_basic: 3, thyroid_extended: 1, iodine_status: 1 } },
};

export const SYMPTOM_RULES: Record<string, RuleOutputs> = {
  fatigue: {
    addRiskFlags: ["fatigue"],
    addDomainWeights: { nutrient_status: 2, thyroid_health: 1, stress_sleep: 1 },
    addBundleWeights: { iron_status: 3, vitamin_d: 3, b12_folate: 2, thyroid_basic: 2, magnesium_status: 1 },
  },
  hair_loss: {
    addRiskFlags: ["hair_loss"],
    addDomainWeights: { nutrient_status: 1, thyroid_health: 1, androgen_balance: 1 },
    addBundleWeights: { iron_status: 2, thyroid_basic: 2, b12_folate: 1, androgen_balance: 1 },
  },
  low_mood: { addRiskFlags: ["low_mood"], addBundleWeights: { vitamin_d: 2, b12_folate: 1, omega3_status: 1, thyroid_basic: 1 } },
  poor_sleep: { addRiskFlags: ["poor_sleep"], addBundleWeights: { stress_cortisol: 2, magnesium_status: 1, vitamin_d: 1 } },
  high_stress: { addRiskFlags: ["high_stress"], addBundleWeights: { stress_cortisol: 3, magnesium_status: 1, vitamin_d: 1 } },
  weight_gain: { addRiskFlags: ["weight_gain"], addBundleWeights: { glucose_metabolic: 2, thyroid_basic: 2, lipid_panel: 1, liver_function: 1 } },
  irregular_cycle: { addRiskFlags: ["irregular_cycle"], addBundleWeights: { female_hormone_balance: 3, thyroid_basic: 1, androgen_balance: 2 } },
  painful_periods: { addRiskFlags: ["painful_periods"], addBundleWeights: { female_hormone_balance: 1, iron_status: 1, inflammation_basic: 1 } },
  heavy_periods: { addRiskFlags: ["heavy_periods"], addBundleWeights: { iron_status: 4, b12_folate: 1 } },
  acne_or_excess_facial_hair: {
    addRiskFlags: ["possible_androgen_excess"],
    addBundleWeights: { androgen_balance: 3, female_hormone_balance: 2, glucose_metabolic: 1 },
  },
  low_libido: { addRiskFlags: ["low_libido"], addBundleWeights: { female_hormone_balance: 2, thyroid_basic: 1, stress_cortisol: 1 } },
  digestive_issues: { addRiskFlags: ["digestive_symptoms"], addBundleWeights: { gut_health_basic: 3, b12_folate: 1, iron_status: 1 } },
  frequent_infections: { addRiskFlags: ["frequent_infections"], addBundleWeights: { vitamin_d: 2, inflammation_basic: 1 } },
  brain_fog: { addRiskFlags: ["brain_fog"], addBundleWeights: { b12_folate: 2, vitamin_d: 1, thyroid_basic: 1, iron_status: 1 } },
  headaches: { addRiskFlags: ["headaches"], addBundleWeights: { magnesium_status: 2, iron_status: 1 } },
};

export const CYCLE_PATTERN_RULES: Record<string, RuleOutputs> = {
  irregular: { addRiskFlags: ["irregular_cycle"] },
  very_painful: { addRiskFlags: ["painful_periods"] },
  very_heavy: { addRiskFlags: ["heavy_periods"] },
  no_current_period: { addRiskFlags: ["amenorrhea_or_no_cycle"] },
};

export const SUN_EXPOSURE_RULES: Record<string, RuleOutputs> = {
  rarely: { addRiskFlags: ["low_sun_exposure"], addLifestyleFlags: ["low_sun_exposure"], addBundleWeights: { vitamin_d: 3 } },
  almost_never: {
    addRiskFlags: ["low_sun_exposure", "very_low_sun_exposure"],
    addLifestyleFlags: ["low_sun_exposure", "very_low_sun_exposure"],
    addBundleWeights: { vitamin_d: 4 },
  },
};

export const DIET_RULES: Record<string, RuleOutputs> = {
  vegetarian: { addLifestyleFlags: ["vegetarian"], addBundleWeights: { iron_status: 2, b12_folate: 2 } },
  vegan: { addLifestyleFlags: ["vegan"], addBundleWeights: { iron_status: 2, b12_folate: 3, iodine_status: 1, omega3_status: 1 } },
  low_red_meat: { addLifestyleFlags: ["low_red_meat"], addBundleWeights: { iron_status: 2, b12_folate: 1 } },
  low_fish: { addLifestyleFlags: ["low_fish"], addBundleWeights: { omega3_status: 2, iodine_status: 1 } },
  dairy_free: { addLifestyleFlags: ["dairy_free"] },
  gluten_free: { addLifestyleFlags: ["gluten_free"] },
  restrictive_dieting: { addLifestyleFlags: ["restrictive_diet"], addBundleWeights: { iron_status: 1, b12_folate: 1, vitamin_d: 1, magnesium_status: 1 } },
};

export const LIFESTYLE_CONTEXT_RULES: Record<string, RuleOutputs> = {
  intense_exercise_4plus: { addLifestyleFlags: ["high_training_load"], addBundleWeights: { iron_status: 2, magnesium_status: 1, vitamin_d: 1 } },
  poor_sleep_most_weeks: { addLifestyleFlags: ["poor_sleep"], addBundleWeights: { stress_cortisol: 2, magnesium_status: 1 } },
  chronically_stressed: { addLifestyleFlags: ["high_stress"], addBundleWeights: { stress_cortisol: 2 } },
  shift_work: { addLifestyleFlags: ["circadian_disruption"], addBundleWeights: { stress_cortisol: 2, glucose_metabolic: 1 } },
};

export const CONDITION_RULES: Record<string, RuleOutputs> = {
  pcos: { addConditionFlags: ["pcos"], addRiskFlags: ["possible_androgen_excess"], addBundleWeights: { androgen_balance: 3, female_hormone_balance: 2, glucose_metabolic: 2, lipid_panel: 1 } },
  endometriosis: { addConditionFlags: ["endometriosis"], addBundleWeights: { iron_status: 2, inflammation_basic: 1, female_hormone_balance: 1 } },
  thyroid_disorder: { addConditionFlags: ["thyroid_disorder"], addBundleWeights: { thyroid_extended: 3, thyroid_basic: 1 } },
  iron_deficiency_or_anemia: { addConditionFlags: ["iron_deficiency_history"], addRiskFlags: ["iron_risk"], addBundleWeights: { iron_status: 4 } },
  vitamin_d_deficiency: { addConditionFlags: ["vitamin_d_deficiency_history"], addRiskFlags: ["vitamin_d_risk"], addBundleWeights: { vitamin_d: 4 } },
  high_cholesterol: { addConditionFlags: ["high_cholesterol_history"], addRiskFlags: ["lipid_risk"], addBundleWeights: { lipid_panel: 4, inflammation_basic: 1 } },
  prediabetes_or_insulin_resistance: { addConditionFlags: ["prediabetes_or_ir"], addRiskFlags: ["glucose_risk"], addBundleWeights: { glucose_metabolic: 4, lipid_panel: 1, liver_function: 1 } },
  diabetes: { addConditionFlags: ["diabetes"], addBundleWeights: { glucose_metabolic: 4, kidney_function: 1, lipid_panel: 1 } },
  fertility_issues: { addConditionFlags: ["fertility_history"], addRiskFlags: ["fertility_focus"], addBundleWeights: { fertility_reserve: 3, female_hormone_balance: 2, thyroid_basic: 1 } },
  recurrent_urogenital_infections: { addConditionFlags: ["urogenital_history"] },
  gut_condition: { addConditionFlags: ["gut_condition"], addRiskFlags: ["gut_risk"], addBundleWeights: { gut_health_basic: 3, b12_folate: 1, iron_status: 1 } },
};

export const MEDICATION_RULES: Record<string, RuleOutputs> = {
  hormonal_contraception: { addMedicationFlags: ["on_hormonal_contraception"] },
  thyroid_medication: { addMedicationFlags: ["on_thyroid_medication"], addBundleWeights: { thyroid_extended: 2 } },
  iron_supplements: { addMedicationFlags: ["on_iron_supplement"], addBundleWeights: { iron_status: 2 } },
  vitamin_d_supplements: { addMedicationFlags: ["on_vitamin_d_supplement"], addBundleWeights: { vitamin_d: 2 } },
  fertility_medication: { addMedicationFlags: ["on_fertility_medication"], addBundleWeights: { fertility_reserve: 2, female_hormone_balance: 1 } },
  glp1_weight_loss_medication: { addMedicationFlags: ["on_glp1"], addBundleWeights: { glucose_metabolic: 1, liver_function: 1 } },
};

export const FAMILY_HISTORY_RULES: Record<string, RuleOutputs> = {
  thyroid_disease: { addFamilyHistoryFlags: ["fh_thyroid"], addBundleWeights: { thyroid_basic: 2, thyroid_extended: 1 } },
  diabetes: { addFamilyHistoryFlags: ["fh_diabetes"], addBundleWeights: { glucose_metabolic: 2 } },
  high_cholesterol_or_heart_disease: { addFamilyHistoryFlags: ["fh_cardiometabolic"], addBundleWeights: { lipid_panel: 3, glucose_metabolic: 1, inflammation_basic: 1 } },
  early_menopause: { addFamilyHistoryFlags: ["fh_early_menopause"], addBundleWeights: { fertility_reserve: 2, female_hormone_balance: 1 } },
  breast_or_ovarian_cancer: { addFamilyHistoryFlags: ["fh_breast_ovarian_cancer"] },
  autoimmune_disease: { addFamilyHistoryFlags: ["fh_autoimmune"], addBundleWeights: { thyroid_extended: 1, inflammation_basic: 1 } },
};


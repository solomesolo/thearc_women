import type { Locale } from "@/lib/i18n/locale";

type Opt<K extends string> = { key: K; label: string };

export const AGE_RANGES = [
  { key: "18_24", label: "18–24" },
  { key: "25_29", label: "25–29" },
  { key: "30_34", label: "30–34" },
  { key: "35_39", label: "35–39" },
  { key: "40_44", label: "40–44" },
  { key: "45_49", label: "45–49" },
  { key: "50_54", label: "50–54" },
  { key: "55_plus", label: "55+" },
] as const;

export const LIFE_STAGES = [
  { key: "reproductive", label: "Regular menstrual cycle" },
  { key: "trying_to_conceive", label: "Trying to conceive" },
  { key: "pregnant", label: "Pregnant" },
  { key: "postpartum", label: "Postpartum" },
  { key: "perimenopause", label: "Perimenopause" },
  { key: "postmenopause", label: "Postmenopause" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const GOALS = [
  { key: "general_preventive_health", label: "General preventive health" },
  { key: "more_energy_and_vitality", label: "More energy and vitality" },
  { key: "hormones_and_cycle_balance", label: "Hormones and cycle balance" },
  { key: "fertility_and_reproductive_planning", label: "Fertility and reproductive planning" },
  { key: "weight_and_metabolism", label: "Weight and metabolism" },
  { key: "mood_stress_sleep", label: "Mood, stress, and sleep" },
  { key: "gut_health_and_digestion", label: "Gut health and digestion" },
  { key: "cardiovascular_long_term_health", label: "Cardiovascular long-term health" },
  { key: "thyroid_health", label: "Thyroid health" },
  { key: "just_exploring", label: "Just exploring" },
] as const;

export const SYMPTOMS = [
  { key: "fatigue", label: "Fatigue" },
  { key: "hair_loss", label: "Hair loss" },
  { key: "low_mood", label: "Low mood" },
  { key: "poor_sleep", label: "Poor sleep" },
  { key: "high_stress", label: "High stress" },
  { key: "weight_gain", label: "Weight gain" },
  { key: "irregular_cycle", label: "Irregular cycle" },
  { key: "painful_periods", label: "Painful periods" },
  { key: "heavy_periods", label: "Heavy periods" },
  { key: "acne_or_excess_facial_hair", label: "Acne or excess facial hair" },
  { key: "low_libido", label: "Low libido" },
  { key: "digestive_issues", label: "Digestive issues" },
  { key: "frequent_infections", label: "Frequent infections" },
  { key: "brain_fog", label: "Brain fog" },
  { key: "headaches", label: "Headaches" },
  { key: "none", label: "None" },
] as const;

export const SUN_EXPOSURE = [
  { key: "most_days", label: "Most days" },
  { key: "few_times_per_week", label: "A few times per week" },
  { key: "rarely", label: "Rarely" },
  { key: "almost_never", label: "Almost never" },
] as const;

export const DIET_PATTERNS = [
  { key: "omnivore", label: "Omnivore" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "low_red_meat", label: "Low red meat" },
  { key: "low_fish", label: "Low fish" },
  { key: "dairy_free", label: "Dairy-free" },
  { key: "gluten_free", label: "Gluten-free" },
  { key: "restrictive_dieting", label: "Restrictive dieting" },
  { key: "none", label: "None" },
] as const;

export const LIFESTYLE_CONTEXT = [
  { key: "intense_exercise_4plus", label: "Intense exercise 4+ days/week" },
  { key: "poor_sleep_most_weeks", label: "Poor sleep most weeks" },
  { key: "chronically_stressed", label: "Chronically stressed" },
  { key: "shift_work", label: "Shift work" },
  { key: "none", label: "None" },
] as const;

export const CONDITIONS = [
  { key: "pcos", label: "PCOS" },
  { key: "endometriosis", label: "Endometriosis" },
  { key: "thyroid_disorder", label: "Thyroid disorder" },
  { key: "iron_deficiency_or_anemia", label: "Iron deficiency or anemia" },
  { key: "vitamin_d_deficiency", label: "Vitamin D deficiency" },
  { key: "high_cholesterol", label: "High cholesterol" },
  { key: "prediabetes_or_insulin_resistance", label: "Prediabetes or insulin resistance" },
  { key: "diabetes", label: "Diabetes" },
  { key: "fertility_issues", label: "Fertility issues" },
  { key: "recurrent_urogenital_infections", label: "Recurrent urogenital infections" },
  { key: "gut_condition", label: "Gut condition" },
  { key: "none", label: "None" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const MEDICATIONS = [
  { key: "hormonal_contraception", label: "Hormonal contraception" },
  { key: "thyroid_medication", label: "Thyroid medication" },
  { key: "iron_supplements", label: "Iron supplements" },
  { key: "vitamin_d_supplements", label: "Vitamin D supplements" },
  { key: "fertility_medication", label: "Fertility medication" },
  { key: "glp1_weight_loss_medication", label: "GLP-1 weight loss medication" },
  { key: "none", label: "None" },
] as const;

export const FAMILY_HISTORY = [
  { key: "thyroid_disease", label: "Thyroid disease" },
  { key: "diabetes", label: "Diabetes" },
  { key: "high_cholesterol_or_heart_disease", label: "High cholesterol or heart disease" },
  { key: "early_menopause", label: "Early menopause" },
  { key: "breast_or_ovarian_cancer", label: "Breast or ovarian cancer" },
  { key: "autoimmune_disease", label: "Autoimmune disease" },
  { key: "none_known", label: "None known" },
] as const;

export const TEST_ITEMS = [
  { key: "vitamin_d", label: "Vitamin D" },
  { key: "iron_ferritin", label: "Iron / Ferritin" },
  { key: "thyroid", label: "Thyroid (TSH)" },
  { key: "hba1c", label: "Blood sugar / HbA1c" },
  { key: "lipids", label: "Cholesterol / Lipids" },
  { key: "hormones", label: "Hormones" },
] as const;

export const RECENCY_OPTIONS = [
  { key: "lt_3m", label: "Less than 3 months ago" },
  { key: "between_3_6m", label: "3–6 months ago" },
  { key: "between_6_12m", label: "6–12 months ago" },
  { key: "gt_12m", label: "More than 12 months ago" },
  { key: "unknown", label: "Never / not sure" },
] as const;

export const CYCLE_PATTERNS = [
  { key: "regular", label: "Regular" },
  { key: "irregular", label: "Irregular" },
  { key: "very_painful", label: "Very painful" },
  { key: "very_heavy", label: "Very heavy" },
  { key: "no_current_period", label: "No current period" },
  { key: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type TestKey = (typeof TEST_ITEMS)[number]["key"];
export type RecencyOption = (typeof RECENCY_OPTIONS)[number]["key"];

type LabelMap<K extends string> = Record<K, string>;

const LIFE_STAGES_DE: LabelMap<(typeof LIFE_STAGES)[number]["key"]> = {
  reproductive: "Regelmäßiger Zyklus",
  trying_to_conceive: "Kinderwunsch",
  pregnant: "Schwanger",
  postpartum: "Postpartum",
  perimenopause: "Perimenopause",
  postmenopause: "Postmenopause",
  prefer_not_to_say: "Möchte ich nicht sagen",
};
const GOALS_DE: LabelMap<(typeof GOALS)[number]["key"]> = {
  general_preventive_health: "Prävention / Check-up",
  more_energy_and_vitality: "Mehr Energie & Vitalität",
  hormones_and_cycle_balance: "Hormone & Zyklus",
  fertility_and_reproductive_planning: "Fertilität & Familienplanung",
  weight_and_metabolism: "Gewicht & Stoffwechsel",
  mood_stress_sleep: "Stimmung, Stress & Schlaf",
  gut_health_and_digestion: "Darm & Verdauung",
  cardiovascular_long_term_health: "Herz-Kreislauf",
  thyroid_health: "Schilddrüse",
  just_exploring: "Ich schaue mich nur um",
};
const SYMPTOMS_DE: LabelMap<(typeof SYMPTOMS)[number]["key"]> = {
  fatigue: "Müdigkeit / Erschöpfung",
  hair_loss: "Haarausfall",
  low_mood: "Niedrige Stimmung",
  poor_sleep: "Schlechter Schlaf",
  high_stress: "Hoher Stress",
  weight_gain: "Gewichtszunahme",
  irregular_cycle: "Unregelmäßiger Zyklus",
  painful_periods: "Schmerzhafte Periode",
  heavy_periods: "Starke Blutung",
  acne_or_excess_facial_hair: "Akne oder vermehrte Gesichtsbehaarung",
  low_libido: "Niedrige Libido",
  digestive_issues: "Verdauungsbeschwerden",
  frequent_infections: "Häufige Infekte",
  brain_fog: "Konzentrationsprobleme (Brain Fog)",
  headaches: "Kopfschmerzen",
  none: "Keine",
};
const SUN_EXPOSURE_DE: LabelMap<(typeof SUN_EXPOSURE)[number]["key"]> = {
  most_days: "An den meisten Tagen",
  few_times_per_week: "Ein paar Mal pro Woche",
  rarely: "Selten",
  almost_never: "Fast nie",
};
const DIET_PATTERNS_DE: LabelMap<(typeof DIET_PATTERNS)[number]["key"]> = {
  omnivore: "Allesesser:in",
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
  low_red_meat: "Wenig rotes Fleisch",
  low_fish: "Wenig Fisch",
  dairy_free: "Milchfrei",
  gluten_free: "Glutenfrei",
  restrictive_dieting: "Restriktive Diäten",
  none: "Keine",
};
const LIFESTYLE_CONTEXT_DE: LabelMap<(typeof LIFESTYLE_CONTEXT)[number]["key"]> = {
  intense_exercise_4plus: "Intensives Training 4+ Tage/Woche",
  poor_sleep_most_weeks: "Meist schlechter Schlaf",
  chronically_stressed: "Chronisch gestresst",
  shift_work: "Schichtarbeit",
  none: "Keine",
};
const CONDITIONS_DE: LabelMap<(typeof CONDITIONS)[number]["key"]> = {
  pcos: "PCOS",
  endometriosis: "Endometriose",
  thyroid_disorder: "Schilddrüsenerkrankung",
  iron_deficiency_or_anemia: "Eisenmangel / Anämie",
  vitamin_d_deficiency: "Vitamin-D-Mangel",
  high_cholesterol: "Erhöhte Cholesterinwerte",
  prediabetes_or_insulin_resistance: "Prädiabetes / Insulinresistenz",
  diabetes: "Diabetes",
  fertility_issues: "Fertilitätsprobleme",
  recurrent_urogenital_infections: "Wiederkehrende urogenitale Infekte",
  gut_condition: "Darmerkrankung",
  none: "Keine",
  prefer_not_to_say: "Möchte ich nicht sagen",
};
const MEDICATIONS_DE: LabelMap<(typeof MEDICATIONS)[number]["key"]> = {
  hormonal_contraception: "Hormonelle Verhütung",
  thyroid_medication: "Schilddrüsenmedikation",
  iron_supplements: "Eisensupplemente",
  vitamin_d_supplements: "Vitamin-D-Supplemente",
  fertility_medication: "Fertilitätsmedikation",
  glp1_weight_loss_medication: "GLP‑1 (Gewichtsreduktion)",
  none: "Keine",
};
const FAMILY_HISTORY_DE: LabelMap<(typeof FAMILY_HISTORY)[number]["key"]> = {
  thyroid_disease: "Schilddrüsenerkrankung",
  diabetes: "Diabetes",
  high_cholesterol_or_heart_disease: "Cholesterin / Herz-Kreislauf",
  early_menopause: "Frühe Menopause",
  breast_or_ovarian_cancer: "Brust- oder Eierstockkrebs",
  autoimmune_disease: "Autoimmunerkrankung",
  none_known: "Nichts bekannt",
};
const TEST_ITEMS_DE: LabelMap<(typeof TEST_ITEMS)[number]["key"]> = {
  vitamin_d: "Vitamin D",
  iron_ferritin: "Eisen / Ferritin",
  thyroid: "Schilddrüse (TSH)",
  hba1c: "Blutzucker / HbA1c",
  lipids: "Cholesterin / Lipide",
  hormones: "Hormone",
};
const CYCLE_PATTERNS_DE: LabelMap<(typeof CYCLE_PATTERNS)[number]["key"]> = {
  regular: "Regelmäßig",
  irregular: "Unregelmäßig",
  very_painful: "Sehr schmerzhaft",
  very_heavy: "Sehr stark",
  no_current_period: "Derzeit keine Periode",
  prefer_not_to_say: "Möchte ich nicht sagen",
};

function localize<const A extends readonly { key: string; label: string }[]>(
  arr: A,
  locale: Locale,
  deMap: Record<A[number]["key"], string>,
): Array<Opt<A[number]["key"]>> {
  const out: Array<Opt<A[number]["key"]>> = [];
  for (const x of arr) {
    const key = x.key as A[number]["key"];
    out.push({ key, label: locale === "de" ? (deMap[key] ?? x.label) : x.label });
  }
  return out;
}

export function getSurveyOptions(locale: Locale) {
  return {
    AGE_RANGES: AGE_RANGES as unknown as Array<Opt<(typeof AGE_RANGES)[number]["key"]>>,
    LIFE_STAGES: localize(LIFE_STAGES, locale, LIFE_STAGES_DE),
    GOALS: localize(GOALS, locale, GOALS_DE),
    SYMPTOMS: localize(SYMPTOMS, locale, SYMPTOMS_DE),
    SUN_EXPOSURE: localize(SUN_EXPOSURE, locale, SUN_EXPOSURE_DE),
    DIET_PATTERNS: localize(DIET_PATTERNS, locale, DIET_PATTERNS_DE),
    LIFESTYLE_CONTEXT: localize(LIFESTYLE_CONTEXT, locale, LIFESTYLE_CONTEXT_DE),
    CONDITIONS: localize(CONDITIONS, locale, CONDITIONS_DE),
    MEDICATIONS: localize(MEDICATIONS, locale, MEDICATIONS_DE),
    FAMILY_HISTORY: localize(FAMILY_HISTORY, locale, FAMILY_HISTORY_DE),
    TEST_ITEMS: localize(TEST_ITEMS, locale, TEST_ITEMS_DE),
    CYCLE_PATTERNS: localize(CYCLE_PATTERNS, locale, CYCLE_PATTERNS_DE),
  };
}

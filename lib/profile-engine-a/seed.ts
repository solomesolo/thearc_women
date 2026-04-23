import { prisma as defaultPrisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const ENGINE_A_QUESTIONNAIRE_VERSION = "profile_v1";

let seedOncePromise: Promise<void> | null = null;

export const ENGINE_A_BUNDLES: Array<{ key: string; name: string; category: string }> = [
  { key: "vitamin_d", name: "Vitamin D", category: "nutrients" },
  { key: "iron_status", name: "Iron status", category: "nutrients" },
  { key: "b12_folate", name: "B12 & folate", category: "nutrients" },
  { key: "thyroid_basic", name: "Thyroid (basic)", category: "hormones" },
  { key: "thyroid_extended", name: "Thyroid (extended)", category: "hormones" },
  { key: "lipid_panel", name: "Lipid panel", category: "metabolic" },
  { key: "glucose_metabolic", name: "Glucose / metabolic", category: "metabolic" },
  { key: "stress_cortisol", name: "Stress / cortisol", category: "stress_sleep" },
  { key: "female_hormone_balance", name: "Female hormone balance", category: "hormones" },
  { key: "fertility_reserve", name: "Fertility reserve", category: "fertility" },
  { key: "androgen_balance", name: "Androgen balance", category: "hormones" },
  { key: "liver_function", name: "Liver function", category: "organ_function" },
  { key: "kidney_function", name: "Kidney function", category: "organ_function" },
  { key: "inflammation_basic", name: "Inflammation (basic)", category: "inflammation" },
  { key: "omega3_status", name: "Omega-3 status", category: "nutrients" },
  { key: "magnesium_status", name: "Magnesium status", category: "nutrients" },
  { key: "iodine_status", name: "Iodine status", category: "nutrients" },
  { key: "gut_health_basic", name: "Gut health (basic)", category: "gut" },
  { key: "sti_panel", name: "STI panel", category: "sexual_health" },
  { key: "comprehensive_preventive", name: "Comprehensive preventive", category: "preventive" },
];

export const ENGINE_A_BUNDLE_BIOMARKER_ALIASES: Record<string, string[]> = {
  vitamin_d: ["Vitamin D", "25-OH-Vitamin-D3", "25 OH Vitamin D", "25(OH) Vitamin D"],
  iron_status: ["Ferritin", "Iron", "Ferritin (blood test)"],
  b12_folate: ["Vitamin B12", "Active Vitamin B12 (Holotranscobalamin)", "Folic acid", "Homocysteine"],
  thyroid_basic: ["TSH", "TSH (sensitive)", "Thyroid-stimulating hormone"],
  thyroid_extended: ["TSH", "free T3", "FT3", "free T4", "FT4", "TPO antibodies"],
  lipid_panel: ["HDL cholesterol", "LDL cholesterol", "Triglyceride", "Total cholesterol", "Cholesterol:HDL Ratio", "ApoA1"],
  glucose_metabolic: ["HbA1c", "Long-term blood sugar (HbA1c)", "fasting glucose", "Glucose"],
  stress_cortisol: ["Cortisol", "Cortisol (AM)"],
  female_hormone_balance: ["Estradiol", "FSH", "LH", "Prolactin", "SHBG", "Testosterone", "DHEA-S"],
  fertility_reserve: ["Anti-Müllerian hormone (AMH)", "AMH", "FSH", "LH", "Estradiol", "Prolactin"],
  androgen_balance: ["Testosterone", "SHBG", "DHEA-S", "LH", "FSH"],
  liver_function: ["ALT", "ALAT", "Alanine aminotransferase (ALT)", "AST", "GGT", "Gamma GT", "Bilirubin"],
  kidney_function: ["Creatinine", "Albumin-creatinine ratio", "Uric acid"],
  inflammation_basic: ["C-Reactive Protein (CRP)", "CRP", "hsCRP", "High-sensitivity CRP"],
  omega3_status: ["Omega-3", "Omega-3 index", "EPA", "DHA"],
  magnesium_status: ["Magnesium", "Magnesium (blood test)"],
  iodine_status: ["Iodine"],
  gut_health_basic: ["Calprotectin", "Zonulin", "Helicobacter pylori", "alpha-1 antitrypsin", "pancreatic elastase"],
  sti_panel: ["Chlamydia trachomatis", "HIV", "Syphilis", "Gonorrhea", "Hepatitis"],
  comprehensive_preventive: [],
};

export function normalizeBiomarkerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/µ/g, "u")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const QUESTIONS_COUNT = 12;

export async function ensureEngineASeed(client = defaultPrisma) {
  if (seedOncePromise) return seedOncePromise;

  // Fast path: if the definition + all questions already exist, skip 350+ sequential writes.
  const existing = await client.questionnaireDefinition.findUnique({
    where: { version: ENGINE_A_QUESTIONNAIRE_VERSION },
    select: { id: true, _count: { select: { questions: true } } },
  });
  if (existing && existing._count.questions >= QUESTIONS_COUNT) {
    seedOncePromise = Promise.resolve();
    return seedOncePromise;
  }

  seedOncePromise = (async () => {
  // Questionnaire definition (minimal; questions/options can be added later without breaking engine).
  const def = await client.questionnaireDefinition.upsert({
    where: { version: ENGINE_A_QUESTIONNAIRE_VERSION },
    create: { version: ENGINE_A_QUESTIONNAIRE_VERSION, name: "Engine A Profile Survey", isActive: true },
    update: { name: "Engine A Profile Survey", isActive: true },
    select: { id: true },
  });

  const QUESTIONS: Array<{
    key: string;
    type: "single_select" | "multi_select" | "repeated_single_select";
    step: number;
    order: number;
    required: boolean;
    options?: Array<{ key: string; label_en: string; label_de?: string }>;
    ui_schema?: Record<string, unknown>;
    conditional_json?: Record<string, unknown>;
  }> = [
    {
      key: "age_range",
      type: "single_select",
      step: 1,
      order: 1,
      required: true,
      options: [
        { key: "under_18", label_en: "Under 18" },
        { key: "18_24", label_en: "18–24" },
        { key: "25_29", label_en: "25–29" },
        { key: "30_34", label_en: "30–34" },
        { key: "35_39", label_en: "35–39" },
        { key: "40_44", label_en: "40–44" },
        { key: "45_49", label_en: "45–49" },
        { key: "50_54", label_en: "50–54" },
        { key: "55_plus", label_en: "55+" },
      ],
    },
    {
      key: "life_stage",
      type: "single_select",
      step: 2,
      order: 2,
      required: true,
      options: [
        { key: "reproductive", label_en: "Regular menstrual cycle" },
        { key: "trying_to_conceive", label_en: "Trying to conceive" },
        { key: "pregnant", label_en: "Pregnant" },
        { key: "postpartum", label_en: "Postpartum" },
        { key: "perimenopause", label_en: "Perimenopause" },
        { key: "postmenopause", label_en: "Postmenopause" },
        { key: "prefer_not_to_say", label_en: "Prefer not to say" },
      ],
    },
    {
      key: "goals",
      type: "multi_select",
      step: 3,
      order: 3,
      required: true,
      options: [
        { key: "general_preventive_health", label_en: "General preventive health" },
        { key: "more_energy_and_vitality", label_en: "More energy and vitality" },
        { key: "hormones_and_cycle_balance", label_en: "Hormones and cycle balance" },
        { key: "fertility_and_reproductive_planning", label_en: "Fertility and reproductive planning" },
        { key: "weight_and_metabolism", label_en: "Weight and metabolism" },
        { key: "mood_stress_sleep", label_en: "Mood, stress, and sleep" },
        { key: "gut_health_and_digestion", label_en: "Gut health and digestion" },
        { key: "cardiovascular_long_term_health", label_en: "Cardiovascular long-term health" },
        { key: "thyroid_health", label_en: "Thyroid health" },
        { key: "just_exploring", label_en: "Just exploring" },
      ],
    },
    {
      key: "symptoms",
      type: "multi_select",
      step: 4,
      order: 4,
      required: true,
      options: [
        { key: "fatigue", label_en: "Fatigue" },
        { key: "hair_loss", label_en: "Hair loss" },
        { key: "low_mood", label_en: "Low mood" },
        { key: "poor_sleep", label_en: "Poor sleep" },
        { key: "high_stress", label_en: "High stress" },
        { key: "weight_gain", label_en: "Weight gain" },
        { key: "irregular_cycle", label_en: "Irregular cycle" },
        { key: "painful_periods", label_en: "Painful periods" },
        { key: "heavy_periods", label_en: "Heavy periods" },
        { key: "acne_or_excess_facial_hair", label_en: "Acne or excess facial hair" },
        { key: "low_libido", label_en: "Low libido" },
        { key: "digestive_issues", label_en: "Digestive issues" },
        { key: "frequent_infections", label_en: "Frequent infections" },
        { key: "brain_fog", label_en: "Brain fog" },
        { key: "headaches", label_en: "Headaches" },
        { key: "none", label_en: "None" },
      ],
    },
    {
      key: "cycle_pattern",
      type: "single_select",
      step: 5,
      order: 5,
      required: false,
      conditional_json: { show_if: { life_stage_in: ["reproductive", "trying_to_conceive", "perimenopause"] } },
      options: [
        { key: "regular", label_en: "Regular" },
        { key: "irregular", label_en: "Irregular" },
        { key: "very_painful", label_en: "Very painful" },
        { key: "very_heavy", label_en: "Very heavy" },
        { key: "no_current_period", label_en: "No current period" },
        { key: "prefer_not_to_say", label_en: "Prefer not to say" },
      ],
    },
    {
      key: "sun_exposure",
      type: "single_select",
      step: 6,
      order: 6,
      required: true,
      options: [
        { key: "most_days", label_en: "Most days" },
        { key: "few_times_per_week", label_en: "A few times per week" },
        { key: "rarely", label_en: "Rarely" },
        { key: "almost_never", label_en: "Almost never" },
      ],
    },
    {
      key: "diet_pattern",
      type: "multi_select",
      step: 7,
      order: 7,
      required: false,
      options: [
        { key: "omnivore", label_en: "Omnivore" },
        { key: "vegetarian", label_en: "Vegetarian" },
        { key: "vegan", label_en: "Vegan" },
        { key: "low_red_meat", label_en: "Low red meat" },
        { key: "low_fish", label_en: "Low fish" },
        { key: "dairy_free", label_en: "Dairy-free" },
        { key: "gluten_free", label_en: "Gluten-free" },
        { key: "restrictive_dieting", label_en: "Restrictive dieting" },
        { key: "none", label_en: "None" },
      ],
    },
    {
      key: "lifestyle_context",
      type: "multi_select",
      step: 8,
      order: 8,
      required: false,
      options: [
        { key: "intense_exercise_4plus", label_en: "Intense exercise 4+ days/week" },
        { key: "poor_sleep_most_weeks", label_en: "Poor sleep most weeks" },
        { key: "chronically_stressed", label_en: "Chronically stressed" },
        { key: "shift_work", label_en: "Shift work" },
        { key: "none", label_en: "None" },
      ],
    },
    {
      key: "known_conditions",
      type: "multi_select",
      step: 9,
      order: 9,
      required: true,
      options: [
        { key: "pcos", label_en: "PCOS" },
        { key: "endometriosis", label_en: "Endometriosis" },
        { key: "thyroid_disorder", label_en: "Thyroid disorder" },
        { key: "iron_deficiency_or_anemia", label_en: "Iron deficiency or anemia" },
        { key: "vitamin_d_deficiency", label_en: "Vitamin D deficiency" },
        { key: "high_cholesterol", label_en: "High cholesterol" },
        { key: "prediabetes_or_insulin_resistance", label_en: "Prediabetes or insulin resistance" },
        { key: "diabetes", label_en: "Diabetes" },
        { key: "fertility_issues", label_en: "Fertility issues" },
        { key: "recurrent_urogenital_infections", label_en: "Recurrent urogenital infections" },
        { key: "gut_condition", label_en: "Gut condition" },
        { key: "none", label_en: "None" },
        { key: "prefer_not_to_say", label_en: "Prefer not to say" },
      ],
    },
    {
      key: "medications_or_hormones",
      type: "multi_select",
      step: 10,
      order: 10,
      required: false,
      options: [
        { key: "hormonal_contraception", label_en: "Hormonal contraception" },
        { key: "thyroid_medication", label_en: "Thyroid medication" },
        { key: "iron_supplements", label_en: "Iron supplements" },
        { key: "vitamin_d_supplements", label_en: "Vitamin D supplements" },
        { key: "fertility_medication", label_en: "Fertility medication" },
        { key: "glp1_weight_loss_medication", label_en: "GLP-1 weight loss medication" },
        { key: "none", label_en: "None" },
      ],
    },
    {
      key: "family_history",
      type: "multi_select",
      step: 11,
      order: 11,
      required: true,
      options: [
        { key: "thyroid_disease", label_en: "Thyroid disease" },
        { key: "diabetes", label_en: "Diabetes" },
        { key: "high_cholesterol_or_heart_disease", label_en: "High cholesterol or heart disease" },
        { key: "early_menopause", label_en: "Early menopause" },
        { key: "breast_or_ovarian_cancer", label_en: "Breast or ovarian cancer" },
        { key: "autoimmune_disease", label_en: "Autoimmune disease" },
        { key: "none_known", label_en: "None known" },
      ],
    },
    {
      key: "last_tests",
      type: "repeated_single_select",
      step: 12,
      order: 12,
      required: true,
      ui_schema: {
        supported_test_keys: ["vitamin_d", "iron_ferritin", "thyroid", "hba1c", "lipids", "hormones"],
      },
      options: [
        { key: "lt_3m", label_en: "Less than 3 months ago" },
        { key: "between_3_6m", label_en: "3–6 months ago" },
        { key: "between_6_12m", label_en: "6–12 months ago" },
        { key: "gt_12m", label_en: "More than 12 months ago" },
        { key: "unknown", label_en: "Never / not sure" },
      ],
    },
  ];

  for (const q of QUESTIONS) {
    const existingQ = await client.questionnaireQuestion.findFirst({
      where: { questionnaireDefinitionId: def.id, questionKey: q.key },
      select: { id: true },
    });
    const question = existingQ
      ? await client.questionnaireQuestion.update({
          where: { id: existingQ.id },
          data: {
            questionType: q.type,
            stepNumber: q.step,
            displayOrder: q.order,
            isRequired: q.required,
            conditionalJson: (q.conditional_json ?? {}) as Prisma.InputJsonValue,
            uiSchema: (q.ui_schema ?? {}) as Prisma.InputJsonValue,
          },
          select: { id: true },
        })
      : await client.questionnaireQuestion.create({
          data: {
            questionnaireDefinitionId: def.id,
            questionKey: q.key,
            questionType: q.type,
            stepNumber: q.step,
            displayOrder: q.order,
            isRequired: q.required,
            conditionalJson: (q.conditional_json ?? {}) as Prisma.InputJsonValue,
            uiSchema: (q.ui_schema ?? {}) as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

    for (let i = 0; i < (q.options ?? []).length; i++) {
      const opt = q.options![i]!;
      const existingOpt = await client.questionnaireQuestionOption.findFirst({
        where: { questionId: question.id, optionKey: opt.key },
        select: { id: true },
      });
      if (existingOpt) {
        await client.questionnaireQuestionOption.update({
          where: { id: existingOpt.id },
          data: {
            labelEn: opt.label_en,
            labelDe: opt.label_de ?? null,
            displayOrder: i + 1,
          },
        });
      } else {
        await client.questionnaireQuestionOption.create({
          data: {
            questionId: question.id,
            optionKey: opt.key,
            labelEn: opt.label_en,
            labelDe: opt.label_de ?? null,
            displayOrder: i + 1,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
      }
    }
  }

  // Canonical bundles + aliases
  for (const b of ENGINE_A_BUNDLES) {
    const row = await client.canonicalTestBundle.upsert({
      where: { bundleKey: b.key },
      create: { bundleKey: b.key, displayNameEn: b.name, category: b.category, metadata: {} as Prisma.InputJsonValue },
      update: { displayNameEn: b.name, category: b.category },
      select: { id: true },
    });
    const aliases = ENGINE_A_BUNDLE_BIOMARKER_ALIASES[b.key] ?? [];
    for (const a of aliases) {
      const normalized = normalizeBiomarkerName(a);
      const existingAlias = await client.bundleBiomarkerAlias.findFirst({
        where: { bundleId: row.id, biomarkerNameNormalized: normalized },
        select: { id: true },
      });
      if (existingAlias) {
        await client.bundleBiomarkerAlias.update({
          where: { id: existingAlias.id },
          data: { biomarkerNameDisplay: a },
        });
      } else {
        await client.bundleBiomarkerAlias.create({
          data: { bundleId: row.id, biomarkerNameNormalized: normalized, biomarkerNameDisplay: a },
        });
      }
    }
  }
  })().catch((err) => {
    // Allow retry after transient errors (e.g. DB restart in dev).
    seedOncePromise = null;
    throw err;
  });
  return seedOncePromise;
}


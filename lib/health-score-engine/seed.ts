import { prisma as defaultPrisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ENGINE_A_BUNDLES, normalizeBiomarkerName } from "@/lib/profile-engine-a/seed";

export const HEALTH_SCORE_POLICY_KEY = "weighted_completion_v1" as const;

export const STATUS_MULTIPLIERS_V1: Record<string, number> = {
  missing: 0.2,
  outdated: 0.5,
  planned: 0.75,
  current: 1.0,
  completed_current: 1.0,
};

export const BASE_BUNDLE_WEIGHTS: Record<string, number> = {
  vitamin_d: 8,
  iron_status: 9,
  b12_folate: 6,
  thyroid_basic: 9,
  thyroid_extended: 10,
  lipid_panel: 8,
  glucose_metabolic: 8,
  stress_cortisol: 5,
  female_hormone_balance: 8,
  fertility_reserve: 9,
  androgen_balance: 7,
  liver_function: 5,
  kidney_function: 5,
  inflammation_basic: 5,
  omega3_status: 4,
  magnesium_status: 4,
  iodine_status: 4,
  sti_panel: 4,
  gut_health_basic: 6,
  comprehensive_preventive: 7,
};

// Required biomarker coverage mapping (normalized names).
export const REQUIRED_MARKERS: Record<string, string[]> = {
  vitamin_d: ["vitamin d 25 oh"],
  iron_status: ["ferritin", "iron"],
  b12_folate: ["vitamin b12", "folic acid"],
  thyroid_basic: ["tsh"],
  thyroid_extended: ["tsh", "free t3", "free t4"],
  lipid_panel: ["hdl cholesterol", "ldl cholesterol", "triglyceride", "total cholesterol"],
  glucose_metabolic: ["hba1c"],
  stress_cortisol: ["cortisol"],
  female_hormone_balance: ["estradiol", "fsh", "lh"],
  fertility_reserve: ["amh"],
  androgen_balance: ["testosterone", "shbg"],
  liver_function: ["alt", "ast", "ggt"],
  kidney_function: ["creatinine"],
  inflammation_basic: ["crp"],
  omega3_status: ["omega 3"],
  magnesium_status: ["magnesium"],
  iodine_status: ["iodine"],
  sti_panel: ["hiv", "syphilis", "chlamydia", "gonorrhea"],
  gut_health_basic: ["calprotectin"],
  comprehensive_preventive: ["hba1c", "lipid", "tsh"],
};

// Relevance deltas in "steps" (each step = +0.1 multiplier in v1).
export const RELEVANCE_FACTORS: Array<{
  bundle_key: string;
  factor_type: string;
  factor_key: string;
  weight_delta: number;
}> = [
  // Symptoms
  { bundle_key: "vitamin_d", factor_type: "symptom", factor_key: "fatigue", weight_delta: 2 },
  { bundle_key: "iron_status", factor_type: "symptom", factor_key: "fatigue", weight_delta: 2 },
  { bundle_key: "thyroid_basic", factor_type: "symptom", factor_key: "fatigue", weight_delta: 2 },
  { bundle_key: "b12_folate", factor_type: "symptom", factor_key: "fatigue", weight_delta: 1 },

  { bundle_key: "iron_status", factor_type: "symptom", factor_key: "heavy_periods", weight_delta: 3 },
  { bundle_key: "b12_folate", factor_type: "symptom", factor_key: "heavy_periods", weight_delta: 1 },
  { bundle_key: "female_hormone_balance", factor_type: "symptom", factor_key: "heavy_periods", weight_delta: 1 },

  { bundle_key: "iron_status", factor_type: "symptom", factor_key: "hair_loss", weight_delta: 2 },
  { bundle_key: "thyroid_basic", factor_type: "symptom", factor_key: "hair_loss", weight_delta: 2 },
  { bundle_key: "b12_folate", factor_type: "symptom", factor_key: "hair_loss", weight_delta: 1 },
  { bundle_key: "androgen_balance", factor_type: "symptom", factor_key: "hair_loss", weight_delta: 1 },

  { bundle_key: "stress_cortisol", factor_type: "symptom", factor_key: "high_stress", weight_delta: 2 },
  { bundle_key: "magnesium_status", factor_type: "symptom", factor_key: "poor_sleep", weight_delta: 1 },
  { bundle_key: "stress_cortisol", factor_type: "symptom", factor_key: "poor_sleep", weight_delta: 2 },

  { bundle_key: "glucose_metabolic", factor_type: "symptom", factor_key: "weight_gain", weight_delta: 2 },
  { bundle_key: "thyroid_basic", factor_type: "symptom", factor_key: "weight_gain", weight_delta: 2 },
  { bundle_key: "lipid_panel", factor_type: "symptom", factor_key: "weight_gain", weight_delta: 1 },

  { bundle_key: "female_hormone_balance", factor_type: "symptom", factor_key: "irregular_cycle", weight_delta: 3 },
  { bundle_key: "androgen_balance", factor_type: "symptom", factor_key: "irregular_cycle", weight_delta: 2 },

  { bundle_key: "gut_health_basic", factor_type: "symptom", factor_key: "digestive_symptoms", weight_delta: 3 },

  // Lifestyle
  { bundle_key: "vitamin_d", factor_type: "lifestyle", factor_key: "low_sun_exposure", weight_delta: 3 },
  { bundle_key: "iron_status", factor_type: "lifestyle", factor_key: "vegetarian", weight_delta: 2 },
  { bundle_key: "b12_folate", factor_type: "lifestyle", factor_key: "vegetarian", weight_delta: 2 },
  { bundle_key: "iron_status", factor_type: "lifestyle", factor_key: "vegan", weight_delta: 2 },
  { bundle_key: "b12_folate", factor_type: "lifestyle", factor_key: "vegan", weight_delta: 2 },
  { bundle_key: "omega3_status", factor_type: "lifestyle", factor_key: "low_fish", weight_delta: 2 },
  { bundle_key: "iodine_status", factor_type: "lifestyle", factor_key: "low_fish", weight_delta: 1 },

  // Conditions / history
  { bundle_key: "thyroid_extended", factor_type: "condition", factor_key: "thyroid_disorder", weight_delta: 4 },
  { bundle_key: "iron_status", factor_type: "condition", factor_key: "iron_deficiency_history", weight_delta: 4 },
  { bundle_key: "vitamin_d", factor_type: "condition", factor_key: "vitamin_d_deficiency_history", weight_delta: 4 },
  { bundle_key: "glucose_metabolic", factor_type: "condition", factor_key: "prediabetes_or_ir", weight_delta: 4 },
  { bundle_key: "glucose_metabolic", factor_type: "condition", factor_key: "diabetes", weight_delta: 4 },
  { bundle_key: "kidney_function", factor_type: "condition", factor_key: "diabetes", weight_delta: 2 },

  // Family history
  { bundle_key: "thyroid_basic", factor_type: "family_history", factor_key: "fh_thyroid", weight_delta: 2 },
  { bundle_key: "glucose_metabolic", factor_type: "family_history", factor_key: "fh_diabetes", weight_delta: 2 },
  { bundle_key: "lipid_panel", factor_type: "family_history", factor_key: "fh_cardiometabolic", weight_delta: 3 },

  // Medications
  { bundle_key: "thyroid_extended", factor_type: "medication", factor_key: "on_thyroid_medication", weight_delta: 3 },
  { bundle_key: "iron_status", factor_type: "medication", factor_key: "on_iron_supplement", weight_delta: 2 },
  { bundle_key: "vitamin_d", factor_type: "medication", factor_key: "on_vitamin_d_supplement", weight_delta: 2 },
];

function asJson(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

let healthSeedOncePromise: Promise<{ policyId: string }> | null = null;

export async function ensureHealthScoreSeed(client = defaultPrisma) {
  if (healthSeedOncePromise) return healthSeedOncePromise;

  // Fast path: if the policy + all bundle weights already exist, skip 100+ sequential writes.
  const existing = await client.healthScorePolicy.findUnique({
    where: { policyKey: HEALTH_SCORE_POLICY_KEY },
    select: { id: true, _count: { select: { bundleWeights: true } } },
  });
  if (existing && existing._count.bundleWeights >= ENGINE_A_BUNDLES.length) {
    healthSeedOncePromise = Promise.resolve({ policyId: existing.id });
    return healthSeedOncePromise;
  }

  healthSeedOncePromise = (async () => {
  const policy = await client.healthScorePolicy.upsert({
    where: { policyKey: HEALTH_SCORE_POLICY_KEY },
    create: {
      policyKey: HEALTH_SCORE_POLICY_KEY,
      displayName: "Weighted completion v1",
      statusWeights: asJson(STATUS_MULTIPLIERS_V1),
      relevanceThreshold: 1.0,
      allowPartialCoverage: true,
      active: true,
    },
    update: {
      displayName: "Weighted completion v1",
      statusWeights: asJson(STATUS_MULTIPLIERS_V1),
      active: true,
    },
    select: { id: true },
  });

  // Bundle base weights
  for (const b of ENGINE_A_BUNDLES) {
    const base = BASE_BUNDLE_WEIGHTS[b.key] ?? 5;
    const existing = await client.bundleWeightPolicy.findFirst({
      where: { policyId: policy.id, bundleKey: b.key },
      select: { id: true },
    });
    if (existing) {
      await client.bundleWeightPolicy.update({
        where: { id: existing.id },
        data: { baseWeight: base, category: b.category },
      });
    } else {
      await client.bundleWeightPolicy.create({
        data: { policyId: policy.id, bundleKey: b.key, baseWeight: base, category: b.category },
      });
    }
  }

  // Coverage requirements
  for (const [bundleKey, markers] of Object.entries(REQUIRED_MARKERS)) {
    for (const m of markers) {
      const normalized = normalizeBiomarkerName(m);
      const existing = await client.bundleCoverageRequirement.findFirst({
        where: { bundleKey, biomarkerNormalizedName: normalized },
        select: { id: true },
      });
      if (existing) {
        await client.bundleCoverageRequirement.update({ where: { id: existing.id }, data: { isRequired: true } });
      } else {
        await client.bundleCoverageRequirement.create({
          data: { bundleKey, biomarkerNormalizedName: normalized, isRequired: true, weight: 1.0 },
        });
      }
    }
  }

  // Relevance factors
  for (const f of RELEVANCE_FACTORS) {
    const existing = await client.bundleRelevanceFactor.findFirst({
      where: { bundleKey: f.bundle_key, factorType: f.factor_type, factorKey: f.factor_key },
      select: { id: true },
    });
    if (existing) {
      await client.bundleRelevanceFactor.update({ where: { id: existing.id }, data: { weightDelta: f.weight_delta } });
    } else {
      await client.bundleRelevanceFactor.create({
        data: { bundleKey: f.bundle_key, factorType: f.factor_type, factorKey: f.factor_key, weightDelta: f.weight_delta },
      });
    }
  }

  // Suppression rules: thyroid_extended suppresses thyroid_basic (when extended is current/completed_current).
  const existingSupp = await client.bundleSuppressionRule.findFirst({
    where: { primaryBundleKey: "thyroid_extended", suppressedBundleKey: "thyroid_basic" },
    select: { id: true },
  });
  if (existingSupp) {
    await client.bundleSuppressionRule.update({
      where: { id: existingSupp.id },
      data: { active: true, conditionJson: asJson({ when_primary_status_in: ["current", "completed_current"] }) },
    });
  } else {
    await client.bundleSuppressionRule.create({
      data: {
        primaryBundleKey: "thyroid_extended",
        suppressedBundleKey: "thyroid_basic",
        active: true,
        conditionJson: asJson({ when_primary_status_in: ["current", "completed_current"] }),
      },
    });
  }

  return { policyId: policy.id };
  })().catch((err) => {
    healthSeedOncePromise = null;
    throw err;
  });
  return healthSeedOncePromise;
}


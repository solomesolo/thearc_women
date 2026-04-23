import { prisma } from "@/lib/db";
import { normalizeBiomarkerName } from "@/lib/profile-engine-a/seed";
import { ensureHealthScoreSeed, HEALTH_SCORE_POLICY_KEY } from "./seed";
import type { BundleBreakdown, HealthScoreBand, HealthScoreBundleStatus, HealthScoreOutput } from "./healthScoreTypes";

function toNum(v: any): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function scoreBand(score: number): HealthScoreBand {
  if (score >= 90) return "high";
  if (score >= 70) return "strong";
  if (score >= 40) return "moderate";
  return "low";
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function inferRecommendedBundlesFromProfile(profile: any): string[] {
  const lifeStage = (profile?.lifeStage as string | null) ?? null;
  const risk = new Set<string>((profile?.riskFlags as string[]) ?? []);
  const lifestyle = new Set<string>((profile?.lifestyleFlags as string[]) ?? []);
  const conditions = new Set<string>((profile?.conditionFlags as string[]) ?? []);
  const family = new Set<string>((profile?.familyHistoryFlags as string[]) ?? []);
  const meds = new Set<string>((profile?.medicationFlags as string[]) ?? []);

  const bundles: string[] = ["vitamin_d", "iron_status", "thyroid_basic", "lipid_panel", "glucose_metabolic"];

  if (risk.has("high_stress") || risk.has("poor_sleep") || lifestyle.has("circadian_disruption")) bundles.push("stress_cortisol", "magnesium_status");
  if (risk.has("digestive_symptoms") || conditions.has("gut_condition")) bundles.push("gut_health_basic");
  if (risk.has("irregular_cycle") || risk.has("painful_periods") || risk.has("heavy_periods") || lifeStage === "perimenopause") bundles.push("female_hormone_balance");
  if (risk.has("hair_loss") || conditions.has("pcos")) bundles.push("androgen_balance");
  if (lifeStage === "trying_to_conceive") bundles.push("fertility_reserve", "iodine_status", "female_hormone_balance");
  if (conditions.has("thyroid_disorder") || meds.has("on_thyroid_medication") || family.has("fh_autoimmune")) bundles.push("thyroid_extended");
  if (conditions.has("diabetes")) bundles.push("kidney_function");
  if (risk.has("fatigue") || lifestyle.has("restrictive_diet") || lifestyle.has("vegetarian") || lifestyle.has("vegan")) bundles.push("b12_folate");
  if (lifestyle.has("low_fish")) bundles.push("omega3_status", "iodine_status");

  return uniq(bundles);
}

function statusFromEngineC(finalStatus: string | null | undefined): HealthScoreBundleStatus {
  if (!finalStatus) return "missing";
  if (finalStatus === "missing" || finalStatus === "outdated" || finalStatus === "current" || finalStatus === "planned") return finalStatus;
  if (finalStatus === "completed") return "completed_current";
  return "missing";
}

async function coverageFromSelectedProduct(params: { productId: string | null; bundleKey: string }): Promise<number> {
  if (!params.productId) return 0;
  const requirements = await prisma.bundleCoverageRequirement.findMany({
    where: { bundleKey: params.bundleKey, isRequired: true },
    select: { biomarkerNormalizedName: true },
  });
  if (requirements.length === 0) return 1;

  const product = await prisma.catalogProduct.findFirst({
    where: { id: params.productId },
    select: { biomarkers: { select: { biomarker: { select: { normalizedName: true, name: true } } } } },
  });
  const covered = new Set<string>();
  for (const b of product?.biomarkers ?? []) {
    const norm = b.biomarker?.normalizedName ? normalizeBiomarkerName(b.biomarker.normalizedName) : b.biomarker?.name ? normalizeBiomarkerName(b.biomarker.name) : null;
    if (norm) covered.add(norm);
  }
  const required = requirements.map((r) => r.biomarkerNormalizedName);
  const hit = required.filter((r) => covered.has(r)).length;
  return required.length ? Math.min(1, hit / required.length) : 1;
}

function coverageFromEvidencePayload(bundleKey: string, payload: any, required: string[]): number {
  if (required.length === 0) return 1;
  const covered = new Set<string>();
  if (Array.isArray(payload?.biomarkers)) {
    for (const x of payload.biomarkers) if (typeof x === "string") covered.add(normalizeBiomarkerName(x));
  } else if (payload && typeof payload === "object") {
    for (const k of Object.keys(payload)) covered.add(normalizeBiomarkerName(k));
  }
  const hit = required.filter((r) => covered.has(r)).length;
  return required.length ? Math.min(1, hit / required.length) : 1;
}

export async function calculateHealthScore(params: { userEmail: string; policyKey?: string }): Promise<HealthScoreOutput & { profileSnapshotId: string }> {
  const policyKey = (params.policyKey ?? HEALTH_SCORE_POLICY_KEY) as string;
  const { policyId } = await ensureHealthScoreSeed();

  const policy = await prisma.healthScorePolicy.findUnique({
    where: { policyKey },
    select: { id: true, policyKey: true, statusWeights: true, relevanceThreshold: true },
  });
  if (!policy) throw new Error("Health score policy not found");

  const snap = await prisma.profileSnapshot.findFirst({
    where: { userEmail: params.userEmail, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userEmail: true,
      ageGroup: true,
      lifeStage: true,
      goalFlags: true,
      riskFlags: true,
      conditionFlags: true,
      familyHistoryFlags: true,
      medicationFlags: true,
      lifestyleFlags: true,
    },
  });
  if (!snap) throw new Error("No active profile snapshot");

  // Recommended bundles: prefer recommendation instances if present for this snapshot.
  const instances = await prisma.recommendationInstance.findMany({
    where: { userEmail: params.userEmail, profileSnapshotId: snap.id, active: true },
    select: { id: true, bundleKey: true },
    take: 200,
  });

  const recommendedBundles =
    instances.length > 0 ? uniq(instances.map((i) => i.bundleKey)) : inferRecommendedBundlesFromProfile(snap);

  // Parallelise all independent bulk queries — saves 400-600ms.
  const [weights, allFactors, statusRows, evidenceRows, progressRows, requiredRows, suppressionRules] =
    await Promise.all([
      prisma.bundleWeightPolicy.findMany({
        where: { policyId: policy.id, bundleKey: { in: recommendedBundles } },
        select: { bundleKey: true, baseWeight: true },
      }),
      prisma.bundleRelevanceFactor.findMany({
        where: { bundleKey: { in: recommendedBundles } },
        select: { bundleKey: true, factorType: true, factorKey: true, weightDelta: true },
      }),
      prisma.statusSnapshot.findMany({
        where: { userEmail: params.userEmail, bundleKey: { in: recommendedBundles } },
        orderBy: [{ calculatedAt: "desc" }],
        take: 500,
        select: { bundleKey: true, finalStatus: true, calculatedAt: true, evidenceDateUsed: true },
      }),
      prisma.userTestEvidence.findMany({
        where: { userEmail: params.userEmail, bundleKey: { in: recommendedBundles } },
        orderBy: [{ createdAt: "desc" }],
        take: 200,
        select: { bundleKey: true, biomarkerPayload: true, createdAt: true },
      }),
      prisma.recommendationProgress.findMany({
        where: { userEmail: params.userEmail, bundleKey: { in: recommendedBundles } },
        select: { bundleKey: true, selectedProductId: true },
        take: 200,
      }),
      prisma.bundleCoverageRequirement.findMany({
        where: { bundleKey: { in: recommendedBundles }, isRequired: true },
        select: { bundleKey: true, biomarkerNormalizedName: true },
      }),
      prisma.bundleSuppressionRule.findMany({
        where: { active: true, primaryBundleKey: { in: recommendedBundles }, suppressedBundleKey: { in: recommendedBundles } },
        select: { primaryBundleKey: true, suppressedBundleKey: true, conditionJson: true },
        take: 50,
      }),
    ]);

  const baseWeightByBundle = new Map<string, number>(weights.map((w) => [w.bundleKey, toNum(w.baseWeight)]));

  const factorsByBundle = new Map<string, Array<{ type: string; key: string; delta: number }>>();
  for (const f of allFactors) {
    const arr = factorsByBundle.get(f.bundleKey) ?? [];
    arr.push({ type: f.factorType, key: f.factorKey, delta: toNum(f.weightDelta) });
    factorsByBundle.set(f.bundleKey, arr);
  }

  const statusByBundle = new Map<string, HealthScoreBundleStatus>();
  for (const r of statusRows) {
    if (statusByBundle.has(r.bundleKey)) continue;
    statusByBundle.set(r.bundleKey, statusFromEngineC(r.finalStatus));
  }

  const evidenceByBundle = new Map<string, any>();
  for (const e of evidenceRows) {
    if (evidenceByBundle.has(e.bundleKey)) continue;
    evidenceByBundle.set(e.bundleKey, e.biomarkerPayload);
  }

  const selectedProductByBundle = new Map<string, string | null>(
    progressRows.map((p) => [p.bundleKey, p.selectedProductId ?? null]),
  );

  const requiredByBundle = new Map<string, string[]>();
  for (const r of requiredRows) {
    const arr = requiredByBundle.get(r.bundleKey) ?? [];
    arr.push(r.biomarkerNormalizedName);
    requiredByBundle.set(r.bundleKey, arr);
  }

  const statusWeights = policy.statusWeights as any;
  const multiplierFor = (status: HealthScoreBundleStatus) => {
    if (status === "suppressed" || status === "optional") return 0;
    return toNum(statusWeights?.[status] ?? statusWeights?.[status === "completed_current" ? "completed_current" : status] ?? 0);
  };

  // Pre-load all selected products for "planned" bundles in one query — eliminates N+1 in the scoring loop.
  const plannedProductIds = uniq(
    recommendedBundles
      .filter((b) => (statusByBundle.get(b) ?? "missing") === "planned")
      .map((b) => selectedProductByBundle.get(b))
      .filter((id): id is string => Boolean(id)),
  );
  const productRows = plannedProductIds.length
    ? await prisma.catalogProduct.findMany({
        where: { id: { in: plannedProductIds } },
        select: { id: true, biomarkers: { select: { biomarker: { select: { normalizedName: true, name: true } } } } },
      })
    : [];
  const productBiomarkersById = new Map<string, Set<string>>();
  for (const prod of productRows) {
    const covered = new Set<string>();
    for (const b of prod.biomarkers ?? []) {
      const norm = b.biomarker?.normalizedName
        ? normalizeBiomarkerName(b.biomarker.normalizedName)
        : b.biomarker?.name
          ? normalizeBiomarkerName(b.biomarker.name)
          : null;
      if (norm) covered.add(norm);
    }
    productBiomarkersById.set(prod.id, covered);
  }

  const coverageFromProductId = (productId: string | null | undefined, bundleKey: string): number => {
    if (!productId) return 0;
    const covered = productBiomarkersById.get(productId);
    if (!covered) return 0;
    const required = requiredByBundle.get(bundleKey) ?? [];
    if (required.length === 0) return 1;
    const hit = required.filter((r) => covered.has(r)).length;
    return Math.min(1, hit / required.length);
  };
  const suppressed = new Set<string>();
  for (const r of suppressionRules) {
    const cond = r.conditionJson as any;
    const primaryStatus = statusByBundle.get(r.primaryBundleKey) ?? "missing";
    const allowed = Array.isArray(cond?.when_primary_status_in) ? cond.when_primary_status_in : [];
    if (allowed.includes(primaryStatus)) suppressed.add(r.suppressedBundleKey);
  }

  let numerator_total = 0;
  let denominator_total = 0;
  const breakdown: BundleBreakdown[] = [];

  for (const bundleKey of recommendedBundles) {
    if (suppressed.has(bundleKey)) {
      breakdown.push({
        bundle_key: bundleKey,
        status: "suppressed",
        base_weight: baseWeightByBundle.get(bundleKey) ?? 0,
        relevance_weight: 1,
        status_multiplier: 0,
        coverage_ratio: 0,
        denominator_weight: 0,
        numerator_value: 0,
        rationale: ["suppressed_by_policy"],
      });
      continue;
    }

    const base_weight = baseWeightByBundle.get(bundleKey) ?? 0;
    const status = statusByBundle.get(bundleKey) ?? "missing";
    const status_multiplier = multiplierFor(status);

    // relevance multiplier: 1 + sum(deltaSteps)*0.1
    const matched: string[] = [];
    let deltaSteps = 0;
    const factors = factorsByBundle.get(bundleKey) ?? [];
    const profileKeysByType: Record<string, string[]> = {
      symptom: (snap.riskFlags as any) ?? [],
      lifestyle: (snap.lifestyleFlags as any) ?? [],
      condition: (snap.conditionFlags as any) ?? [],
      family_history: (snap.familyHistoryFlags as any) ?? [],
      medication: (snap.medicationFlags as any) ?? [],
      goal: (snap.goalFlags as any) ?? [],
      life_stage: snap.lifeStage ? [snap.lifeStage] : [],
      age_group: snap.ageGroup ? [snap.ageGroup] : [],
    };
    for (const f of factors) {
      const keys = profileKeysByType[f.type] ?? [];
      if (keys.includes(f.key)) {
        deltaSteps += f.delta;
        matched.push(`${f.type}:${f.key}`);
      }
    }
    const relevance_weight = Math.max(1, 1 + deltaSteps * 0.1);

    const required = requiredByBundle.get(bundleKey) ?? [];
    let coverage_ratio = 0;
    if (status === "planned") {
      coverage_ratio = coverageFromProductId(selectedProductByBundle.get(bundleKey), bundleKey);
    } else if (status === "current" || status === "completed_current" || status === "outdated") {
      const payload = evidenceByBundle.get(bundleKey);
      coverage_ratio = coverageFromEvidencePayload(bundleKey, payload, required);
      // Fallback when evidence exists but biomarker payload is empty/unavailable.
      if (coverage_ratio === 0) coverage_ratio = required.length ? 0.5 : 1;
    } else {
      // For "missing" we still want the status multiplier (0.2) to matter.
      // Treat missing as "0% current coverage but 100% relevant bundle surface area".
      // This aligns with the weighted_completion_v1 policy semantics.
      coverage_ratio = 1;
    }
    coverage_ratio = Math.max(0, Math.min(1, coverage_ratio));

    const denominator_weight = base_weight * relevance_weight;
    const numerator_value = denominator_weight * status_multiplier * coverage_ratio;

    // Exclusions: optional and suppressed are already handled. Also allow policy relevance threshold (default 1.0).
    const include = relevance_weight >= toNum(policy.relevanceThreshold);
    if (include) {
      denominator_total += denominator_weight;
      numerator_total += numerator_value;
    }

    breakdown.push({
      bundle_key: bundleKey,
      status,
      base_weight,
      relevance_weight,
      status_multiplier,
      coverage_ratio,
      denominator_weight: include ? denominator_weight : 0,
      numerator_value: include ? numerator_value : 0,
      rationale: matched.length ? matched : ["baseline"],
    });
  }

  const score = denominator_total > 0 ? Math.round((numerator_total / denominator_total) * 100) : 0;
  const band = scoreBand(score);

  const top_gaps = breakdown
    .filter((b) => b.denominator_weight > 0 && (b.status === "missing" || b.status === "outdated"))
    .sort((a, b) => b.denominator_weight - a.denominator_weight)
    .slice(0, 5)
    .map((b) => b.bundle_key);

  return {
    profileSnapshotId: snap.id,
    score,
    method: HEALTH_SCORE_POLICY_KEY,
    band,
    numerator_total,
    denominator_total,
    bundle_count: breakdown.filter((b) => b.denominator_weight > 0).length,
    top_gaps,
    bundle_breakdown: breakdown,
  };
}


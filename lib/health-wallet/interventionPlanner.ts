/**
 * Intervention planner — TypeScript port of workers/intervention_planner.py
 * Computes care gap flags from health_observations and upserts to care_gap_flags.
 * Pure logic + Prisma, no external API.
 */

import { getPrisma } from "@/lib/db";

// ── Screening interval registry ───────────────────────────────────────────────
// Ported from workers/screening_intervals.py

interface IntervalConfig {
  interval_days: number;
  due_soon_days: number;
  label: string;
  suggested_action: string;
  guideline_source: string;
  category: string;
  priority: "routine" | "surveillance" | "urgent";
}

const METRIC_INTERVALS: Record<string, IntervalConfig> = {
  hemoglobin:            { interval_days: 365, due_soon_days: 30, label: "Hemoglobin", suggested_action: "Request a CBC including hemoglobin measurement.", guideline_source: "General preventive care", category: "haematology", priority: "routine" },
  wbc:                   { interval_days: 365, due_soon_days: 30, label: "Complete Blood Count", suggested_action: "Schedule a routine CBC with your GP.", guideline_source: "General preventive care", category: "haematology", priority: "routine" },
  ferritin:              { interval_days: 365, due_soon_days: 30, label: "Ferritin / Iron Stores", suggested_action: "Repeat ferritin test to monitor iron stores.", guideline_source: "Iron deficiency monitoring guidelines", category: "iron", priority: "surveillance" },
  serum_iron:            { interval_days: 365, due_soon_days: 30, label: "Serum Iron Panel", suggested_action: "Repeat iron panel (serum iron, TIBC, transferrin saturation).", guideline_source: "Iron deficiency monitoring guidelines", category: "iron", priority: "surveillance" },
  transferrin_saturation:{ interval_days: 365, due_soon_days: 30, label: "Transferrin Saturation", suggested_action: "Repeat iron saturation assessment.", guideline_source: "Iron deficiency monitoring guidelines", category: "iron", priority: "surveillance" },
  hba1c:                 { interval_days: 180, due_soon_days: 30, label: "HbA1c (Glycated Hemoglobin)", suggested_action: "Schedule HbA1c test to assess blood sugar control.", guideline_source: "ADA Standards of Medical Care in Diabetes", category: "metabolic", priority: "surveillance" },
  glucose:               { interval_days: 365, due_soon_days: 30, label: "Fasting Glucose", suggested_action: "Request fasting blood glucose as part of metabolic panel.", guideline_source: "ADA / USPSTF Diabetes Screening", category: "metabolic", priority: "routine" },
  creatinine:            { interval_days: 365, due_soon_days: 30, label: "Creatinine / Kidney Function", suggested_action: "Repeat creatinine and eGFR as part of CMP.", guideline_source: "KDIGO kidney health guidelines", category: "metabolic", priority: "routine" },
  egfr:                  { interval_days: 365, due_soon_days: 30, label: "eGFR (Kidney Filtration Rate)", suggested_action: "Repeat eGFR to monitor kidney function trend.", guideline_source: "KDIGO CKD Evaluation Guidelines", category: "metabolic", priority: "surveillance" },
  alt:                   { interval_days: 365, due_soon_days: 30, label: "Liver Function (ALT)", suggested_action: "Repeat liver function tests (ALT, AST, ALP).", guideline_source: "General preventive care", category: "metabolic", priority: "routine" },
  total_cholesterol:     { interval_days: 365, due_soon_days: 30, label: "Lipid Panel", suggested_action: "Schedule a fasting lipid panel (total, LDL, HDL, triglycerides).", guideline_source: "AHA/ACC Cardiovascular Risk Guidelines", category: "lipids", priority: "routine" },
  ldl_cholesterol:       { interval_days: 365, due_soon_days: 30, label: "LDL Cholesterol", suggested_action: "Repeat LDL cholesterol as part of lipid panel.", guideline_source: "AHA/ACC Cardiovascular Risk Guidelines", category: "lipids", priority: "surveillance" },
  triglycerides:         { interval_days: 365, due_soon_days: 30, label: "Triglycerides", suggested_action: "Repeat fasting triglycerides with lipid panel.", guideline_source: "AHA/ACC Cardiovascular Risk Guidelines", category: "lipids", priority: "routine" },
  tsh:                   { interval_days: 365, due_soon_days: 30, label: "Thyroid Function (TSH)", suggested_action: "Schedule TSH test with your GP for thyroid function check.", guideline_source: "ATA Thyroid Disease Guidelines", category: "thyroid", priority: "surveillance" },
  free_t4:               { interval_days: 365, due_soon_days: 30, label: "Free T4 (Thyroxine)", suggested_action: "Repeat Free T4 alongside TSH for full thyroid assessment.", guideline_source: "ATA Thyroid Disease Guidelines", category: "thyroid", priority: "surveillance" },
  anti_tpo:              { interval_days: 730, due_soon_days: 45, label: "Anti-TPO Antibodies", suggested_action: "Repeat anti-TPO antibody test to monitor autoimmune thyroid activity.", guideline_source: "ATA Hashimoto's Thyroiditis Guidelines", category: "thyroid", priority: "surveillance" },
  vitamin_d:             { interval_days: 365, due_soon_days: 30, label: "Vitamin D (25-OH)", suggested_action: "Repeat Vitamin D test to assess sufficiency and supplementation response.", guideline_source: "Endocrine Society Vitamin D Guidelines", category: "vitamins", priority: "routine" },
  vitamin_b12:           { interval_days: 365, due_soon_days: 30, label: "Vitamin B12", suggested_action: "Repeat B12 level — especially important if vegetarian/vegan or on metformin.", guideline_source: "General preventive care", category: "vitamins", priority: "routine" },
  folate:                { interval_days: 365, due_soon_days: 30, label: "Folate", suggested_action: "Repeat folate level, particularly if planning pregnancy.", guideline_source: "USPSTF Folic Acid Supplementation", category: "vitamins", priority: "routine" },
  crp:                   { interval_days: 365, due_soon_days: 30, label: "C-Reactive Protein (CRP / hs-CRP)", suggested_action: "Repeat hs-CRP to track systemic inflammation trend.", guideline_source: "AHA hs-CRP Cardiovascular Risk Assessment", category: "inflammation", priority: "surveillance" },
  estradiol:             { interval_days: 365, due_soon_days: 30, label: "Estradiol (E2)", suggested_action: "Repeat estradiol during cycle day 2–5 (follicular phase) for accurate baseline.", guideline_source: "ACOG Menopause Guidelines", category: "hormones", priority: "surveillance" },
  fsh:                   { interval_days: 365, due_soon_days: 30, label: "Follicle-Stimulating Hormone (FSH)", suggested_action: "Repeat FSH (ideally day 2–3 of cycle) to assess ovarian reserve and menopause status.", guideline_source: "ACOG / ESHRE Fertility Guidelines", category: "hormones", priority: "surveillance" },
  lh:                    { interval_days: 365, due_soon_days: 30, label: "Luteinizing Hormone (LH)", suggested_action: "Repeat LH to assess pituitary-ovarian axis.", guideline_source: "ACOG / ESHRE Fertility Guidelines", category: "hormones", priority: "surveillance" },
  progesterone:          { interval_days: 365, due_soon_days: 30, label: "Progesterone", suggested_action: "Repeat progesterone (ideally day 21 of cycle) to confirm ovulation.", guideline_source: "ACOG Reproductive Endocrinology Guidelines", category: "hormones", priority: "surveillance" },
  amh:                   { interval_days: 365, due_soon_days: 45, label: "Anti-Müllerian Hormone (AMH / Ovarian Reserve)", suggested_action: "Repeat AMH to monitor ovarian reserve trajectory.", guideline_source: "ESHRE Ovarian Reserve Guidelines", category: "hormones", priority: "surveillance" },
  testosterone_total:    { interval_days: 365, due_soon_days: 30, label: "Total Testosterone", suggested_action: "Repeat total testosterone and free testosterone panel.", guideline_source: "Endocrine Society Androgen Deficiency Guidelines", category: "hormones", priority: "surveillance" },
  dhea_s:                { interval_days: 365, due_soon_days: 30, label: "DHEA-S", suggested_action: "Repeat DHEA-S to track adrenal androgen levels.", guideline_source: "Endocrine Society Adrenal Guidelines", category: "hormones", priority: "surveillance" },
  prolactin:             { interval_days: 365, due_soon_days: 30, label: "Prolactin", suggested_action: "Repeat prolactin — draw in the morning, fasting, without breast stimulation.", guideline_source: "Endocrine Society Hyperprolactinemia Guidelines", category: "hormones", priority: "surveillance" },
  cortisol:              { interval_days: 365, due_soon_days: 30, label: "Cortisol (Morning)", suggested_action: "Repeat morning cortisol (8–9am, fasting) to assess adrenal function.", guideline_source: "Endocrine Society Adrenal Insufficiency Guidelines", category: "hormones", priority: "surveillance" },
  bi_rads:               { interval_days: 365, due_soon_days: 45, label: "Mammogram / BI-RADS Score", suggested_action: "Schedule your next mammogram. Women 40–74 should screen annually.", guideline_source: "ACR / USPSTF Breast Cancer Screening Guidelines", category: "imaging_score", priority: "surveillance" },
  dexa_t_score:          { interval_days: 730, due_soon_days: 60, label: "Bone Density (DEXA / T-score)", suggested_action: "Schedule DEXA bone density scan — recommended every 1–2 years for at-risk women.", guideline_source: "NOF / ISCD Osteoporosis Guidelines", category: "imaging_score", priority: "surveillance" },
  ca125:                 { interval_days: 365, due_soon_days: 45, label: "CA-125 (Ovarian Cancer Marker)", suggested_action: "Repeat CA-125 with pelvic ultrasound if clinically indicated.", guideline_source: "SGO / ACOG Ovarian Cancer Surveillance Guidelines", category: "oncology", priority: "surveillance" },
  ca153:                 { interval_days: 180, due_soon_days: 30, label: "CA 15-3 (Breast Cancer Marker)", suggested_action: "Repeat CA 15-3 as part of breast cancer monitoring.", guideline_source: "ASCO Breast Cancer Tumor Markers Guidelines", category: "oncology", priority: "urgent" },
  cea:                   { interval_days: 180, due_soon_days: 30, label: "CEA (Carcinoembryonic Antigen)", suggested_action: "Repeat CEA as part of cancer monitoring protocol.", guideline_source: "ASCO Colorectal Cancer Surveillance Guidelines", category: "oncology", priority: "urgent" },
  psa:                   { interval_days: 365, due_soon_days: 45, label: "PSA", suggested_action: "Repeat PSA as part of prostate cancer monitoring.", guideline_source: "USPSTF / AUA Prostate Cancer Screening Guidelines", category: "oncology", priority: "surveillance" },
  phq9:                  { interval_days: 180, due_soon_days: 30, label: "PHQ-9 (Depression Screen)", suggested_action: "Schedule a mental health check-in with your GP or therapist.", guideline_source: "USPSTF Depression Screening Guidelines", category: "mental_health", priority: "surveillance" },
};

const CATEGORY_INTERVALS: Record<string, IntervalConfig> = {
  haematology:     { interval_days: 365, due_soon_days: 30, label: "Blood Count Panel", suggested_action: "Schedule a routine complete blood count (CBC).", guideline_source: "General preventive care", category: "haematology", priority: "routine" },
  metabolic:       { interval_days: 365, due_soon_days: 30, label: "Metabolic Panel", suggested_action: "Schedule a comprehensive metabolic panel (CMP).", guideline_source: "General preventive care", category: "metabolic", priority: "routine" },
  lipids:          { interval_days: 365, due_soon_days: 30, label: "Lipid Panel", suggested_action: "Schedule a fasting lipid panel.", guideline_source: "AHA/ACC Cardiovascular Risk Guidelines", category: "lipids", priority: "routine" },
  thyroid:         { interval_days: 365, due_soon_days: 30, label: "Thyroid Function Panel", suggested_action: "Schedule thyroid function tests (TSH, Free T4).", guideline_source: "ATA Thyroid Disease Guidelines", category: "thyroid", priority: "surveillance" },
  iron:            { interval_days: 365, due_soon_days: 30, label: "Iron Panel", suggested_action: "Repeat iron studies (ferritin, serum iron, TIBC).", guideline_source: "Iron deficiency monitoring guidelines", category: "iron", priority: "surveillance" },
  vitamins:        { interval_days: 365, due_soon_days: 30, label: "Vitamin / Micronutrient Panel", suggested_action: "Repeat key vitamin and mineral levels.", guideline_source: "General preventive care", category: "vitamins", priority: "routine" },
  inflammation:    { interval_days: 365, due_soon_days: 30, label: "Inflammatory Markers", suggested_action: "Repeat inflammatory markers (CRP, ESR).", guideline_source: "General preventive care", category: "inflammation", priority: "surveillance" },
  hormones:        { interval_days: 365, due_soon_days: 30, label: "Hormone Panel", suggested_action: "Schedule a comprehensive hormone panel with your specialist.", guideline_source: "Endocrine Society Guidelines", category: "hormones", priority: "surveillance" },
  cardiac:         { interval_days: 365, due_soon_days: 30, label: "Cardiac Markers", suggested_action: "Repeat cardiac markers as directed by your cardiologist.", guideline_source: "AHA Cardiovascular Guidelines", category: "cardiac", priority: "surveillance" },
  oncology:        { interval_days: 180, due_soon_days: 45, label: "Oncology / Tumour Markers", suggested_action: "Schedule repeat tumour marker testing as part of your oncology follow-up.", guideline_source: "ASCO Surveillance Guidelines", category: "oncology", priority: "urgent" },
  imaging_score:   { interval_days: 365, due_soon_days: 45, label: "Imaging / Screening Scan", suggested_action: "Schedule your next screening scan.", guideline_source: "USPSTF Preventive Services Guidelines", category: "imaging_score", priority: "surveillance" },
  mental_health:   { interval_days: 180, due_soon_days: 30, label: "Mental Health Assessment", suggested_action: "Schedule a mental health check-in with your GP or therapist.", guideline_source: "USPSTF Depression Screening Guidelines", category: "mental_health", priority: "surveillance" },
  other:           { interval_days: 365, due_soon_days: 30, label: "Health Check", suggested_action: "Schedule a follow-up with your healthcare provider.", guideline_source: "General preventive care", category: "other", priority: "routine" },
};

function getInterval(metricName: string, category: string): IntervalConfig | null {
  return METRIC_INTERVALS[metricName] ?? CATEGORY_INTERVALS[category] ?? null;
}

// ── Gap computation ──────────────────────────────────────────────────────────

type GapStatus = "never_recorded" | "overdue" | "due_soon" | "current";

interface CareGapFlag {
  canonicalMetricName: string;
  category: string;
  label: string;
  gapStatus: GapStatus;
  priority: string;
  lastObservedDate: Date | null;
  expectedIntervalDays: number;
  nextExpectedDate: Date | null;
  daysOverdue: number | null;
  daysUntilDue: number | null;
  suggestedAction: string;
  guidelineSource: string;
}

function computeGap(
  metricName: string,
  category: string,
  lastDate: Date | null,
  today: Date,
  cfg: IntervalConfig
): CareGapFlag {
  if (!lastDate) {
    return {
      canonicalMetricName: metricName,
      category: cfg.category,
      label: cfg.label,
      gapStatus: "never_recorded",
      priority: cfg.priority,
      lastObservedDate: null,
      expectedIntervalDays: cfg.interval_days,
      nextExpectedDate: null,
      daysOverdue: null,
      daysUntilDue: null,
      suggestedAction: cfg.suggested_action,
      guidelineSource: cfg.guideline_source,
    };
  }

  const nextExpected = new Date(lastDate.getTime() + cfg.interval_days * 86400000);
  const delta = Math.round((nextExpected.getTime() - today.getTime()) / 86400000);

  let gapStatus: GapStatus;
  let daysOverdue: number | null = null;
  let daysUntilDue: number | null = null;

  if (delta < 0) {
    gapStatus = "overdue";
    daysOverdue = Math.abs(delta);
  } else if (delta <= cfg.due_soon_days) {
    gapStatus = "due_soon";
    daysUntilDue = delta;
  } else {
    gapStatus = "current";
    daysUntilDue = delta;
  }

  return {
    canonicalMetricName: metricName,
    category: cfg.category,
    label: cfg.label,
    gapStatus,
    priority: cfg.priority,
    lastObservedDate: lastDate,
    expectedIntervalDays: cfg.interval_days,
    nextExpectedDate: nextExpected,
    daysOverdue,
    daysUntilDue,
    suggestedAction: cfg.suggested_action,
    guidelineSource: cfg.guideline_source,
  };
}

// ── Public planner ────────────────────────────────────────────────────────────

export interface PlannerResult {
  careGapFlags: CareGapFlag[];
  suggestedFollowups: CareGapFlag[];
  nextExpectedIntervention: CareGapFlag | null;
  totalComputed: number;
}

export async function planInterventions(userEmail: string): Promise<PlannerResult> {
  const prisma = getPrisma();

  // Get last observed date per canonical metric name
  const rawObs = await prisma.healthObservation.findMany({
    where: { userEmail, canonicalMetricName: { not: null }, observationDate: { not: null } },
    select: { canonicalMetricName: true, category: true, observationDate: true },
    orderBy: { observationDate: "desc" },
  });

  // Build map: canonicalMetricName → { lastDate, category }
  const observed = new Map<string, { lastDate: Date; category: string }>();
  for (const row of rawObs) {
    if (!row.canonicalMetricName || !row.observationDate) continue;
    if (!observed.has(row.canonicalMetricName)) {
      observed.set(row.canonicalMetricName, {
        lastDate: row.observationDate,
        category: row.category ?? "other",
      });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allFlags: CareGapFlag[] = [];
  const seenMetrics = new Set<string>();

  // Evaluate all metrics in registry
  for (const [metricName, cfg] of Object.entries(METRIC_INTERVALS)) {
    seenMetrics.add(metricName);
    const obs = observed.get(metricName);
    allFlags.push(
      computeGap(metricName, obs?.category ?? cfg.category, obs?.lastDate ?? null, today, cfg)
    );
  }

  // Also evaluate observed metrics NOT in registry (fallback to category)
  for (const [metricName, obs] of observed.entries()) {
    if (seenMetrics.has(metricName)) continue;
    const cfg = getInterval(metricName, obs.category);
    if (!cfg) continue;
    allFlags.push(computeGap(metricName, obs.category, obs.lastDate, today, cfg));
  }

  // Upsert to care_gap_flags
  for (const flag of allFlags) {
    try {
      await prisma.careGapFlag.upsert({
        where: {
          care_gap_flags_user_metric_key: {
            userEmail,
            canonicalMetricName: flag.canonicalMetricName,
          },
        },
        create: {
          userEmail,
          canonicalMetricName: flag.canonicalMetricName,
          category: flag.category,
          label: flag.label,
          gapStatus: flag.gapStatus,
          priority: flag.priority,
          lastObservedDate: flag.lastObservedDate,
          expectedIntervalDays: flag.expectedIntervalDays,
          nextExpectedDate: flag.nextExpectedDate,
          daysOverdue: flag.daysOverdue,
          daysUntilDue: flag.daysUntilDue,
          suggestedAction: flag.suggestedAction,
          guidelineSource: flag.guidelineSource,
        },
        update: {
          category: flag.category,
          label: flag.label,
          gapStatus: flag.gapStatus,
          priority: flag.priority,
          lastObservedDate: flag.lastObservedDate,
          expectedIntervalDays: flag.expectedIntervalDays,
          nextExpectedDate: flag.nextExpectedDate,
          daysOverdue: flag.daysOverdue,
          daysUntilDue: flag.daysUntilDue,
          suggestedAction: flag.suggestedAction,
          guidelineSource: flag.guidelineSource,
          computedAt: new Date(),
        },
      });
    } catch {
      // Non-critical — skip upsert errors silently
    }
  }

  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, surveillance: 1, routine: 2 };
  const STATUS_ORDER: Record<string, number> = { overdue: 0, never_recorded: 1, due_soon: 2, current: 3 };

  const sortKey = (f: CareGapFlag) =>
    (PRIORITY_ORDER[f.priority] ?? 9) * 10 + (STATUS_ORDER[f.gapStatus] ?? 9);

  allFlags.sort((a, b) => sortKey(a) - sortKey(b));

  const careGapFlags = allFlags.filter((f) => f.gapStatus === "overdue" || f.gapStatus === "never_recorded");
  const suggestedFollowups = allFlags.filter((f) => f.gapStatus === "due_soon");
  const actionable = allFlags.filter((f) => f.gapStatus === "overdue" || f.gapStatus === "due_soon");
  const nextExpectedIntervention = actionable[0] ?? null;

  return { careGapFlags, suggestedFollowups, nextExpectedIntervention, totalComputed: allFlags.length };
}

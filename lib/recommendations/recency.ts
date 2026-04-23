import type { BundleKey, BundleStatus, RecencyEnum } from "@/lib/recommendations/types";

export type IntervalPolicy = {
  bundle: BundleKey;
  // Default interval months when nothing special applies.
  default_interval_months: number | null;
  // More strict interval if strong context applies.
  strict_interval_months?: number;
  strict_when?: (ctx: {
    risk_flags: string[];
    condition_flags: string[];
    medication_flags: string[];
    family_history_flags: string[];
  }) => boolean;
  // Bundles that are symptom-driven: keep status optional if no score signal.
  symptom_driven?: boolean;
};

export const INTERVAL_POLICIES: IntervalPolicy[] = [
  { bundle: "vitamin_d", default_interval_months: 12 },
  {
    bundle: "iron_status",
    default_interval_months: 12,
    strict_interval_months: 6,
    strict_when: (c) => c.risk_flags.includes("fatigue") || c.risk_flags.includes("heavy_periods") || c.condition_flags.includes("iron_deficiency_history") || c.medication_flags.includes("on_iron_supplement"),
  },
  { bundle: "b12_folate", default_interval_months: 12 },
  {
    bundle: "thyroid_basic",
    default_interval_months: 12,
    strict_interval_months: 6,
    strict_when: (c) => c.risk_flags.includes("fatigue") || c.risk_flags.includes("weight_gain") || c.family_history_flags.includes("fh_thyroid") || c.condition_flags.includes("thyroid_disorder"),
  },
  {
    bundle: "thyroid_extended",
    default_interval_months: 12,
    strict_interval_months: 6,
    strict_when: (c) => c.condition_flags.includes("thyroid_disorder") || c.medication_flags.includes("on_thyroid_medication"),
  },
  { bundle: "lipid_panel", default_interval_months: 12 },
  {
    bundle: "glucose_metabolic",
    default_interval_months: 12,
    strict_interval_months: 6,
    strict_when: (c) => c.condition_flags.includes("prediabetes_or_ir") || c.condition_flags.includes("diabetes") || c.family_history_flags.includes("fh_diabetes"),
  },
  { bundle: "stress_cortisol", default_interval_months: null, symptom_driven: true },
  { bundle: "female_hormone_balance", default_interval_months: 12, symptom_driven: true },
  { bundle: "fertility_reserve", default_interval_months: null, symptom_driven: true },
  { bundle: "androgen_balance", default_interval_months: null, symptom_driven: true },
  { bundle: "liver_function", default_interval_months: 12 },
  {
    bundle: "kidney_function",
    default_interval_months: 12,
    strict_interval_months: 6,
    strict_when: (c) => c.condition_flags.includes("diabetes"),
  },
  { bundle: "inflammation_basic", default_interval_months: 12 },
  { bundle: "omega3_status", default_interval_months: 12 },
  { bundle: "magnesium_status", default_interval_months: 12, symptom_driven: true },
  { bundle: "iodine_status", default_interval_months: 12, symptom_driven: true },
  { bundle: "gut_health_basic", default_interval_months: null, symptom_driven: true },
  { bundle: "sti_panel", default_interval_months: null, symptom_driven: true },
  { bundle: "comprehensive_preventive", default_interval_months: 12 },
];

export function recencyToMonths(v: RecencyEnum): number {
  if (v === "lt_3m") return 1.5;
  if (v === "3_6m") return 4.5;
  if (v === "6_12m") return 9;
  return 18;
}

export function resolveStatusAndRecencyAdjustment(params: {
  bundle: BundleKey;
  last_test: RecencyEnum | null;
  ctx: { risk_flags: string[]; condition_flags: string[]; medication_flags: string[]; family_history_flags: string[] };
}): { status: BundleStatus; score_delta: number; reason_code: string } {
  const policy = INTERVAL_POLICIES.find((p) => p.bundle === params.bundle);
  const intervalDefault = policy?.default_interval_months ?? 12;
  const interval =
    policy?.strict_interval_months && policy.strict_when?.(params.ctx)
      ? policy.strict_interval_months
      : intervalDefault;

  // Symptom-driven bundles without periodic policy: don't label "outdated" by time,
  // but allow "missing" if never checked (null) and likely relevant.
  if (interval == null) {
    if (params.last_test == null) return { status: "missing", score_delta: 30, reason_code: "no_recent_test" };
    // If present, treat as current and slightly dampen (still may show if score is high)
    return { status: "current", score_delta: -10, reason_code: "recent_test" };
  }

  if (params.last_test == null) return { status: "missing", score_delta: 30, reason_code: "no_recent_test" };
  const months = recencyToMonths(params.last_test);
  if (months <= interval) return { status: "current", score_delta: -15, reason_code: "recent_test" };
  return { status: "outdated", score_delta: 20, reason_code: "last_test_old" };
}


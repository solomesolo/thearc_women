import type { BundleKey, RawQuestionnaireAnswers, RecencyEnum, RecencyHint } from "@/lib/profile-engine-a/types";

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function stripNoiseMultiSelect(values: string[] | undefined | null): string[] {
  const v = Array.isArray(values) ? values.filter(Boolean) : [];
  const lower = v.map((s) => String(s));
  if (lower.includes("none") && lower.length > 1) return lower.filter((x) => x !== "none");
  if (lower.includes("prefer_not_to_say") && lower.length > 1)
    return lower.filter((x) => x !== "prefer_not_to_say");
  return lower;
}

export function canonicalizeEnum(value: string | null | undefined): string | null {
  if (!value) return null;
  return String(value).trim();
}

export function normalizeRawAnswers(raw: RawQuestionnaireAnswers): RawQuestionnaireAnswers {
  return {
    ...raw,
    country: canonicalizeEnum(raw.country ?? null) ?? undefined,
    age_range: canonicalizeEnum(raw.age_range ?? null) ?? undefined,
    life_stage: canonicalizeEnum(raw.life_stage ?? null) ?? undefined,
    cycle_pattern: canonicalizeEnum(raw.cycle_pattern ?? null) ?? undefined,
    sun_exposure: canonicalizeEnum(raw.sun_exposure ?? null) ?? undefined,
    goals: stripNoiseMultiSelect(raw.goals),
    symptoms: stripNoiseMultiSelect(raw.symptoms),
    diet_pattern: stripNoiseMultiSelect(raw.diet_pattern),
    lifestyle_context: stripNoiseMultiSelect(raw.lifestyle_context),
    known_conditions: stripNoiseMultiSelect(raw.known_conditions),
    medications_or_hormones: stripNoiseMultiSelect(raw.medications_or_hormones),
    family_history: stripNoiseMultiSelect(raw.family_history),
    last_tests:
      raw.last_tests && typeof raw.last_tests === "object" ? (raw.last_tests as Record<string, string | null>) : undefined,
  };
}

export const LAST_TEST_KEY_TO_BUNDLE: Record<string, BundleKey> = {
  vitamin_d: "vitamin_d",
  iron_ferritin: "iron_status",
  thyroid: "thyroid_basic",
  hba1c: "glucose_metabolic",
  lipids: "lipid_panel",
  hormones: "female_hormone_balance",
};

const RECENCY_VALUE_TO_ENUM: Record<string, RecencyEnum | null> = {
  lt_3m: "lt_3m",
  between_3_6m: "3_6m",
  between_6_12m: "6_12m",
  gt_12m: "gt_12m",
  unknown: null,
};

export function normalizeLastTests(
  lastTests: RawQuestionnaireAnswers["last_tests"] | undefined
): { last_tests: Record<BundleKey, RecencyEnum | null>; recency_hints: Record<BundleKey, RecencyHint> } {
  const out: Record<BundleKey, RecencyEnum | null> = {
    vitamin_d: null,
    iron_status: null,
    b12_folate: null,
    thyroid_basic: null,
    thyroid_extended: null,
    lipid_panel: null,
    glucose_metabolic: null,
    stress_cortisol: null,
    female_hormone_balance: null,
    fertility_reserve: null,
    androgen_balance: null,
    liver_function: null,
    kidney_function: null,
    inflammation_basic: null,
    omega3_status: null,
    magnesium_status: null,
    iodine_status: null,
    gut_health_basic: null,
    sti_panel: null,
    comprehensive_preventive: null,
  };

  if (lastTests && typeof lastTests === "object") {
    for (const [rawKey, rawRecency] of Object.entries(lastTests)) {
      const bundle = LAST_TEST_KEY_TO_BUNDLE[String(rawKey).trim()];
      if (!bundle) continue;
      const normalized = rawRecency == null ? null : RECENCY_VALUE_TO_ENUM[String(rawRecency).trim()] ?? null;
      out[bundle] = normalized;
    }
  }

  const hints: Record<BundleKey, RecencyHint> = Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, recencyHintFor(v)])
  ) as Record<BundleKey, RecencyHint>;

  return { last_tests: out, recency_hints: hints };
}

export function recencyHintFor(v: RecencyEnum | null): RecencyHint {
  if (v == null) return "unknown_or_never";
  if (v === "lt_3m") return "recent";
  if (v === "3_6m") return "moderate";
  if (v === "6_12m") return "aging";
  return "stale";
}


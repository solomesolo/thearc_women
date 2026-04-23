import type { BundleKey } from "@/lib/recommendations/types";

export const ENGINE_B_VERSION = "engine_b_v1";

export const BUNDLES: Array<{ key: BundleKey; display_name: string; category: string; threshold: number }> = [
  { key: "vitamin_d", display_name: "Vitamin D", category: "nutrients", threshold: 25 },
  { key: "iron_status", display_name: "Iron / Ferritin", category: "nutrients", threshold: 25 },
  { key: "b12_folate", display_name: "B12 / Folate", category: "nutrients", threshold: 25 },
  { key: "thyroid_basic", display_name: "Thyroid (TSH)", category: "thyroid", threshold: 25 },
  { key: "thyroid_extended", display_name: "Thyroid (extended)", category: "thyroid", threshold: 25 },
  { key: "lipid_panel", display_name: "Cholesterol / Lipids", category: "metabolic", threshold: 25 },
  { key: "glucose_metabolic", display_name: "Blood sugar (HbA1c)", category: "metabolic", threshold: 25 },
  { key: "stress_cortisol", display_name: "Cortisol", category: "stress_sleep", threshold: 25 },
  { key: "female_hormone_balance", display_name: "Hormones (female balance)", category: "hormones", threshold: 25 },
  { key: "fertility_reserve", display_name: "Fertility reserve (AMH)", category: "fertility", threshold: 25 },
  { key: "androgen_balance", display_name: "Androgen balance", category: "hormones", threshold: 25 },
  { key: "liver_function", display_name: "Liver function", category: "organ_function", threshold: 25 },
  { key: "kidney_function", display_name: "Kidney function", category: "organ_function", threshold: 25 },
  { key: "inflammation_basic", display_name: "Inflammation (hsCRP)", category: "inflammation", threshold: 25 },
  { key: "omega3_status", display_name: "Omega-3", category: "nutrients", threshold: 25 },
  { key: "magnesium_status", display_name: "Magnesium", category: "nutrients", threshold: 25 },
  { key: "iodine_status", display_name: "Iodine", category: "nutrients", threshold: 25 },
  { key: "sti_panel", display_name: "STI panel", category: "sexual_health", threshold: 25 },
  { key: "gut_health_basic", display_name: "Gut health", category: "gut", threshold: 25 },
  { key: "comprehensive_preventive", display_name: "Comprehensive preventive panel", category: "preventive", threshold: 25 },
];

export function bundleMeta(bundle: BundleKey) {
  const m = BUNDLES.find((b) => b.key === bundle);
  if (!m) return { display_name: bundle, category: "other", threshold: 25 };
  return m;
}


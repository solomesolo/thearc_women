// Maps each recommendation bundle key to the primary normalized biomarker name
// used to look up coverage data in biomarker_coverage_ui_content.
// Normalized form: lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '_', 'g'))

export const BUNDLE_BIOMARKER_MAP: Record<string, string> = {
  vitamin_d:               "vitamin_d_25_oh",
  iron_status:             "ferritin",
  b12_folate:              "vitamin_b12_cobalamin",
  thyroid_basic:           "tsh_thyroid_stimulating_hormone",
  thyroid_extended:        "free_t4_ft4",
  lipid_panel:             "total_cholesterol",
  glucose_metabolic:       "hba1c_glycated_hemoglobin",
  stress_cortisol:         "cortisol_morning",
  female_hormone_balance:  "estradiol_e2",
  fertility_reserve:       "amh_anti_mullerian_hormone",
  androgen_balance:        "dhea_s",
  liver_function:          "alt_alanine_aminotransferase",
  kidney_function:         "creatinine",
  inflammation_basic:      "hscrp_high_sensitivity_crp",
  omega3_status:           "omega_3_index",
  magnesium_status:        "magnesium_serum",
  iodine_status:           "iodine_urine",
  sti_panel:               "sti_screening_basic",
  gut_health_basic:        "gut_microbiome_basic",
  comprehensive_preventive: "comprehensive_preventive_panel",
};

export function getBiomarkerKey(bundleKey: string): string | null {
  return BUNDLE_BIOMARKER_MAP[bundleKey] ?? null;
}

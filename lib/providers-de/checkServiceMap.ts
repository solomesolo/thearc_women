// Maps check keys to the service types and biomarker keywords used when
// selecting the best matching products and local providers for a given check.

export interface CheckServiceProfile {
  /** Service type tags to look for in online provider data */
  serviceTypes: string[];
  /** Additional biomarker keywords (supplement the check's own includedTests) */
  extraBiomarkerKeywords: string[];
  /** If true, also suggest IGeL doctors (screenings or physical exams) */
  suggestIgelDoctors: boolean;
  /** If true, suggest online home-test products */
  suggestOnlineProducts: boolean;
  /** If true, suggest local walk-in labs */
  suggestLocalLabs: boolean;
}

const DEFAULT: CheckServiceProfile = {
  serviceTypes:           ["blood_tests"],
  extraBiomarkerKeywords: [],
  suggestIgelDoctors:     false,
  suggestOnlineProducts:  true,
  suggestLocalLabs:       true,
};

const CHECK_SERVICE_MAP: Record<string, CheckServiceProfile> = {
  // ── Broad blood panels ──────────────────────────────────────────────────────
  preventive_baseline: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["cholesterol", "glucose", "thyroid", "ferritin", "vitamin", "TSH", "HbA1c"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  comprehensive_metabolic_panel: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["glucose", "creatinine", "ALT", "AST", "sodium", "potassium"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Cardiovascular / metabolic ─────────────────────────────────────────────
  cardiometabolic_risk: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["cholesterol", "LDL", "HDL", "triglyceride", "HbA1c", "glucose"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  cardiovascular_check: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["cholesterol", "LDL", "HDL", "triglyceride", "lipoprotein"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Iron / blood ───────────────────────────────────────────────────────────
  iron_ferritin: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["ferritin", "iron", "transferrin", "hemoglobin", "CBC"],
    suggestIgelDoctors:     false,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  fatigue_low_energy_panel: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["ferritin", "B12", "vitamin D", "thyroid", "TSH"],
    suggestIgelDoctors:     false,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  anemia_panel: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["hemoglobin", "ferritin", "iron", "RBC", "MCV"],
    suggestIgelDoctors:     false,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Thyroid ────────────────────────────────────────────────────────────────
  thyroid_check: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["TSH", "T3", "T4", "thyroid"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Vitamins / nutrients ───────────────────────────────────────────────────
  vitamin_d_check: {
    serviceTypes:           ["blood_tests", "vitamin_mineral_panels"],
    extraBiomarkerKeywords: ["vitamin D", "25-OH"],
    suggestIgelDoctors:     false,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  vitamin_b12_check: {
    serviceTypes:           ["blood_tests", "vitamin_mineral_panels"],
    extraBiomarkerKeywords: ["B12", "cobalamin", "folate", "folic acid"],
    suggestIgelDoctors:     false,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Hormonal ───────────────────────────────────────────────────────────────
  hormonal_panel: {
    serviceTypes:           ["blood_tests", "hormonal_testing"],
    extraBiomarkerKeywords: ["estradiol", "FSH", "LH", "progesterone", "SHBG", "prolactin", "testosterone"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  perimenopause_panel: {
    serviceTypes:           ["blood_tests", "hormonal_testing"],
    extraBiomarkerKeywords: ["FSH", "estradiol", "AMH", "LH", "progesterone"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Fertility ──────────────────────────────────────────────────────────────
  fertility_panel: {
    serviceTypes:           ["blood_tests", "fertility_tests", "hormonal_testing"],
    extraBiomarkerKeywords: ["AMH", "FSH", "LH", "estradiol", "prolactin"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── STI / STD ──────────────────────────────────────────────────────────────
  std_screening: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["HIV", "hepatitis", "syphilis", "chlamydia", "gonorrhea", "STD", "STI"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },
  sti_screening: {
    serviceTypes:           ["blood_tests"],
    extraBiomarkerKeywords: ["HIV", "hepatitis", "syphilis", "chlamydia"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       true,
  },

  // ── Colorectal / stool ─────────────────────────────────────────────────────
  colorectal_cancer_screening: {
    serviceTypes:           ["stool_tests", "cancer_screening"],
    extraBiomarkerKeywords: ["stool", "colorectal", "colon", "FIT", "occult blood"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       false,
  },
  bowel_cancer_screening: {
    serviceTypes:           ["stool_tests", "cancer_screening"],
    extraBiomarkerKeywords: ["stool", "colon", "FIT"],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  true,
    suggestLocalLabs:       false,
  },

  // ── Screenings (physical / imaging — IGeL doctors only) ───────────────────
  skin_check: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  breast_exam: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  mammography: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  pap_smear: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  hpv_cervical_screening: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  colonoscopy: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  bone_density_scan: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  dental: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
  physical_exam: {
    serviceTypes:           [],
    extraBiomarkerKeywords: [],
    suggestIgelDoctors:     true,
    suggestOnlineProducts:  false,
    suggestLocalLabs:       false,
  },
};

/**
 * Returns the service profile for a checkKey. Falls back to the default
 * blood-test profile for unknown keys.
 */
export function getCheckServiceProfile(
  checkKey: string,
  isScreening: boolean,
): CheckServiceProfile {
  const norm = checkKey.trim().toLowerCase().replace(/[-\s]+/g, "_");

  // Exact match
  if (CHECK_SERVICE_MAP[norm]) return CHECK_SERVICE_MAP[norm];

  // Partial match
  for (const [key, profile] of Object.entries(CHECK_SERVICE_MAP)) {
    if (norm.includes(key) || key.includes(norm)) return profile;
  }

  // Screening fallback: only IGeL doctors
  if (isScreening) {
    return {
      serviceTypes:           [],
      extraBiomarkerKeywords: [],
      suggestIgelDoctors:     true,
      suggestOnlineProducts:  false,
      suggestLocalLabs:       false,
    };
  }

  return DEFAULT;
}

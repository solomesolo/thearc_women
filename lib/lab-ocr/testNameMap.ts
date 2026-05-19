/**
 * Rule-based test name normalisation.
 * Ported from workers/normalizer.py _TEST_MAP.
 * Each entry: [canonicalKey, displayName, category, ...regexPatterns]
 */

export interface TestEntry {
  key: string;
  displayName: string;
  category: string;
  patterns: RegExp[];
}

// Category → health bin mapping (mirrors Python bin_mapper)
export const CATEGORY_TO_BIN: Record<string, string> = {
  haematology: "general_labs",
  metabolic: "general_labs",
  vitamins: "general_labs",
  iron: "general_labs",
  inflammation: "general_labs",
  thyroid: "general_labs",
  lipids: "cardiovascular",
  cardiac: "cardiovascular",
  hormones: "gynecology",
  reproductive: "gynecology",
  fertility: "gynecology",
  oncology: "oncology",
  mental_health: "mental_health",
  respiratory: "respiratory",
  gastroenterology: "gastroenterology",
  musculoskeletal: "musculoskeletal",
  other: "general_labs",
};

function p(...pats: string[]): RegExp[] {
  return pats.map((s) => new RegExp(s, "i"));
}

export const TEST_MAP: TestEntry[] = [
  // HbA1c — must appear before plain hemoglobin
  { key: "hba1c", displayName: "HbA1c (Glycated Haemoglobin)", category: "metabolic", patterns: p("\\bhba1c\\b", "\\ba1c\\b", "glycated\\s+h[ae]moglobin", "glycoh[ae]moglobin", "hemoglobin\\s+a1c", "h[ae]moglobin\\s+a1c") },

  // ── Haematology ─────────────────────────────────────────────────────────────
  { key: "wbc", displayName: "White Blood Cell Count", category: "haematology", patterns: p("\\bwbc\\b", "white\\s+blood\\s+cell\\s+count", "leukocyte\\s+count", "\\bwcc\\b") },
  { key: "rbc", displayName: "Red Blood Cell Count", category: "haematology", patterns: p("\\brbc\\b", "red\\s+blood\\s+cell\\s+count", "erythrocyte\\s+count") },
  { key: "hemoglobin", displayName: "Hemoglobin", category: "haematology", patterns: p("\\bh[ae]moglobin\\b(?!.*a1c)", "\\bhgb\\b", "\\bhb\\b(?!\\s*a1c)", "\\bhgbn\\b") },
  { key: "hematocrit", displayName: "Hematocrit", category: "haematology", patterns: p("\\bh[ae]matocrit\\b", "\\bhct\\b", "packed\\s+cell\\s+volume", "\\bpcv\\b") },
  { key: "mcv", displayName: "Mean Corpuscular Volume", category: "haematology", patterns: p("\\bmcv\\b", "mean\\s+corp(?:uscular)?\\s+vol") },
  { key: "mch", displayName: "Mean Corpuscular Hemoglobin", category: "haematology", patterns: p("\\bmch\\b(?!c)", "mean\\s+corp(?:uscular)?\\s+h[ae]moglobin(?!\\s+conc)") },
  { key: "mchc", displayName: "MCHC", category: "haematology", patterns: p("\\bmchc\\b", "mean\\s+corp(?:uscular)?\\s+h[ae]moglobin\\s+conc") },
  { key: "rdw", displayName: "Red Cell Distribution Width", category: "haematology", patterns: p("\\brdw\\b", "red\\s+(?:cell|blood\\s+cell)\\s+distribution\\s+width") },
  { key: "platelets", displayName: "Platelet Count", category: "haematology", patterns: p("\\bplatelet\\b", "\\bplt\\b", "thrombocyte\\s+count") },
  { key: "neutrophils", displayName: "Neutrophils", category: "haematology", patterns: p("\\bneutrophils?\\b", "\\bpmn\\b", "\\bneuts?\\b") },
  { key: "lymphocytes", displayName: "Lymphocytes", category: "haematology", patterns: p("\\blymphocytes?\\b", "\\blymph\\b") },
  { key: "monocytes", displayName: "Monocytes", category: "haematology", patterns: p("\\bmonocytes?\\b", "\\bmono\\b") },
  { key: "eosinophils", displayName: "Eosinophils", category: "haematology", patterns: p("\\beosinophils?\\b", "\\beos\\b") },
  { key: "basophils", displayName: "Basophils", category: "haematology", patterns: p("\\bbasophils?\\b", "\\bbaso\\b") },

  // ── Metabolic / LFT / RFT ──────────────────────────────────────────────────
  { key: "glucose", displayName: "Glucose", category: "metabolic", patterns: p("\\bglucose\\b", "blood\\s+sugar", "fasting\\s+glucose", "plasma\\s+glucose") },
  { key: "creatinine", displayName: "Creatinine", category: "metabolic", patterns: p("\\bcreatinine\\b", "\\bcrea\\b") },
  { key: "bun", displayName: "Blood Urea Nitrogen", category: "metabolic", patterns: p("\\bbun\\b", "blood\\s+urea\\s+nitrogen", "serum\\s+urea") },
  { key: "egfr", displayName: "Estimated GFR", category: "metabolic", patterns: p("\\begfr\\b", "estimated\\s+(?:glomerular\\s+filtration|gfr)", "\\bckd-epi\\b") },
  { key: "sodium", displayName: "Sodium", category: "metabolic", patterns: p("\\bsodium\\b", "\\bna\\b") },
  { key: "potassium", displayName: "Potassium", category: "metabolic", patterns: p("\\bpotassium\\b", "\\bk\\b") },
  { key: "chloride", displayName: "Chloride", category: "metabolic", patterns: p("\\bchloride\\b", "\\bcl\\b") },
  { key: "bicarbonate", displayName: "Bicarbonate", category: "metabolic", patterns: p("\\bbicarbonate\\b", "serum\\s+co2", "\\bhco3\\b") },
  { key: "calcium", displayName: "Calcium", category: "metabolic", patterns: p("\\bcalcium\\b(?!\\s+channel)") },
  { key: "phosphorus", displayName: "Phosphorus", category: "metabolic", patterns: p("\\bphosphorus\\b", "\\bphosphate\\b(?!\\s+buffer)", "\\bphos\\b") },
  { key: "magnesium", displayName: "Magnesium", category: "metabolic", patterns: p("\\bmagnesium\\b") },
  { key: "uric_acid", displayName: "Uric Acid", category: "metabolic", patterns: p("uric\\s+acid", "\\burate\\b") },
  { key: "alt", displayName: "ALT (Alanine Aminotransferase)", category: "metabolic", patterns: p("\\balt\\b", "alanine\\s+(?:amino)?transferase", "\\bsgpt\\b") },
  { key: "ast", displayName: "AST (Aspartate Aminotransferase)", category: "metabolic", patterns: p("\\bast\\b", "aspartate\\s+(?:amino)?transferase", "\\bsgot\\b") },
  { key: "alp", displayName: "Alkaline Phosphatase", category: "metabolic", patterns: p("\\balp\\b", "alkaline\\s+phosphatase") },
  { key: "ggt", displayName: "GGT", category: "metabolic", patterns: p("\\bggt\\b", "gamma.glutamyl(?:\\s+transferase|\\s+transpeptidase)?", "\\bggtp\\b") },
  { key: "bilirubin_total", displayName: "Bilirubin, Total", category: "metabolic", patterns: p("total\\s+bilirubin", "bilirubin\\s+total", "\\bT\\.?bili\\b") },
  { key: "bilirubin_direct", displayName: "Bilirubin, Direct", category: "metabolic", patterns: p("direct\\s+bilirubin", "conjugated\\s+bilirubin", "\\bD\\.?bili\\b") },
  { key: "albumin", displayName: "Albumin", category: "metabolic", patterns: p("\\balbumin\\b(?!\\s+globulin|\\s+ratio)") },
  { key: "total_protein", displayName: "Total Protein", category: "metabolic", patterns: p("total\\s+protein") },

  // ── Lipids ─────────────────────────────────────────────────────────────────
  { key: "ldl_cholesterol", displayName: "LDL Cholesterol", category: "lipids", patterns: p("\\bldl\\b", "ldl.?cholesterol", "low.density\\s+lipoprotein") },
  { key: "hdl_cholesterol", displayName: "HDL Cholesterol", category: "lipids", patterns: p("\\bhdl\\b", "hdl.?cholesterol", "high.density\\s+lipoprotein") },
  { key: "total_cholesterol", displayName: "Total Cholesterol", category: "lipids", patterns: p("total\\s+cholesterol", "\\bcholesterol\\b(?!.*hdl|.*ldl)") },
  { key: "triglycerides", displayName: "Triglycerides", category: "lipids", patterns: p("\\btriglycerides?\\b", "\\btrigs?\\b", "\\btg\\b") },
  { key: "vldl", displayName: "VLDL Cholesterol", category: "lipids", patterns: p("\\bvldl\\b", "very\\s+low.density\\s+lipoprotein") },

  // ── Thyroid ────────────────────────────────────────────────────────────────
  { key: "tsh", displayName: "TSH", category: "thyroid", patterns: p("\\btsh\\b", "thyroid.stimulating\\s+hormone", "thyrotropin") },
  { key: "free_t4", displayName: "Free T4", category: "thyroid", patterns: p("free\\s+t4", "\\bft4\\b", "free\\s+thyroxine") },
  { key: "free_t3", displayName: "Free T3", category: "thyroid", patterns: p("free\\s+t3", "\\bft3\\b", "free\\s+triiodothyronine") },
  { key: "total_t4", displayName: "Total T4", category: "thyroid", patterns: p("total\\s+t4", "\\btt4\\b") },
  { key: "anti_tpo", displayName: "Anti-TPO Antibodies", category: "thyroid", patterns: p("anti.?tpo", "thyroid\\s+peroxidase\\s+antibod", "tpo\\s+antibod") },
  { key: "anti_tg", displayName: "Anti-Thyroglobulin", category: "thyroid", patterns: p("anti.?tg", "anti.thyroglobulin", "thyroglobulin\\s+antibod") },

  // ── Iron ──────────────────────────────────────────────────────────────────
  { key: "ferritin", displayName: "Ferritin", category: "iron", patterns: p("\\bferritin\\b") },
  { key: "serum_iron", displayName: "Serum Iron", category: "iron", patterns: p("serum\\s+iron", "\\biron\\b(?!\\s+supplement|\\s+tablet|\\s+deficiency|\\s+panel)") },
  { key: "tibc", displayName: "Total Iron-Binding Capacity", category: "iron", patterns: p("\\btibc\\b", "total\\s+iron.binding\\s+capacity") },
  { key: "transferrin_saturation", displayName: "Transferrin Saturation", category: "iron", patterns: p("transferrin\\s+sat(?:uration)?", "iron\\s+saturation") },
  { key: "transferrin", displayName: "Transferrin", category: "iron", patterns: p("\\btransferrin\\b(?!\\s+sat)") },

  // ── Vitamins / Minerals ───────────────────────────────────────────────────
  { key: "vitamin_d", displayName: "Vitamin D (25-OH)", category: "vitamins", patterns: p("vitamin\\s+d", "\\b25.oh\\b", "25.hydroxy(?:vitamin\\s*)?d", "cholecalciferol") },
  { key: "vitamin_b12", displayName: "Vitamin B12", category: "vitamins", patterns: p("vitamin\\s+b.?12", "\\bcobalamin\\b", "\\bcyanocobalamin\\b") },
  { key: "folate", displayName: "Folate", category: "vitamins", patterns: p("\\bfolate\\b", "folic\\s+acid") },
  { key: "zinc", displayName: "Zinc", category: "vitamins", patterns: p("\\bzinc\\b") },

  // ── Inflammation ──────────────────────────────────────────────────────────
  { key: "crp", displayName: "C-Reactive Protein", category: "inflammation", patterns: p("\\bcrp\\b", "c.reactive\\s+protein", "hs.?crp") },
  { key: "esr", displayName: "ESR", category: "inflammation", patterns: p("\\besr\\b", "erythrocyte\\s+sedimentation\\s+rate") },

  // ── Hormones / Reproductive ───────────────────────────────────────────────
  { key: "estradiol", displayName: "Estradiol (E2)", category: "hormones", patterns: p("\\bestradiol\\b", "\\boestradiol\\b", "\\be2\\b") },
  { key: "progesterone", displayName: "Progesterone", category: "hormones", patterns: p("\\bprogesterone\\b") },
  { key: "lh", displayName: "LH (Luteinising Hormone)", category: "hormones", patterns: p("\\blh\\b", "lutein(?:is|iz)ing\\s+hormone") },
  { key: "fsh", displayName: "FSH (Follicle-Stimulating Hormone)", category: "hormones", patterns: p("\\bfsh\\b", "follicle.stimulating\\s+hormone") },
  { key: "testosterone_total", displayName: "Testosterone (Total)", category: "hormones", patterns: p("total\\s+testosterone", "testosterone\\s+total") },
  { key: "testosterone_free", displayName: "Testosterone (Free)", category: "hormones", patterns: p("free\\s+testosterone") },
  { key: "testosterone", displayName: "Testosterone", category: "hormones", patterns: p("\\btestosterone\\b(?!\\s+total|\\s+free|.*total|.*free)") },
  { key: "dhea_s", displayName: "DHEA-S", category: "hormones", patterns: p("\\bdhea.?s\\b", "dehydroepiandrosterone\\s+su", "\\bdheas\\b") },
  { key: "prolactin", displayName: "Prolactin", category: "hormones", patterns: p("\\bprolactin\\b", "\\bprl\\b") },
  { key: "amh", displayName: "AMH (Anti-Müllerian Hormone)", category: "fertility", patterns: p("\\bamh\\b", "anti.m[uü]llerian\\s+hormone", "m[uü]llerian\\s+inhibiting") },
  { key: "cortisol", displayName: "Cortisol", category: "hormones", patterns: p("\\bcortisol\\b", "\\bhydrocortisone\\b") },

  // ── Cardiac ────────────────────────────────────────────────────────────────
  { key: "troponin", displayName: "Troponin", category: "cardiac", patterns: p("\\btroponin\\b") },
  { key: "bnp", displayName: "BNP", category: "cardiac", patterns: p("\\bbnp\\b", "brain\\s+natriuretic\\s+peptide") },
  { key: "nt_probnp", displayName: "NT-proBNP", category: "cardiac", patterns: p("\\bnt.?pro.?bnp\\b") },
  { key: "d_dimer", displayName: "D-Dimer", category: "cardiac", patterns: p("\\bd.dimer\\b") },

  // ── Oncology markers ──────────────────────────────────────────────────────
  { key: "ca125", displayName: "CA-125", category: "oncology", patterns: p("\\bca.?125\\b") },
  { key: "ca153", displayName: "CA 15-3", category: "oncology", patterns: p("\\bca.?15.?3\\b") },
  { key: "cea", displayName: "CEA", category: "oncology", patterns: p("\\bcea\\b", "carcinoembryonic\\s+antigen") },
  { key: "psa", displayName: "PSA", category: "oncology", patterns: p("\\bpsa\\b", "prostate.specific\\s+antigen") },
  { key: "ca199", displayName: "CA 19-9", category: "oncology", patterns: p("\\bca.?19.?9\\b") },
];

/** Match a raw test name string against the map. Returns the entry or null. */
export function matchTestName(raw: string): TestEntry | null {
  for (const entry of TEST_MAP) {
    for (const pat of entry.patterns) {
      if (pat.test(raw)) return entry;
    }
  }
  return null;
}

/**
 * Full taxonomy for blog filtering.
 * slug: URL-safe, lowercase, hyphenated.
 * label: Display name.
 * type: TaxonomyType (must match Prisma enum).
 */
export const TAXONOMY_LABELS: { slug: string; label: string; type: string }[] = [
  // 1. LIFE STAGE
  { slug: "menstrual-reproductive", label: "Menstrual & Reproductive", type: "lifeStage" },
  { slug: "teen-12-17", label: "Teen (12–17)", type: "lifeStage" },
  { slug: "early-reproductive-18-25", label: "Early Reproductive (18–25)", type: "lifeStage" },
  { slug: "reproductive-26-35", label: "Reproductive (26–35)", type: "lifeStage" },
  { slug: "advanced-reproductive-36-40", label: "Advanced Reproductive (36–40)", type: "lifeStage" },
  { slug: "fertility-planning", label: "Fertility Planning", type: "lifeStage" },
  { slug: "trying-to-conceive", label: "Trying to Conceive", type: "lifeStage" },
  { slug: "ivf-support", label: "IVF Support", type: "lifeStage" },
  { slug: "postpartum", label: "Postpartum", type: "lifeStage" },
  { slug: "breastfeeding", label: "Breastfeeding", type: "lifeStage" },
  { slug: "after-hormonal-contraception", label: "After Hormonal Contraception", type: "lifeStage" },
  { slug: "perimenopause", label: "Perimenopause", type: "lifeStage" },
  { slug: "menopause", label: "Menopause", type: "lifeStage" },
  { slug: "postmenopause", label: "Postmenopause", type: "lifeStage" },
  { slug: "surgical-menopause", label: "Surgical Menopause", type: "lifeStage" },

  // 2. SYMPTOM — Energy & Metabolism
  { slug: "chronic-fatigue", label: "Chronic Fatigue", type: "symptom" },
  { slug: "morning-exhaustion", label: "Morning Exhaustion", type: "symptom" },
  { slug: "afternoon-energy-crash", label: "Afternoon Energy Crash", type: "symptom" },
  { slug: "burnout", label: "Burnout", type: "symptom" },
  { slug: "sugar-cravings", label: "Sugar Cravings", type: "symptom" },
  { slug: "weight-gain", label: "Weight Gain", type: "symptom" },
  { slug: "weight-loss-resistance", label: "Weight Loss Resistance", type: "symptom" },
  { slug: "belly-fat", label: "Belly Fat", type: "symptom" },
  { slug: "slow-metabolism", label: "Slow Metabolism", type: "symptom" },
  { slug: "low-stamina", label: "Low Stamina", type: "symptom" },
  // Cycle & Hormones
  { slug: "irregular-periods", label: "Irregular Periods", type: "symptom" },
  { slug: "short-cycles", label: "Short Cycles", type: "symptom" },
  { slug: "long-cycles", label: "Long Cycles", type: "symptom" },
  { slug: "missed-period", label: "Missed Period", type: "symptom" },
  { slug: "painful-periods", label: "Painful Periods", type: "symptom" },
  { slug: "heavy-bleeding", label: "Heavy Bleeding", type: "symptom" },
  { slug: "light-period", label: "Light Period", type: "symptom" },
  { slug: "pms", label: "PMS", type: "symptom" },
  { slug: "pmdd", label: "PMDD", type: "symptom" },
  { slug: "ovulation-pain", label: "Ovulation Pain", type: "symptom" },
  { slug: "mid-cycle-spotting", label: "Mid-Cycle Spotting", type: "symptom" },
  { slug: "breast-tenderness", label: "Breast Tenderness", type: "symptom" },
  { slug: "low-progesterone-signs", label: "Low Progesterone Signs", type: "symptom" },
  { slug: "estrogen-dominance-signs", label: "Estrogen Dominance Signs", type: "symptom" },
  // Mood & Brain
  { slug: "anxiety", label: "Anxiety", type: "symptom" },
  { slug: "pre-period-anxiety", label: "Pre-Period Anxiety", type: "symptom" },
  { slug: "depression", label: "Depression", type: "symptom" },
  { slug: "brain-fog", label: "Brain Fog", type: "symptom" },
  { slug: "poor-focus", label: "Poor Focus", type: "symptom" },
  { slug: "mood-swings", label: "Mood Swings", type: "symptom" },
  { slug: "irritability", label: "Irritability", type: "symptom" },
  { slug: "low-motivation", label: "Low Motivation", type: "symptom" },
  { slug: "memory-changes", label: "Memory Changes", type: "symptom" },
  // Sleep
  { slug: "insomnia", label: "Insomnia", type: "symptom" },
  { slug: "waking-at-3am", label: "Waking at 3am", type: "symptom" },
  { slug: "light-sleep", label: "Light Sleep", type: "symptom" },
  { slug: "unrefreshing-sleep", label: "Unrefreshing Sleep", type: "symptom" },
  { slug: "night-sweats", label: "Night Sweats", type: "symptom" },
  // Gut & Digestion
  { slug: "bloating", label: "Bloating", type: "symptom" },
  { slug: "constipation", label: "Constipation", type: "symptom" },
  { slug: "diarrhea", label: "Diarrhea", type: "symptom" },
  { slug: "ibs", label: "IBS", type: "symptom" },
  { slug: "acid-reflux", label: "Acid Reflux", type: "symptom" },
  { slug: "food-sensitivities", label: "Food Sensitivities", type: "symptom" },
  { slug: "nausea", label: "Nausea", type: "symptom" },
  { slug: "slow-digestion", label: "Slow Digestion", type: "symptom" },
  // Skin & Hair
  { slug: "acne", label: "Acne", type: "symptom" },
  { slug: "hormonal-acne", label: "Hormonal Acne", type: "symptom" },
  { slug: "hair-thinning", label: "Hair Thinning", type: "symptom" },
  { slug: "hair-loss", label: "Hair Loss", type: "symptom" },
  { slug: "dry-skin", label: "Dry Skin", type: "symptom" },
  { slug: "brittle-nails", label: "Brittle Nails", type: "symptom" },
  // Thyroid indicators
  { slug: "cold-intolerance", label: "Cold Intolerance", type: "symptom" },
  { slug: "low-libido", label: "Low Libido", type: "symptom" },
  { slug: "puffy-face", label: "Puffy Face", type: "symptom" },
  { slug: "hoarse-voice", label: "Hoarse Voice", type: "symptom" },
  { slug: "eyebrow-thinning", label: "Eyebrow Thinning", type: "symptom" },
  // Cardiometabolic
  { slug: "high-cholesterol", label: "High Cholesterol", type: "symptom" },
  { slug: "high-blood-pressure", label: "High Blood Pressure", type: "symptom" },
  { slug: "insulin-resistance", label: "Insulin Resistance", type: "symptom" },
  { slug: "prediabetes", label: "Prediabetes", type: "symptom" },
  { slug: "high-triglycerides", label: "High Triglycerides", type: "symptom" },

  // 3. BODY SYSTEM
  { slug: "hypothalamic-pituitary-ovarian-axis", label: "Hypothalamic-Pituitary-Ovarian Axis", type: "bodySystem" },
  { slug: "thyroid-system", label: "Thyroid System", type: "bodySystem" },
  { slug: "adrenal-function", label: "Adrenal Function", type: "bodySystem" },
  { slug: "nervous-system", label: "Nervous System", type: "bodySystem" },
  { slug: "gut-microbiome", label: "Gut Microbiome", type: "bodySystem" },
  { slug: "immune-system", label: "Immune System", type: "bodySystem" },
  { slug: "metabolic-health", label: "Metabolic Health", type: "bodySystem" },
  { slug: "mitochondrial-function", label: "Mitochondrial Function", type: "bodySystem" },
  { slug: "detoxification-pathways", label: "Detoxification Pathways", type: "bodySystem" },
  { slug: "cardiovascular-system", label: "Cardiovascular System", type: "bodySystem" },
  { slug: "bone-health", label: "Bone Health", type: "bodySystem" },
  { slug: "liver-function", label: "Liver Function", type: "bodySystem" },

  // 4. BIOMARKER & LAB
  { slug: "estradiol", label: "Estradiol", type: "biomarker" },
  { slug: "progesterone", label: "Progesterone", type: "biomarker" },
  { slug: "lh", label: "LH", type: "biomarker" },
  { slug: "fsh", label: "FSH", type: "biomarker" },
  { slug: "amh", label: "AMH", type: "biomarker" },
  { slug: "prolactin", label: "Prolactin", type: "biomarker" },
  { slug: "testosterone", label: "Testosterone", type: "biomarker" },
  { slug: "shbg", label: "SHBG", type: "biomarker" },
  { slug: "dhea-s", label: "DHEA-S", type: "biomarker" },
  { slug: "cortisol", label: "Cortisol", type: "biomarker" },
  { slug: "tsh", label: "TSH", type: "biomarker" },
  { slug: "free-t4", label: "Free T4", type: "biomarker" },
  { slug: "free-t3", label: "Free T3", type: "biomarker" },
  { slug: "reverse-t3", label: "Reverse T3", type: "biomarker" },
  { slug: "tpo-antibodies", label: "TPO Antibodies", type: "biomarker" },
  { slug: "thyroglobulin-antibodies", label: "Thyroglobulin Antibodies", type: "biomarker" },
  { slug: "fasting-glucose", label: "Fasting Glucose", type: "biomarker" },
  { slug: "fasting-insulin", label: "Fasting Insulin", type: "biomarker" },
  { slug: "hba1c", label: "HbA1c", type: "biomarker" },
  { slug: "homa-ir", label: "HOMA-IR", type: "biomarker" },
  { slug: "triglycerides", label: "Triglycerides", type: "biomarker" },
  { slug: "hdl", label: "HDL", type: "biomarker" },
  { slug: "ldl", label: "LDL", type: "biomarker" },
  { slug: "apob", label: "ApoB", type: "biomarker" },
  { slug: "ferritin", label: "Ferritin", type: "biomarker" },
  { slug: "vitamin-d", label: "Vitamin D", type: "biomarker" },
  { slug: "b12", label: "B12", type: "biomarker" },
  { slug: "folate", label: "Folate", type: "biomarker" },
  { slug: "magnesium", label: "Magnesium", type: "biomarker" },
  { slug: "zinc", label: "Zinc", type: "biomarker" },
  { slug: "omega-3-index", label: "Omega-3 Index", type: "biomarker" },
  { slug: "crp", label: "CRP", type: "biomarker" },
  { slug: "esr", label: "ESR", type: "biomarker" },
  { slug: "homocysteine", label: "Homocysteine", type: "biomarker" },

  // 5. ROOT CAUSE
  { slug: "chronic-stress-load", label: "Chronic Stress Load", type: "rootCause" },
  { slug: "cortisol-dysregulation", label: "Cortisol Dysregulation", type: "rootCause" },
  { slug: "blood-sugar-instability", label: "Blood Sugar Instability", type: "rootCause" },
  { slug: "iron-deficiency", label: "Iron Deficiency", type: "rootCause" },
  { slug: "thyroid-slowing", label: "Thyroid Slowing", type: "rootCause" },
  { slug: "estrogen-dominance", label: "Estrogen Dominance", type: "rootCause" },
  { slug: "progesterone-deficiency", label: "Progesterone Deficiency", type: "rootCause" },
  { slug: "androgen-excess", label: "Androgen Excess", type: "rootCause" },
  { slug: "inflammatory-state", label: "Inflammatory State", type: "rootCause" },
  { slug: "gut-dysbiosis", label: "Gut Dysbiosis", type: "rootCause" },
  { slug: "micronutrient-depletion", label: "Micronutrient Depletion", type: "rootCause" },
  { slug: "overtraining", label: "Overtraining", type: "rootCause" },
  { slug: "sleep-deprivation", label: "Sleep Deprivation", type: "rootCause" },
  { slug: "nervous-system-dysregulation", label: "Nervous System Dysregulation", type: "rootCause" },
  { slug: "postpartum-depletion", label: "Postpartum Depletion", type: "rootCause" },

  // 6. PREVENTIVE HEALTH
  { slug: "fertility-preservation", label: "Fertility Preservation", type: "preventiveFocus" },
  { slug: "bone-density-protection", label: "Bone Density Protection", type: "preventiveFocus" },
  { slug: "cardiovascular-prevention", label: "Cardiovascular Prevention", type: "preventiveFocus" },
  { slug: "breast-health", label: "Breast Health", type: "preventiveFocus" },
  { slug: "metabolic-longevity", label: "Metabolic Longevity", type: "preventiveFocus" },
  { slug: "cognitive-protection", label: "Cognitive Protection", type: "preventiveFocus" },
  { slug: "hormone-balance-maintenance", label: "Hormone Balance Maintenance", type: "preventiveFocus" },
  { slug: "healthy-aging", label: "Healthy Aging", type: "preventiveFocus" },
  { slug: "muscle-preservation", label: "Muscle Preservation", type: "preventiveFocus" },
  { slug: "cycle-optimization", label: "Cycle Optimization", type: "preventiveFocus" },
  { slug: "screening", label: "Screening", type: "preventiveFocus" },
  { slug: "cardiometabolic", label: "Cardiometabolic", type: "preventiveFocus" },

  // 7. GOAL-BASED
  { slug: "stabilize-energy", label: "Stabilize Energy", type: "goal" },
  { slug: "regulate-cycle", label: "Regulate Cycle", type: "goal" },
  { slug: "improve-pms", label: "Improve PMS", type: "goal" },
  { slug: "improve-fertility", label: "Improve Fertility", type: "goal" },
  { slug: "lose-weight-sustainably", label: "Lose Weight Sustainably", type: "goal" },
  { slug: "build-muscle", label: "Build Muscle", type: "goal" },
  { slug: "improve-sleep", label: "Improve Sleep", type: "goal" },
  { slug: "reduce-anxiety", label: "Reduce Anxiety", type: "goal" },
  { slug: "improve-gut-health", label: "Improve Gut Health", type: "goal" },
  { slug: "increase-libido", label: "Increase Libido", type: "goal" },
  { slug: "improve-skin", label: "Improve Skin", type: "goal" },
  { slug: "support-perimenopause", label: "Support Perimenopause", type: "goal" },
  { slug: "balance-hormones-naturally", label: "Balance Hormones Naturally", type: "goal" },
  { slug: "energy", label: "Energy", type: "goal" },
  { slug: "performance", label: "Performance", type: "goal" },
  { slug: "recovery", label: "Recovery", type: "goal" },

  // 8. INTERVENTION TYPE
  { slug: "lifestyle-intervention", label: "Lifestyle Intervention", type: "interventionType" },
  { slug: "nutrition-strategy", label: "Nutrition Strategy", type: "interventionType" },
  { slug: "exercise-adjustment", label: "Exercise Adjustment", type: "interventionType" },
  { slug: "stress-regulation", label: "Stress Regulation", type: "interventionType" },
  { slug: "sleep-optimization", label: "Sleep Optimization", type: "interventionType" },
  { slug: "supplement-strategy", label: "Supplement Strategy", type: "interventionType" },
  { slug: "lab-testing-strategy", label: "Lab Testing Strategy", type: "interventionType" },
  { slug: "clinical-evaluation-needed", label: "Clinical Evaluation Needed", type: "interventionType" },
  { slug: "4-week-reset", label: "4-Week Reset", type: "interventionType" },
  { slug: "8-week-protocol", label: "8-Week Protocol", type: "interventionType" },
  { slug: "maintenance-plan", label: "Maintenance Plan", type: "interventionType" },

  // 9. EVIDENCE LEVEL
  { slug: "high-evidence", label: "High Evidence", type: "evidenceLevel" },
  { slug: "moderate-evidence", label: "Moderate Evidence", type: "evidenceLevel" },
  { slug: "emerging-evidence", label: "Emerging Evidence", type: "evidenceLevel" },
  { slug: "clinical-practice-based", label: "Clinical Practice Based", type: "evidenceLevel" },
  { slug: "trend-analysis", label: "Trend Analysis", type: "evidenceLevel" },
  { slug: "myth-busting", label: "Myth-Busting", type: "evidenceLevel" },

  // 10. CONTENT ACCESS (backend / gating)
  { slug: "education-only", label: "Education Only", type: "contentAccess" },
  { slug: "includes-action-protocol-gated", label: "Includes Action Protocol (Gated)", type: "contentAccess" },
  { slug: "includes-tracking-framework-gated", label: "Includes Tracking Framework (Gated)", type: "contentAccess" },
  { slug: "personalized-content", label: "Personalized Content", type: "contentAccess" },
  { slug: "advanced-clinical", label: "Advanced Clinical", type: "contentAccess" },

  // Legacy / keep for existing articles
  { slug: "reproductive", label: "Reproductive", type: "lifeStage" },
  { slug: "sleep-disruption", label: "Sleep disruption", type: "symptom" },
  { slug: "fatigue", label: "Fatigue", type: "symptom" },
  { slug: "mood-shifts", label: "Mood shifts", type: "symptom" },
  { slug: "cardiovascular", label: "Cardiovascular", type: "bodySystem" },
  { slug: "metabolic", label: "Metabolic", type: "bodySystem" },
  { slug: "longevity", label: "Longevity", type: "trending" },
  { slug: "glucose", label: "Glucose", type: "trending" },
  { slug: "lipids", label: "Lipids", type: "biomarker" },
  { slug: "estrogen", label: "Estrogen", type: "hormone" },
  { slug: "thyroid", label: "Thyroid", type: "hormone" },
];

/** Simple filter groups (default view): lifeStage, symptom, goal, evidenceLevel */
export const SIMPLE_FILTER_TYPES = ["lifeStage", "symptom", "goal", "evidenceLevel"] as const;

/** Advanced filter types (behind toggle) */
export const ADVANCED_FILTER_TYPES = [
  "bodySystem",
  "biomarker",
  "rootCause",
  "interventionType",
  "contentAccess",
] as const;

/** Display names for filter groups */
export const FILTER_GROUP_LABELS: Record<string, string> = {
  lifeStage: "Life stage",
  symptom: "Main concern",
  goal: "Goal",
  evidenceLevel: "Evidence level",
  bodySystem: "Body system",
  biomarker: "Biomarkers & labs",
  rootCause: "Root cause",
  interventionType: "Intervention type",
  contentAccess: "Access level",
  preventiveFocus: "Prevention",
  trending: "Trending",
  hormone: "Hormone",
};

/** Guided paths for "Start here" row */
export const GUIDED_PATHS: { slug: string; label: string; query: string }[] = [
  { slug: "start-here", label: "Start here", query: "pillar=Foundations&sort=latest" },
  { slug: "always-tired", label: "I'm always tired", query: "symptom=chronic-fatigue&symptom=fatigue" },
  { slug: "pms-worse", label: "My PMS is getting worse", query: "symptom=pms&symptom=pmdd" },
  { slug: "irregular-cycle", label: "My cycle is irregular", query: "symptom=irregular-periods" },
  { slug: "perimenopause", label: "Perimenopause symptoms", query: "lifeStage=perimenopause" },
  { slug: "prevention-longevity", label: "I want prevention & longevity", query: "preventiveFocus=healthy-aging" },
];

/** Symptom groups for Main Concern popover (grouped, curated) */
export const SYMPTOM_GROUPS: { label: string; slugs: string[] }[] = [
  { label: "Energy", slugs: ["chronic-fatigue", "morning-exhaustion", "afternoon-energy-crash", "brain-fog", "burnout", "low-stamina", "fatigue"] },
  { label: "Hormonal", slugs: ["pms", "pmdd", "irregular-periods", "breast-tenderness", "estrogen-dominance-signs", "low-progesterone-signs", "painful-periods", "heavy-bleeding", "ovulation-pain", "mid-cycle-spotting"] },
  { label: "Metabolic", slugs: ["weight-gain", "weight-loss-resistance", "belly-fat", "slow-metabolism", "sugar-cravings", "bloating", "acid-reflux", "insulin-resistance", "prediabetes"] },
  { label: "Mood & brain", slugs: ["anxiety", "pre-period-anxiety", "depression", "mood-swings", "irritability", "poor-focus", "low-motivation", "memory-changes"] },
  { label: "Sleep", slugs: ["insomnia", "waking-at-3am", "light-sleep", "unrefreshing-sleep", "night-sweats", "sleep-disruption"] },
  { label: "Gut & digestion", slugs: ["bloating", "constipation", "diarrhea", "ibs", "acid-reflux", "food-sensitivities", "nausea", "slow-digestion"] },
  { label: "Skin & hair", slugs: ["acne", "hormonal-acne", "hair-thinning", "hair-loss", "dry-skin", "brittle-nails"] },
  { label: "Thyroid & other", slugs: ["cold-intolerance", "low-libido", "puffy-face", "hoarse-voice", "eyebrow-thinning", "high-cholesterol", "high-blood-pressure"] },
];

/** Evidence level segments for refined control (order = display) */
export const EVIDENCE_SEGMENTS: { slug: string; label: string }[] = [
  { slug: "clinical-practice-based", label: "Clinical" },
  { slug: "emerging-evidence", label: "Emerging" },
  { slug: "high-evidence", label: "High" },
  { slug: "moderate-evidence", label: "Moderate" },
  { slug: "trend-analysis", label: "Latest" },
];

/** Smart Start cards (auto-populate filters when selected) */
export const SMART_START_CARDS: { id: string; label: string; query: string }[] = [
  { id: "always-tired", label: "I'm always tired", query: "symptom=chronic-fatigue&symptom=fatigue" },
  { id: "irregular-cycle", label: "My cycle is irregular", query: "symptom=irregular-periods&lifeStage=perimenopause" },
  { id: "prevention", label: "I want prevention & longevity", query: "preventiveFocus=healthy-aging&goal=energy" },
];

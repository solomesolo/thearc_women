"""
Screening interval registry — The Arc Woman
============================================
Defines the expected recurrence interval for each canonical metric / screening
type, keyed first by canonical_metric_name then by category as a fallback.

Structure of each entry
-----------------------
{
    "interval_days":     int,     # expected time between observations
    "due_soon_days":     int,     # flag as DUE_SOON this many days before due date
    "label":             str,     # human-readable name for the intervention
    "suggested_action":  str,     # what the user should do
    "guideline_source":  str,     # reference (USPSTF, AHA, etc.)
    "category":          str,     # mirrors normalizer category
    "priority":          str,     # "routine" | "surveillance" | "urgent"
    "applies_to":        list,    # [] = all users; otherwise condition-specific notes
}

Interval logic
--------------
  OVERDUE   : today > last_date + interval_days
  DUE_SOON  : today > last_date + interval_days - due_soon_days
  CURRENT   : otherwise
  NEVER_RECORDED : no observation in health_observations for this user

Intervals are intentionally conservative (longest commonly-recommended cycle).
Clinical teams should override via per-user configuration in future.
"""
from __future__ import annotations

# ── Per-metric intervals ────────────────────────────────────────────────────────
# Keyed by canonical_metric_name (exact match from normalizer._TEST_MAP)

METRIC_INTERVALS: dict[str, dict] = {

    # ── Haematology ─────────────────────────────────────────────────────────────
    "WBC": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Complete Blood Count",
        "suggested_action": "Schedule a routine CBC with your GP.",
        "guideline_source": "General preventive care",
        "category":         "haematology",
        "priority":         "routine",
        "applies_to":       [],
    },
    "Hemoglobin": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Hemoglobin",
        "suggested_action": "Request a CBC including hemoglobin measurement.",
        "guideline_source": "General preventive care",
        "category":         "haematology",
        "priority":         "routine",
        "applies_to":       [],
    },
    "Ferritin": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Ferritin / Iron Stores",
        "suggested_action": "Repeat ferritin test to monitor iron stores.",
        "guideline_source": "Iron deficiency monitoring guidelines",
        "category":         "iron",
        "priority":         "surveillance",
        "applies_to":       ["iron_deficiency", "menstruating_women"],
    },
    "Serum Iron": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Serum Iron Panel",
        "suggested_action": "Repeat iron panel (serum iron, TIBC, transferrin saturation).",
        "guideline_source": "Iron deficiency monitoring guidelines",
        "category":         "iron",
        "priority":         "surveillance",
        "applies_to":       [],
    },
    "Transferrin Saturation": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Transferrin Saturation",
        "suggested_action": "Repeat iron saturation assessment.",
        "guideline_source": "Iron deficiency monitoring guidelines",
        "category":         "iron",
        "priority":         "surveillance",
        "applies_to":       [],
    },

    # ── Metabolic / CMP ─────────────────────────────────────────────────────────
    "HbA1c": {
        "interval_days":    180,
        "due_soon_days":    30,
        "label":            "HbA1c (Glycated Hemoglobin)",
        "suggested_action": "Schedule HbA1c test to assess blood sugar control.",
        "guideline_source": "ADA Standards of Medical Care in Diabetes",
        "category":         "metabolic",
        "priority":         "surveillance",
        "applies_to":       ["diabetes", "prediabetes", "insulin_resistance"],
    },
    "Glucose": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Fasting Glucose",
        "suggested_action": "Request fasting blood glucose as part of metabolic panel.",
        "guideline_source": "ADA / USPSTF Diabetes Screening",
        "category":         "metabolic",
        "priority":         "routine",
        "applies_to":       [],
    },
    "Insulin": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Fasting Insulin",
        "suggested_action": "Repeat fasting insulin to monitor insulin sensitivity.",
        "guideline_source": "Insulin resistance monitoring",
        "category":         "metabolic",
        "priority":         "surveillance",
        "applies_to":       ["insulin_resistance", "PCOS"],
    },
    "HOMA-IR": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "HOMA-IR (Insulin Resistance Index)",
        "suggested_action": "Recalculate HOMA-IR using updated glucose + insulin values.",
        "guideline_source": "Insulin resistance monitoring",
        "category":         "metabolic",
        "priority":         "surveillance",
        "applies_to":       ["insulin_resistance", "PCOS"],
    },
    "Creatinine": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Creatinine / Kidney Function",
        "suggested_action": "Repeat creatinine and eGFR as part of CMP.",
        "guideline_source": "KDIGO kidney health guidelines",
        "category":         "metabolic",
        "priority":         "routine",
        "applies_to":       [],
    },
    "eGFR": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "eGFR (Kidney Filtration Rate)",
        "suggested_action": "Repeat eGFR to monitor kidney function trend.",
        "guideline_source": "KDIGO CKD Evaluation Guidelines",
        "category":         "metabolic",
        "priority":         "surveillance",
        "applies_to":       ["CKD", "diabetes", "hypertension"],
    },
    "ALT": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Liver Function (ALT)",
        "suggested_action": "Repeat liver function tests (ALT, AST, ALP).",
        "guideline_source": "General preventive care",
        "category":         "metabolic",
        "priority":         "routine",
        "applies_to":       [],
    },

    # ── Lipids ──────────────────────────────────────────────────────────────────
    "Total Cholesterol": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Lipid Panel",
        "suggested_action": "Schedule a fasting lipid panel (total, LDL, HDL, triglycerides).",
        "guideline_source": "AHA/ACC Cardiovascular Risk Guidelines",
        "category":         "lipids",
        "priority":         "routine",
        "applies_to":       [],
    },
    "LDL Cholesterol": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "LDL Cholesterol",
        "suggested_action": "Repeat LDL cholesterol as part of lipid panel.",
        "guideline_source": "AHA/ACC Cardiovascular Risk Guidelines",
        "category":         "lipids",
        "priority":         "surveillance",
        "applies_to":       ["hyperlipidemia", "cardiovascular_risk"],
    },
    "Triglycerides": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Triglycerides",
        "suggested_action": "Repeat fasting triglycerides with lipid panel.",
        "guideline_source": "AHA/ACC Cardiovascular Risk Guidelines",
        "category":         "lipids",
        "priority":         "routine",
        "applies_to":       [],
    },
    "Lp(a)": {
        "interval_days":    1825,  # once every 5 years unless elevated
        "due_soon_days":    60,
        "label":            "Lipoprotein (a)",
        "suggested_action": "Repeat Lp(a) if previously elevated or family history of CVD.",
        "guideline_source": "EAS Lp(a) Consensus Statement",
        "category":         "lipids",
        "priority":         "surveillance",
        "applies_to":       ["cardiovascular_risk", "family_history_CVD"],
    },

    # ── Thyroid ─────────────────────────────────────────────────────────────────
    "TSH": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Thyroid Function (TSH)",
        "suggested_action": "Schedule TSH test with your GP for thyroid function check.",
        "guideline_source": "ATA Thyroid Disease Guidelines",
        "category":         "thyroid",
        "priority":         "surveillance",
        "applies_to":       ["hypothyroidism", "hyperthyroidism", "autoimmune_thyroid"],
    },
    "Free T4": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Free T4 (Thyroxine)",
        "suggested_action": "Repeat Free T4 alongside TSH for full thyroid assessment.",
        "guideline_source": "ATA Thyroid Disease Guidelines",
        "category":         "thyroid",
        "priority":         "surveillance",
        "applies_to":       ["hypothyroidism", "hyperthyroidism"],
    },
    "Anti-TPO": {
        "interval_days":    730,  # every 2 years if stable
        "due_soon_days":    45,
        "label":            "Anti-TPO Antibodies",
        "suggested_action": "Repeat anti-TPO antibody test to monitor autoimmune thyroid activity.",
        "guideline_source": "ATA Hashimoto's Thyroiditis Guidelines",
        "category":         "thyroid",
        "priority":         "surveillance",
        "applies_to":       ["Hashimoto", "autoimmune_thyroid"],
    },

    # ── Vitamins ────────────────────────────────────────────────────────────────
    "Vitamin D": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Vitamin D (25-OH)",
        "suggested_action": "Repeat Vitamin D test to assess sufficiency and supplementation response.",
        "guideline_source": "Endocrine Society Vitamin D Guidelines",
        "category":         "vitamins",
        "priority":         "routine",
        "applies_to":       [],
    },
    "Vitamin B12": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Vitamin B12",
        "suggested_action": "Repeat B12 level — especially important if vegetarian/vegan or on metformin.",
        "guideline_source": "General preventive care",
        "category":         "vitamins",
        "priority":         "routine",
        "applies_to":       [],
    },
    "Folate": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Folate",
        "suggested_action": "Repeat folate level, particularly if planning pregnancy.",
        "guideline_source": "USPSTF Folic Acid Supplementation",
        "category":         "vitamins",
        "priority":         "routine",
        "applies_to":       ["preconception", "pregnancy"],
    },

    # ── Inflammation ────────────────────────────────────────────────────────────
    "CRP": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "C-Reactive Protein (CRP / hs-CRP)",
        "suggested_action": "Repeat hs-CRP to track systemic inflammation trend.",
        "guideline_source": "AHA hs-CRP Cardiovascular Risk Assessment",
        "category":         "inflammation",
        "priority":         "surveillance",
        "applies_to":       ["cardiovascular_risk", "autoimmune", "chronic_inflammation"],
    },

    # ── Hormones ────────────────────────────────────────────────────────────────
    "Estradiol": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Estradiol (E2)",
        "suggested_action": "Repeat estradiol during cycle day 2–5 (follicular phase) for accurate baseline.",
        "guideline_source": "ACOG Menopause Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["perimenopause", "menopause", "PCOS", "HRT"],
    },
    "FSH": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Follicle-Stimulating Hormone (FSH)",
        "suggested_action": "Repeat FSH (ideally day 2–3 of cycle) to assess ovarian reserve and menopause status.",
        "guideline_source": "ACOG / ESHRE Fertility Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["perimenopause", "fertility", "PCOS"],
    },
    "LH": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Luteinizing Hormone (LH)",
        "suggested_action": "Repeat LH to assess pituitary-ovarian axis.",
        "guideline_source": "ACOG / ESHRE Fertility Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["PCOS", "fertility", "perimenopause"],
    },
    "Progesterone": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Progesterone",
        "suggested_action": "Repeat progesterone (ideally day 21 of cycle) to confirm ovulation.",
        "guideline_source": "ACOG Reproductive Endocrinology Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["fertility", "luteal_phase_defect", "PCOS"],
    },
    "AMH": {
        "interval_days":    365,
        "due_soon_days":    45,
        "label":            "Anti-Müllerian Hormone (AMH / Ovarian Reserve)",
        "suggested_action": "Repeat AMH to monitor ovarian reserve trajectory.",
        "guideline_source": "ESHRE Ovarian Reserve Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["fertility", "PCOS", "perimenopause"],
    },
    "Testosterone Total": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Total Testosterone",
        "suggested_action": "Repeat total testosterone and free testosterone panel.",
        "guideline_source": "Endocrine Society Androgen Deficiency Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["PCOS", "androgen_excess", "low_libido"],
    },
    "DHEA-S": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "DHEA-S",
        "suggested_action": "Repeat DHEA-S to track adrenal androgen levels.",
        "guideline_source": "Endocrine Society Adrenal Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["PCOS", "adrenal_assessment"],
    },
    "Prolactin": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Prolactin",
        "suggested_action": "Repeat prolactin — draw in the morning, fasting, without breast stimulation.",
        "guideline_source": "Endocrine Society Hyperprolactinemia Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["fertility", "irregular_cycles", "hyperprolactinemia"],
    },
    "Cortisol": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Cortisol (Morning)",
        "suggested_action": "Repeat morning cortisol (8–9am, fasting) to assess adrenal function.",
        "guideline_source": "Endocrine Society Adrenal Insufficiency Guidelines",
        "category":         "hormones",
        "priority":         "surveillance",
        "applies_to":       ["adrenal_assessment", "chronic_stress", "HPA_dysfunction"],
    },

    # ── Imaging scores ───────────────────────────────────────────────────────────
    "BI-RADS": {
        "interval_days":    365,
        "due_soon_days":    45,
        "label":            "Mammogram / BI-RADS Score",
        "suggested_action": "Schedule your next mammogram. Women 40–74 should screen annually.",
        "guideline_source": "ACR / USPSTF Breast Cancer Screening Guidelines",
        "category":         "imaging_score",
        "priority":         "surveillance",
        "applies_to":       ["breast_screening"],
    },
    "Bone Density (T-score)": {
        "interval_days":    730,  # every 2 years for follow-up
        "due_soon_days":    60,
        "label":            "Bone Density (DEXA / T-score)",
        "suggested_action": "Schedule DEXA bone density scan — recommended every 1–2 years for at-risk women.",
        "guideline_source": "NOF / ISCD Osteoporosis Guidelines",
        "category":         "imaging_score",
        "priority":         "surveillance",
        "applies_to":       ["osteoporosis", "perimenopause", "menopause", "corticosteroid_use"],
    },

    # ── Oncology markers ────────────────────────────────────────────────────────
    "CA-125": {
        "interval_days":    365,
        "due_soon_days":    45,
        "label":            "CA-125 (Ovarian Cancer Marker)",
        "suggested_action": "Repeat CA-125 with pelvic ultrasound if clinically indicated.",
        "guideline_source": "SGO / ACOG Ovarian Cancer Surveillance Guidelines",
        "category":         "oncology",
        "priority":         "surveillance",
        "applies_to":       ["ovarian_cancer_surveillance", "BRCA"],
    },
    "CA 15-3": {
        "interval_days":    180,
        "due_soon_days":    30,
        "label":            "CA 15-3 (Breast Cancer Marker)",
        "suggested_action": "Repeat CA 15-3 as part of breast cancer monitoring.",
        "guideline_source": "ASCO Breast Cancer Tumor Markers Guidelines",
        "category":         "oncology",
        "priority":         "urgent",
        "applies_to":       ["breast_cancer_surveillance"],
    },
    "CEA": {
        "interval_days":    180,
        "due_soon_days":    30,
        "label":            "CEA (Carcinoembryonic Antigen)",
        "suggested_action": "Repeat CEA as part of cancer monitoring protocol.",
        "guideline_source": "ASCO Colorectal Cancer Surveillance Guidelines",
        "category":         "oncology",
        "priority":         "urgent",
        "applies_to":       ["colorectal_cancer_surveillance"],
    },
}


# ── Category fallback intervals ─────────────────────────────────────────────────
# Used when a canonical_metric_name is not in METRIC_INTERVALS.

CATEGORY_INTERVALS: dict[str, dict] = {
    "haematology": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Blood Count Panel",
        "suggested_action": "Schedule a routine complete blood count (CBC).",
        "guideline_source": "General preventive care",
        "priority":         "routine",
    },
    "metabolic": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Metabolic Panel",
        "suggested_action": "Schedule a comprehensive metabolic panel (CMP).",
        "guideline_source": "General preventive care",
        "priority":         "routine",
    },
    "lipids": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Lipid Panel",
        "suggested_action": "Schedule a fasting lipid panel.",
        "guideline_source": "AHA/ACC Cardiovascular Risk Guidelines",
        "priority":         "routine",
    },
    "thyroid": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Thyroid Function Panel",
        "suggested_action": "Schedule thyroid function tests (TSH, Free T4).",
        "guideline_source": "ATA Thyroid Disease Guidelines",
        "priority":         "surveillance",
    },
    "iron": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Iron Panel",
        "suggested_action": "Repeat iron studies (ferritin, serum iron, TIBC).",
        "guideline_source": "Iron deficiency monitoring guidelines",
        "priority":         "surveillance",
    },
    "vitamins": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Vitamin / Micronutrient Panel",
        "suggested_action": "Repeat key vitamin and mineral levels.",
        "guideline_source": "General preventive care",
        "priority":         "routine",
    },
    "inflammation": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Inflammatory Markers",
        "suggested_action": "Repeat inflammatory markers (CRP, ESR).",
        "guideline_source": "General preventive care",
        "priority":         "surveillance",
    },
    "hormones": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Hormone Panel",
        "suggested_action": "Schedule a comprehensive hormone panel with your specialist.",
        "guideline_source": "Endocrine Society Guidelines",
        "priority":         "surveillance",
    },
    "cardiac": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Cardiac Markers",
        "suggested_action": "Repeat cardiac markers as directed by your cardiologist.",
        "guideline_source": "AHA Cardiovascular Guidelines",
        "priority":         "surveillance",
    },
    "oncology": {
        "interval_days":    180,
        "due_soon_days":    45,
        "label":            "Oncology / Tumour Markers",
        "suggested_action": "Schedule repeat tumour marker testing as part of your oncology follow-up.",
        "guideline_source": "ASCO Surveillance Guidelines",
        "priority":         "urgent",
    },
    "imaging_score": {
        "interval_days":    365,
        "due_soon_days":    45,
        "label":            "Imaging / Screening Scan",
        "suggested_action": "Schedule your next screening scan.",
        "guideline_source": "USPSTF Preventive Services Guidelines",
        "priority":         "surveillance",
    },
    "mental_health": {
        "interval_days":    180,
        "due_soon_days":    30,
        "label":            "Mental Health Assessment",
        "suggested_action": "Schedule a mental health check-in with your GP or therapist.",
        "guideline_source": "USPSTF Depression Screening Guidelines",
        "priority":         "surveillance",
    },
    "other": {
        "interval_days":    365,
        "due_soon_days":    30,
        "label":            "Health Check",
        "suggested_action": "Schedule a follow-up with your healthcare provider.",
        "guideline_source": "General preventive care",
        "priority":         "routine",
    },
}


def get_interval(canonical_metric_name: str, category: str) -> dict | None:
    """
    Return the interval config for a metric.
    Falls back to category-level config if no metric-specific entry exists.
    Returns None if neither is found.
    """
    entry = METRIC_INTERVALS.get(canonical_metric_name)
    if entry:
        return dict(entry)
    return CATEGORY_INTERVALS.get(category or "other")

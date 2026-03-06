"""
Map clusters to root patterns via rule-based mapping table and gate evaluation.
Phase 7: educational patterns only; no diagnosis or treatment recommendations.
"""

from typing import Any, Dict, List, Optional, Tuple

from engine.types import ClusterResult, RootPatternResult

# --- Embedded mapping table (source of truth) ---

ROOT_PATTERN_MAPPING_ROWS = [
    # CL_ENERGY_VAR
    {"cluster_id": "CL_ENERGY_VAR", "root_pattern_id": "RP_BLOOD_SUGAR",      "weight": 0.35, "gating": "post_meal_crash_true OR cluster_sugar_instab_ge_40", "evidence_level": "Moderate"},
    {"cluster_id": "CL_ENERGY_VAR", "root_pattern_id": "RP_SLEEP_DEPRIVATION","weight": 0.30, "gating": "cluster_sleep_disrupt_ge_40 OR sig_unrefreshed_ge_50", "evidence_level": "High"},
    {"cluster_id": "CL_ENERGY_VAR", "root_pattern_id": "RP_STRESS_LOAD",      "weight": 0.20, "gating": "cluster_stress_accum_ge_40 OR stress_level_ge_3", "evidence_level": "Moderate"},
    {"cluster_id": "CL_ENERGY_VAR", "root_pattern_id": "RP_MICRO_DEPLETION",  "weight": 0.15, "gating": "cluster_iron_pattern_ge_40 OR (sig_hair_loss_ge_50 AND sig_fatigue_ge_50)", "evidence_level": "Moderate"},

    # CL_STRESS_ACCUM
    {"cluster_id": "CL_STRESS_ACCUM", "root_pattern_id": "RP_STRESS_LOAD",       "weight": 0.55, "gating": "stress_level_ge_3 AND (sig_anxiety_ge_50 OR sig_wake_3am_ge_50)", "evidence_level": "High"},
    {"cluster_id": "CL_STRESS_ACCUM", "root_pattern_id": "RP_CORTISOL_RHYTHM",   "weight": 0.25, "gating": "sig_wake_3am_ge_60 OR (sig_insomnia_ge_50 AND insomnia_night_like)", "evidence_level": "Moderate"},
    {"cluster_id": "CL_STRESS_ACCUM", "root_pattern_id": "RP_SLEEP_DEPRIVATION", "weight": 0.10, "gating": "cluster_sleep_disrupt_ge_50", "evidence_level": "High"},
    {"cluster_id": "CL_STRESS_ACCUM", "root_pattern_id": "RP_NERVOUS_DYS",       "weight": 0.10, "gating": "sig_palpitations_ge_50 OR sig_irritable_ge_60", "evidence_level": "Clinical_Practice"},

    # CL_SLEEP_DISRUPT
    {"cluster_id": "CL_SLEEP_DISRUPT", "root_pattern_id": "RP_SLEEP_DEPRIVATION", "weight": 0.60, "gating": "cluster_sleep_disrupt_ge_50", "evidence_level": "High"},
    {"cluster_id": "CL_SLEEP_DISRUPT", "root_pattern_id": "RP_CORTISOL_RHYTHM",   "weight": 0.20, "gating": "sig_wake_3am_ge_60", "evidence_level": "Moderate"},
    {"cluster_id": "CL_SLEEP_DISRUPT", "root_pattern_id": "RP_STRESS_LOAD",       "weight": 0.15, "gating": "cluster_stress_accum_ge_40 OR stress_level_ge_3", "evidence_level": "High"},
    {"cluster_id": "CL_SLEEP_DISRUPT", "root_pattern_id": "RP_PROG_LOW",          "weight": 0.05, "gating": "phase_luteal_or_premenstrual AND life_stage_cycle_applicable", "evidence_level": "Emerging"},
    {"cluster_id": "CL_SLEEP_DISRUPT", "root_pattern_id": "RP_VASOMOTOR_CTX",     "weight": 0.10, "gating": "vasomotor_life_stage AND sig_night_sweats_ge_50", "evidence_level": "Clinical_Practice"},
    {"cluster_id": "CL_SLEEP_DISRUPT", "root_pattern_id": "RP_PERI_TRANSITION",   "weight": 0.05, "gating": "is_perimenopause AND cluster_sleep_disrupt_ge_50", "evidence_level": "Clinical_Practice"},

    # CL_CYCLE_VAR
    {"cluster_id": "CL_CYCLE_VAR", "root_pattern_id": "RP_PROG_LOW",         "weight": 0.30, "gating": "phase_luteal_or_premenstrual AND (sig_pms_ge_50 OR sig_insomnia_ge_50)", "evidence_level": "Emerging"},
    {"cluster_id": "CL_CYCLE_VAR", "root_pattern_id": "RP_ESTRO_DOM",        "weight": 0.25, "gating": "sig_heavy_bleed_ge_50 OR sig_breast_tender_ge_50 OR sig_bloating_ge_50", "evidence_level": "Emerging"},
    {"cluster_id": "CL_CYCLE_VAR", "root_pattern_id": "RP_ANDRO_EXCESS",     "weight": 0.25, "gating": "sig_acne_ge_50 AND (sig_irreg_cycle_ge_50 OR cycle_length_gt_35)", "evidence_level": "Moderate"},
    {"cluster_id": "CL_CYCLE_VAR", "root_pattern_id": "RP_STRESS_LOAD",      "weight": 0.10, "gating": "cluster_stress_accum_ge_50 OR stress_level_ge_4", "evidence_level": "Moderate"},
    {"cluster_id": "CL_CYCLE_VAR", "root_pattern_id": "RP_SLEEP_DEPRIVATION","weight": 0.10, "gating": "cluster_sleep_disrupt_ge_50", "evidence_level": "High"},
    {"cluster_id": "CL_CYCLE_VAR", "root_pattern_id": "RP_PERI_TRANSITION",  "weight": 0.10, "gating": "is_perimenopause AND (sig_irreg_cycle_ge_50 OR sig_missed_period_ge_50)", "evidence_level": "Clinical_Practice"},

    # CL_SUGAR_INSTAB
    {"cluster_id": "CL_SUGAR_INSTAB", "root_pattern_id": "RP_BLOOD_SUGAR",      "weight": 0.75, "gating": "post_meal_crash_true OR (sig_sugar_crave_ge_50 AND sig_afternoon_crash_ge_50)", "evidence_level": "High"},
    {"cluster_id": "CL_SUGAR_INSTAB", "root_pattern_id": "RP_SLEEP_DEPRIVATION","weight": 0.10, "gating": "cluster_sleep_disrupt_ge_50", "evidence_level": "High"},
    {"cluster_id": "CL_SUGAR_INSTAB", "root_pattern_id": "RP_STRESS_LOAD",      "weight": 0.10, "gating": "cluster_stress_accum_ge_50", "evidence_level": "Moderate"},
    {"cluster_id": "CL_SUGAR_INSTAB", "root_pattern_id": "RP_ANDRO_EXCESS",     "weight": 0.05, "gating": "modifier_pcos_like OR (sig_acne_ge_60 AND sig_irreg_cycle_ge_60)", "evidence_level": "Moderate"},

    # CL_IRON_PATTERN
    {"cluster_id": "CL_IRON_PATTERN", "root_pattern_id": "RP_IRON_DEPLETION",   "weight": 0.80, "gating": "(sig_heavy_bleed_ge_50 OR period_heaviness_heavy_like) AND (sig_fatigue_ge_50 OR sig_hair_loss_ge_50)", "evidence_level": "High"},
    {"cluster_id": "CL_IRON_PATTERN", "root_pattern_id": "RP_MICRO_DEPLETION",  "weight": 0.15, "gating": "modifier_veg_like OR (sig_brittle_nails_ge_50 AND sig_fatigue_ge_50)", "evidence_level": "Moderate"},
    {"cluster_id": "CL_IRON_PATTERN", "root_pattern_id": "RP_GUT_DYSBIOSIS",    "weight": 0.05, "gating": "cluster_gut_pattern_ge_60", "evidence_level": "Emerging"},

    # CL_THYROID_SIGNALS
    {"cluster_id": "CL_THYROID_SIGNALS", "root_pattern_id": "RP_THYROID_SLOWING", "weight": 0.80, "gating": "(sig_cold_intol_ge_55 AND sig_dry_skin_ge_50) OR (sig_weight_resist_ge_55 AND sig_fatigue_ge_55)", "evidence_level": "Clinical_Practice"},
    {"cluster_id": "CL_THYROID_SIGNALS", "root_pattern_id": "RP_MICRO_DEPLETION", "weight": 0.10, "gating": "cluster_iron_pattern_ge_50 OR cluster_energy_var_ge_60", "evidence_level": "Moderate"},
    {"cluster_id": "CL_THYROID_SIGNALS", "root_pattern_id": "RP_SLEEP_DEPRIVATION","weight": 0.10, "gating": "cluster_sleep_disrupt_ge_50", "evidence_level": "High"},

    # CL_TRAIN_MISMATCH
    {"cluster_id": "CL_TRAIN_MISMATCH", "root_pattern_id": "RP_OVERTRAIN",        "weight": 0.70, "gating": "high_training_load AND (sig_unrefreshed_ge_50 OR sig_fatigue_ge_60 OR sig_ex_intol_ge_50)", "evidence_level": "Clinical_Practice"},
    {"cluster_id": "CL_TRAIN_MISMATCH", "root_pattern_id": "RP_STRESS_LOAD",      "weight": 0.15, "gating": "cluster_stress_accum_ge_50 OR stress_level_ge_4", "evidence_level": "Moderate"},
    {"cluster_id": "CL_TRAIN_MISMATCH", "root_pattern_id": "RP_MICRO_DEPLETION",  "weight": 0.10, "gating": "cluster_iron_pattern_ge_50 OR modifier_endurance_or_veg", "evidence_level": "Moderate"},
    {"cluster_id": "CL_TRAIN_MISMATCH", "root_pattern_id": "RP_SLEEP_DEPRIVATION","weight": 0.05, "gating": "cluster_sleep_disrupt_ge_50", "evidence_level": "High"},

    # CL_GUT_PATTERN
    {"cluster_id": "CL_GUT_PATTERN", "root_pattern_id": "RP_GUT_DYSBIOSIS",     "weight": 0.75, "gating": "(sig_bloating_ge_55 AND (sig_constip_ge_55 OR sig_diarrhea_ge_55)) OR food_sensitivity_true", "evidence_level": "Emerging"},
    {"cluster_id": "CL_GUT_PATTERN", "root_pattern_id": "RP_STRESS_LOAD",       "weight": 0.15, "gating": "cluster_stress_accum_ge_50 OR stress_level_ge_4", "evidence_level": "Moderate"},
    {"cluster_id": "CL_GUT_PATTERN", "root_pattern_id": "RP_MICRO_DEPLETION",   "weight": 0.10, "gating": "(sig_fatigue_ge_60 AND cluster_gut_pattern_ge_60) OR (lab_b12_missing_and_veg_like)", "evidence_level": "Moderate"},

    # CL_INFLAM_LOAD
    {"cluster_id": "CL_INFLAM_LOAD", "root_pattern_id": "RP_STRESS_LOAD",       "weight": 0.25, "gating": "cluster_stress_accum_ge_50", "evidence_level": "Moderate"},
    {"cluster_id": "CL_INFLAM_LOAD", "root_pattern_id": "RP_SLEEP_DEPRIVATION", "weight": 0.20, "gating": "cluster_sleep_disrupt_ge_60", "evidence_level": "High"},
    {"cluster_id": "CL_INFLAM_LOAD", "root_pattern_id": "RP_GUT_DYSBIOSIS",     "weight": 0.25, "gating": "cluster_gut_pattern_ge_60", "evidence_level": "Emerging"},
    {"cluster_id": "CL_INFLAM_LOAD", "root_pattern_id": "RP_MICRO_DEPLETION",   "weight": 0.15, "gating": "cluster_iron_pattern_ge_50 OR cluster_energy_var_ge_60", "evidence_level": "Moderate"},
    {"cluster_id": "CL_INFLAM_LOAD", "root_pattern_id": "RP_INFLAM_CTX",        "weight": 0.15, "gating": "lab_crp_present OR (cluster_gut_pattern_ge_60 AND cluster_sleep_disrupt_ge_60)", "evidence_level": "Emerging"},

    # Additional peri / vasomotor crossover from non-primary clusters
    {"cluster_id": "CL_ENERGY_VAR",   "root_pattern_id": "RP_VASOMOTOR_CTX",   "weight": 0.05, "gating": "peri_or_meno_like AND sig_night_sweats_ge_50 AND cluster_sleep_disrupt_ge_50", "evidence_level": "Clinical_Practice"},
    {"cluster_id": "CL_STRESS_ACCUM", "root_pattern_id": "RP_PERI_TRANSITION", "weight": 0.05, "gating": "is_perimenopause AND (sig_anxiety_ge_50 OR sig_irritable_ge_50)", "evidence_level": "Clinical_Practice"},
]


def _num(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


# --- Task 7.2: scoring and confidence helpers ---

def clamp_0_100(value: float) -> float:
    """Clamp value to [0, 100]."""
    return max(0.0, min(100.0, float(value)))


EVIDENCE_PRECEDENCE: Dict[str, int] = {
    "High": 4,
    "Clinical_Practice": 3,
    "Moderate": 2,
    "Emerging": 1,
}

EVIDENCE_CONFIDENCE_BONUS: Dict[str, float] = {
    "High": 10.0,
    "Moderate": 5.0,
    "Emerging": 0.0,
    "Clinical_Practice": 6.0,
}


def evidence_precedence(level: str) -> int:
    """Return precedence for evidence level (higher = stronger)."""
    return EVIDENCE_PRECEDENCE.get(level, 0)


def choose_pattern_evidence(evidence_levels: List[str]) -> Optional[str]:
    """Choose highest-priority evidence level among candidates. Display label only."""
    if not evidence_levels:
        return None
    cleaned = [e for e in evidence_levels if e]
    if not cleaned:
        return None
    return max(cleaned, key=evidence_precedence)


def contributor_bonus(num_clusters: int) -> float:
    """Bonus for number of distinct contributing clusters."""
    if num_clusters <= 1:
        return 0.0
    if num_clusters == 2:
        return 8.0
    if num_clusters == 3:
        return 15.0
    return 20.0  # 4+


def _build_gate_context(
    cluster_map: Dict[str, float],
    signal_map: Dict[str, float],
    derived_flags: Dict[str, Any],
    normalized_survey: Any,
    normalized_labs: Optional[List[Any]] = None,
) -> Dict[str, bool]:
    """Build a flat dict of atomic gate keys -> bool for evaluators."""
    flags = derived_flags or {}
    survey = normalized_survey
    labs = normalized_labs or []

    def sig(symptom_id: str) -> float:
        return float(signal_map.get(symptom_id, 0.0))

    def cl(cluster_id: str) -> float:
        return float(cluster_map.get(cluster_id, 0.0))

    life_stage = getattr(survey, "life_stage", None) if survey else None
    lifestyle = getattr(survey, "lifestyle_fields", None) or {} if survey else {}
    modifier_flags = getattr(survey, "modifier_flags", None) or {} if survey else {}
    period_heaviness = getattr(survey, "period_heaviness", None) if survey else None
    cycle_length_days = getattr(survey, "cycle_length_days", None) if survey else None
    symptom_inputs = getattr(survey, "symptom_inputs", None) or [] if survey else []

    lab_ids = {getattr(lab, "lab_id", lab.get("lab_id") if isinstance(lab, dict) else None) for lab in labs}
    lab_ids = {x for x in lab_ids if x}

    ctx: Dict[str, bool] = {}

    # Cluster-threshold gates
    ctx["cluster_sugar_instab_ge_40"] = cl("CL_SUGAR_INSTAB") >= 40
    ctx["cluster_sleep_disrupt_ge_40"] = cl("CL_SLEEP_DISRUPT") >= 40
    ctx["cluster_sleep_disrupt_ge_50"] = cl("CL_SLEEP_DISRUPT") >= 50
    ctx["cluster_sleep_disrupt_ge_60"] = cl("CL_SLEEP_DISRUPT") >= 60
    ctx["cluster_stress_accum_ge_40"] = cl("CL_STRESS_ACCUM") >= 40
    ctx["cluster_stress_accum_ge_50"] = cl("CL_STRESS_ACCUM") >= 50
    ctx["cluster_gut_pattern_ge_60"] = cl("CL_GUT_PATTERN") >= 60
    ctx["cluster_iron_pattern_ge_40"] = cl("CL_IRON_PATTERN") >= 40
    ctx["cluster_iron_pattern_ge_50"] = cl("CL_IRON_PATTERN") >= 50
    ctx["cluster_energy_var_ge_60"] = cl("CL_ENERGY_VAR") >= 60

    # Signal-threshold gates
    ctx["sig_unrefreshed_ge_50"] = sig("SYM_UNREFRESHED") >= 50
    ctx["sig_anxiety_ge_50"] = sig("SYM_ANXIETY") >= 50
    ctx["sig_wake_3am_ge_50"] = sig("SYM_WAKE_3AM") >= 50
    ctx["sig_wake_3am_ge_60"] = sig("SYM_WAKE_3AM") >= 60
    ctx["sig_insomnia_ge_50"] = sig("SYM_INSOMNIA") >= 50
    ctx["sig_palpitations_ge_50"] = sig("SYM_PALPITATIONS") >= 50
    ctx["sig_irritable_ge_60"] = sig("SYM_IRRITABLE") >= 60
    ctx["sig_pms_ge_50"] = sig("SYM_PMS") >= 50
    ctx["sig_heavy_bleed_ge_50"] = sig("SYM_HEAVY_BLEED") >= 50
    ctx["sig_breast_tender_ge_50"] = sig("SYM_BREAST_TENDER") >= 50
    ctx["sig_bloating_ge_50"] = sig("SYM_BLOATING") >= 50
    ctx["sig_bloating_ge_55"] = sig("SYM_BLOATING") >= 55
    ctx["sig_acne_ge_50"] = sig("SYM_ACNE") >= 50
    ctx["sig_acne_ge_60"] = sig("SYM_ACNE") >= 60
    ctx["sig_irreg_cycle_ge_50"] = sig("SYM_IRREG_CYCLE") >= 50
    ctx["sig_irreg_cycle_ge_60"] = sig("SYM_IRREG_CYCLE") >= 60
    ctx["sig_missed_period_ge_50"] = sig("SYM_MISSED_PERIOD") >= 50
    ctx["sig_sugar_crave_ge_50"] = sig("SYM_SUGAR_CRAVE") >= 50
    ctx["sig_afternoon_crash_ge_50"] = sig("SYM_AFTERNOON_CRASH") >= 50
    ctx["sig_hair_loss_ge_50"] = sig("SYM_HAIR_LOSS") >= 50
    ctx["sig_fatigue_ge_50"] = sig("SYM_FATIGUE") >= 50
    ctx["sig_fatigue_ge_55"] = sig("SYM_FATIGUE") >= 55
    ctx["sig_fatigue_ge_60"] = sig("SYM_FATIGUE") >= 60
    ctx["sig_brittle_nails_ge_50"] = sig("SYM_BRITTLE_NAILS") >= 50
    ctx["sig_cold_intol_ge_55"] = sig("SYM_COLD_INTOL") >= 55
    ctx["sig_dry_skin_ge_50"] = sig("SYM_DRY_SKIN") >= 50
    ctx["sig_weight_resist_ge_55"] = sig("SYM_WEIGHT_RESIST") >= 55
    ctx["sig_ex_intol_ge_50"] = sig("SYM_EX_INTOL") >= 50
    ctx["sig_constip_ge_55"] = sig("SYM_CONSTIP") >= 55
    ctx["sig_diarrhea_ge_55"] = sig("SYM_DIARRHEA") >= 55
    ctx["sig_night_sweats_ge_50"] = sig("SYM_NIGHT_SWEATS") >= 50

    # Derived/context gates
    ctx["post_meal_crash_true"] = bool(flags.get("post_meal_crash"))
    stress_level = _num(flags.get("stress_level") or lifestyle.get("stress_level"), 0.0)
    ctx["stress_level_ge_3"] = stress_level >= 3
    ctx["stress_level_ge_4"] = stress_level >= 4
    ctx["food_sensitivity_true"] = bool(flags.get("food_sensitivity") or lifestyle.get("food_sensitivity"))

    high_training = (
        bool(flags.get("endurance_training") or modifier_flags.get("endurance_training"))
        or _num(flags.get("exercise_days") or lifestyle.get("exercise_days"), 0.0) >= 5
        or _num(flags.get("endurance_minutes_week") or lifestyle.get("endurance_minutes_week"), 0.0) >= 180
    )
    ctx["high_training_load"] = high_training

    ctx["modifier_veg_like"] = bool(flags.get("vegetarian_or_vegan") or modifier_flags.get("vegetarian_or_vegan"))
    ctx["modifier_endurance_or_veg"] = bool(
        flags.get("endurance_training") or modifier_flags.get("endurance_training")
        or flags.get("vegetarian_or_vegan") or modifier_flags.get("vegetarian_or_vegan")
    )
    ctx["modifier_pcos_like"] = bool(
        modifier_flags.get("pcos_like")
        or (sig("SYM_ACNE") >= 50 and sig("SYM_IRREG_CYCLE") >= 50)
    )

    ctx["lab_crp_present"] = "LAB_CRP" in lab_ids
    ctx["lab_b12_missing_and_veg_like"] = "LAB_B12" not in lab_ids and ctx["modifier_veg_like"]

    ctx["period_heaviness_heavy_like"] = period_heaviness in ("heavy", "very_heavy")
    ctx["cycle_length_gt_35"] = cycle_length_days == ">35"

    ctx["is_perimenopause"] = life_stage == "LS_PERI"
    ctx["peri_or_meno_like"] = bool(
        life_stage in ("LS_PERI", "LS_MENO", "LS_POSTMENO", "LS_SURG_MENO")
        or flags.get("is_menopause_stage")
    )
    ctx["vasomotor_life_stage"] = life_stage in ("LS_PERI", "LS_MENO", "LS_POSTMENO", "LS_SURG_MENO")
    ctx["life_stage_cycle_applicable"] = bool(flags.get("cycle_applicable"))

    phase_luteal_pre = any(
        getattr(inp, "phase_link", None) in ("luteal", "premenstrual")
        for inp in symptom_inputs
        if hasattr(inp, "phase_link")
    )
    ctx["phase_luteal_or_premenstrual"] = phase_luteal_pre

    ctx["insomnia_night_like"] = sig("SYM_INSOMNIA") >= 50 and (sig("SYM_WAKE_3AM") >= 40 or True)

    return ctx


def _evaluate_gating_string(gating: str, ctx: Dict[str, bool]) -> bool:
    """Evaluate a single gating string (no parser; explicit branches per distinct string)."""
    # All distinct gating strings from ROOT_PATTERN_MAPPING_ROWS
    g = gating.strip()
    c = ctx.get

    if g == "post_meal_crash_true OR cluster_sugar_instab_ge_40":
        return c("post_meal_crash_true") or c("cluster_sugar_instab_ge_40")
    if g == "cluster_sleep_disrupt_ge_40 OR sig_unrefreshed_ge_50":
        return c("cluster_sleep_disrupt_ge_40") or c("sig_unrefreshed_ge_50")
    if g == "cluster_stress_accum_ge_40 OR stress_level_ge_3":
        return c("cluster_stress_accum_ge_40") or c("stress_level_ge_3")
    if g == "cluster_iron_pattern_ge_40 OR (sig_hair_loss_ge_50 AND sig_fatigue_ge_50)":
        return c("cluster_iron_pattern_ge_40") or (c("sig_hair_loss_ge_50") and c("sig_fatigue_ge_50"))

    if g == "stress_level_ge_3 AND (sig_anxiety_ge_50 OR sig_wake_3am_ge_50)":
        return c("stress_level_ge_3") and (c("sig_anxiety_ge_50") or c("sig_wake_3am_ge_50"))
    if g == "sig_wake_3am_ge_60 OR (sig_insomnia_ge_50 AND insomnia_night_like)":
        return c("sig_wake_3am_ge_60") or (c("sig_insomnia_ge_50") and c("insomnia_night_like"))
    if g == "cluster_sleep_disrupt_ge_50":
        return c("cluster_sleep_disrupt_ge_50")
    if g == "sig_palpitations_ge_50 OR sig_irritable_ge_60":
        return c("sig_palpitations_ge_50") or c("sig_irritable_ge_60")

    if g == "sig_wake_3am_ge_60":
        return c("sig_wake_3am_ge_60")
    if g == "phase_luteal_or_premenstrual AND life_stage_cycle_applicable":
        return c("phase_luteal_or_premenstrual") and c("life_stage_cycle_applicable")
    if g == "vasomotor_life_stage AND sig_night_sweats_ge_50":
        return c("vasomotor_life_stage") and c("sig_night_sweats_ge_50")
    if g == "is_perimenopause AND cluster_sleep_disrupt_ge_50":
        return c("is_perimenopause") and c("cluster_sleep_disrupt_ge_50")

    if g == "phase_luteal_or_premenstrual AND (sig_pms_ge_50 OR sig_insomnia_ge_50)":
        return c("phase_luteal_or_premenstrual") and (c("sig_pms_ge_50") or c("sig_insomnia_ge_50"))
    if g == "sig_heavy_bleed_ge_50 OR sig_breast_tender_ge_50 OR sig_bloating_ge_50":
        return c("sig_heavy_bleed_ge_50") or c("sig_breast_tender_ge_50") or c("sig_bloating_ge_50")
    if g == "sig_acne_ge_50 AND (sig_irreg_cycle_ge_50 OR cycle_length_gt_35)":
        return c("sig_acne_ge_50") and (c("sig_irreg_cycle_ge_50") or c("cycle_length_gt_35"))
    if g == "cluster_stress_accum_ge_50 OR stress_level_ge_4":
        return c("cluster_stress_accum_ge_50") or c("stress_level_ge_4")
    if g == "is_perimenopause AND (sig_irreg_cycle_ge_50 OR sig_missed_period_ge_50)":
        return c("is_perimenopause") and (c("sig_irreg_cycle_ge_50") or c("sig_missed_period_ge_50"))

    if g == "post_meal_crash_true OR (sig_sugar_crave_ge_50 AND sig_afternoon_crash_ge_50)":
        return c("post_meal_crash_true") or (c("sig_sugar_crave_ge_50") and c("sig_afternoon_crash_ge_50"))
    if g == "modifier_pcos_like OR (sig_acne_ge_60 AND sig_irreg_cycle_ge_60)":
        return c("modifier_pcos_like") or (c("sig_acne_ge_60") and c("sig_irreg_cycle_ge_60"))

    if g == "(sig_heavy_bleed_ge_50 OR period_heaviness_heavy_like) AND (sig_fatigue_ge_50 OR sig_hair_loss_ge_50)":
        return (c("sig_heavy_bleed_ge_50") or c("period_heaviness_heavy_like")) and (c("sig_fatigue_ge_50") or c("sig_hair_loss_ge_50"))
    if g == "modifier_veg_like OR (sig_brittle_nails_ge_50 AND sig_fatigue_ge_50)":
        return c("modifier_veg_like") or (c("sig_brittle_nails_ge_50") and c("sig_fatigue_ge_50"))
    if g == "cluster_gut_pattern_ge_60":
        return c("cluster_gut_pattern_ge_60")

    if g == "(sig_cold_intol_ge_55 AND sig_dry_skin_ge_50) OR (sig_weight_resist_ge_55 AND sig_fatigue_ge_55)":
        return (c("sig_cold_intol_ge_55") and c("sig_dry_skin_ge_50")) or (c("sig_weight_resist_ge_55") and c("sig_fatigue_ge_55"))
    if g == "cluster_iron_pattern_ge_50 OR cluster_energy_var_ge_60":
        return c("cluster_iron_pattern_ge_50") or c("cluster_energy_var_ge_60")

    if g == "high_training_load AND (sig_unrefreshed_ge_50 OR sig_fatigue_ge_60 OR sig_ex_intol_ge_50)":
        return c("high_training_load") and (c("sig_unrefreshed_ge_50") or c("sig_fatigue_ge_60") or c("sig_ex_intol_ge_50"))
    if g == "cluster_iron_pattern_ge_50 OR modifier_endurance_or_veg":
        return c("cluster_iron_pattern_ge_50") or c("modifier_endurance_or_veg")

    if g == "(sig_bloating_ge_55 AND (sig_constip_ge_55 OR sig_diarrhea_ge_55)) OR food_sensitivity_true":
        return (c("sig_bloating_ge_55") and (c("sig_constip_ge_55") or c("sig_diarrhea_ge_55"))) or c("food_sensitivity_true")
    if g == "(sig_fatigue_ge_60 AND cluster_gut_pattern_ge_60) OR (lab_b12_missing_and_veg_like)":
        return (c("sig_fatigue_ge_60") and c("cluster_gut_pattern_ge_60")) or c("lab_b12_missing_and_veg_like")

    if g == "cluster_stress_accum_ge_50":
        return c("cluster_stress_accum_ge_50")
    if g == "cluster_sleep_disrupt_ge_60":
        return c("cluster_sleep_disrupt_ge_60")
    if g == "lab_crp_present OR (cluster_gut_pattern_ge_60 AND cluster_sleep_disrupt_ge_60)":
        return c("lab_crp_present") or (c("cluster_gut_pattern_ge_60") and c("cluster_sleep_disrupt_ge_60"))

    if g == "peri_or_meno_like AND sig_night_sweats_ge_50 AND cluster_sleep_disrupt_ge_50":
        return c("peri_or_meno_like") and c("sig_night_sweats_ge_50") and c("cluster_sleep_disrupt_ge_50")
    if g == "is_perimenopause AND (sig_anxiety_ge_50 OR sig_irritable_ge_50)":
        return c("is_perimenopause") and (c("sig_anxiety_ge_50") or c("sig_irritable_ge_50"))

    return False


def evaluate_root_pattern_gate(
    gating_key: str,
    cluster_map: Dict[str, float],
    signal_map: Dict[str, float],
    derived_flags: Dict[str, Any],
    normalized_survey: Any,
    normalized_labs: Optional[List[Any]] = None,
) -> bool:
    """Evaluate a single gating condition for root-pattern mapping."""
    ctx = _build_gate_context(
        cluster_map, signal_map, derived_flags, normalized_survey, normalized_labs
    )
    return _evaluate_gating_string(gating_key, ctx)


def _finalize_pattern_results(
    pattern_score_raw: Dict[str, float],
    pattern_contributing: Dict[str, List[Dict[str, Any]]],
    registry: Any,
) -> List[RootPatternResult]:
    """
    Convert raw contributions into RootPatternResult with score, confidence,
    evidence level, and explain_meta. Apply conservative caps. Sort by score desc,
    then evidence precedence, then pattern_id. Return only score > 0.
    """
    results: List[RootPatternResult] = []

    for pattern_id, raw_sum in pattern_score_raw.items():
        score = clamp_0_100(raw_sum)
        if score <= 0:
            continue

        contributions = pattern_contributing.get(pattern_id, [])
        contributing_clusters = list(dict.fromkeys(c["cluster_id"] for c in contributions))
        evidence_levels = [c.get("evidence_level") or "" for c in contributions if c.get("evidence_level")]
        fallback_only = len(contributions) > 0 and all(c.get("fallback_used") for c in contributions)

        chosen_evidence = choose_pattern_evidence(evidence_levels)
        num_clusters = len(contributing_clusters)
        contrib_bonus = contributor_bonus(num_clusters)
        evidence_bonus = EVIDENCE_CONFIDENCE_BONUS.get(chosen_evidence, 0.0)

        confidence = min(
            100.0,
            0.75 * score + contrib_bonus + evidence_bonus,
        )
        if score == 0:
            confidence = 0.0
        if chosen_evidence == "Emerging":
            confidence = min(confidence, 75.0)
        if pattern_id == "RP_INFLAM_CTX":
            confidence = min(confidence, 70.0)
        if fallback_only:
            confidence = min(confidence, 60.0)

        canon = registry.resolve_id(pattern_id) if registry else pattern_id
        evidence_candidates = list(dict.fromkeys(e for e in evidence_levels if e))

        explain_meta: Dict[str, Any] = {
            "contributing_clusters": contributing_clusters,
            "raw_contribution_sum": raw_sum,
            "rows_used": len(contributions),
            "fallback_only": fallback_only,
            "evidence_candidates": evidence_candidates,
        }

        results.append(
            RootPatternResult(
                pattern_id=canon,
                score=round(score, 4),
                confidence=round(confidence, 4),
                evidence_level=chosen_evidence,
                explain_meta=explain_meta,
            )
        )

    results.sort(
        key=lambda r: (
            -r.score,
            -evidence_precedence(r.evidence_level or ""),
            r.pattern_id,
        )
    )
    return results


def map_root_patterns(
    clusters: List[ClusterResult],
    systems: Any,
    derived_flags: Dict[str, Any],
    normalized_survey: Any,
    registry: Any,
    config: Any,
    signal_scores: Optional[List[Any]] = None,
    normalized_labs: Optional[List[Any]] = None,
) -> Tuple[List[RootPatternResult], Dict[str, Any]]:
    """
    Map clusters to root-pattern contributions using the embedded mapping table.
    Returns (root_patterns, mapping_meta). Fallback: if all gates fail for a cluster,
    use the highest-weight row for that cluster and set fallback_used=True.
    """
    cluster_map = {c.cluster_id: c.strength for c in (clusters or [])}
    signal_list = signal_scores or []
    signal_map = {s.symptom_id: s.score for s in signal_list if hasattr(s, "symptom_id") and hasattr(s, "score")}

    ctx = _build_gate_context(
        cluster_map, signal_map, derived_flags, normalized_survey, normalized_labs
    )

    # Per-cluster rows (preserve order for deterministic fallback)
    rows_by_cluster: Dict[str, List[Dict]] = {}
    for row in ROOT_PATTERN_MAPPING_ROWS:
        cid = row["cluster_id"]
        if cid not in rows_by_cluster:
            rows_by_cluster[cid] = []
        rows_by_cluster[cid].append(row)

    pattern_score_raw: Dict[str, float] = {}
    pattern_contributing: Dict[str, List[Dict[str, Any]]] = {}
    mapping_meta: Dict[str, Any] = {"cluster_mapping": {}}

    for cluster in clusters or []:
        cid = cluster.cluster_id
        strength = float(cluster.strength)
        rows = rows_by_cluster.get(cid, [])

        passed = []
        for row in rows:
            if _evaluate_gating_string(row["gating"], ctx):
                passed.append(row)

        fallback_used = False
        if not passed:
            # Fallback: use highest-weight row for this cluster
            if rows:
                best = max(rows, key=lambda r: r["weight"])
                passed = [best]
                fallback_used = True
                mapping_meta["cluster_mapping"][cid] = {
                    "passed_rows": [{"root_pattern_id": best["root_pattern_id"], "weight": best["weight"]}],
                    "fallback_used": True,
                }
            else:
                mapping_meta["cluster_mapping"][cid] = {"passed_rows": [], "fallback_used": False}
                continue
        else:
            mapping_meta["cluster_mapping"][cid] = {
                "passed_rows": [{"root_pattern_id": r["root_pattern_id"], "weight": r["weight"]} for r in passed],
                "fallback_used": False,
            }

        for row in passed:
            rpid = row["root_pattern_id"]
            weight = row["weight"]
            contrib = strength * weight
            pattern_score_raw[rpid] = pattern_score_raw.get(rpid, 0.0) + contrib
            if rpid not in pattern_contributing:
                pattern_contributing[rpid] = []
            pattern_contributing[rpid].append({
                "cluster_id": cid,
                "weight": weight,
                "contribution": contrib,
                "evidence_level": row.get("evidence_level") or "",
                "fallback_used": fallback_used,
            })

    root_patterns = _finalize_pattern_results(
        pattern_score_raw, pattern_contributing, registry
    )
    return root_patterns, mapping_meta

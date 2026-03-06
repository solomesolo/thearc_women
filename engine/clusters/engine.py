"""
Compute cluster strength and base confidence from signals and flags.
Phase 3: entry gates, support signals, confounders, strength 0–100.
Deterministic; no systems, root patterns, lenses, safety, or lab modifiers here.
"""

from typing import Any, Dict, List, Optional, Tuple

from engine.types import ClusterResult


def _clamp_0_100(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def _sig(score_by_symptom: Dict[str, float], symptom_id: str) -> float:
    return float(score_by_symptom.get(symptom_id, 0.0))


def _flag(flags: Dict[str, Any], key: str, default: Any = None) -> Any:
    return flags.get(key, default)


def _num(value: Any, default: float = 0.0) -> float:
    """Coerce to number for threshold comparison."""
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _weighted_mean(pairs: List[Tuple[float, float]]) -> float:
    valid = [(v, w) for v, w in pairs if w > 0]
    if not valid:
        return 0.0
    denom = sum(w for _, w in valid)
    if denom == 0:
        return 0.0
    return sum(v * w for v, w in valid) / denom


def _top_supporting_signals(
    scored_signals: List[Tuple[str, float]], limit: int = 6
) -> List[str]:
    scored_signals = sorted(scored_signals, key=lambda x: x[1], reverse=True)
    return [sid for sid, score in scored_signals if score > 0][:limit]


def _make_cluster_result(
    cluster_id: str,
    strength: float,
    supporting: List[str],
    confounders: List[str],
) -> ClusterResult:
    return ClusterResult(
        cluster_id=cluster_id,
        strength=_clamp_0_100(strength),
        confidence=0.0,
        supporting_signals=supporting[:6],
        confounders_applied=confounders,
    )


# --- Cluster 1: CL_ENERGY_VAR ---


def _compute_energy_var(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: SYM_FATIGUE >= 40 and at least one of AFTERNOON_CRASH, BRAIN_FOG, EX_INTOL >= 35
    if sig("SYM_FATIGUE") < 40:
        return _make_cluster_result("CL_ENERGY_VAR", 0.0, [], [])
    if not (
        sig("SYM_AFTERNOON_CRASH") >= 35
        or sig("SYM_BRAIN_FOG") >= 35
        or sig("SYM_EX_INTOL") >= 35
    ):
        return _make_cluster_result("CL_ENERGY_VAR", 0.0, [], [])

    strength = _weighted_mean([
        (sig("SYM_FATIGUE"), 0.35),
        (sig("SYM_AFTERNOON_CRASH"), 0.20),
        (sig("SYM_BRAIN_FOG"), 0.15),
        (sig("SYM_EX_INTOL"), 0.10),
        (sig("SYM_SUGAR_CRAVE"), 0.10),
        (sig("SYM_UNREFRESHED"), 0.10),
    ])
    supporting = _top_supporting_signals([
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
        ("SYM_AFTERNOON_CRASH", sig("SYM_AFTERNOON_CRASH")),
        ("SYM_BRAIN_FOG", sig("SYM_BRAIN_FOG")),
        ("SYM_EX_INTOL", sig("SYM_EX_INTOL")),
        ("SYM_SUGAR_CRAVE", sig("SYM_SUGAR_CRAVE")),
        ("SYM_UNREFRESHED", sig("SYM_UNREFRESHED")),
    ])
    confounders = []
    if flag("sleep_problem_present"):
        confounders.append("sleep_overlap")
    if _num(flag("stress_level"), 0) >= 3:
        confounders.append("stress_overlap")
    return _make_cluster_result("CL_ENERGY_VAR", strength, supporting, confounders)


# --- Cluster 2: CL_STRESS_ACCUM ---


def _compute_stress_accum(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: stress_level >= 3 and at least one of ANXIETY, IRRITABLE, WAKE_3AM, INSOMNIA >= 40
    if _num(flag("stress_level"), 0) < 3:
        return _make_cluster_result("CL_STRESS_ACCUM", 0.0, [], [])
    if not (
        sig("SYM_ANXIETY") >= 40
        or sig("SYM_IRRITABLE") >= 40
        or sig("SYM_WAKE_3AM") >= 40
        or sig("SYM_INSOMNIA") >= 40
    ):
        return _make_cluster_result("CL_STRESS_ACCUM", 0.0, [], [])

    stress_val = _num(flag("stress_level"), 0)
    anxiety_term = max(sig("SYM_ANXIETY"), 60.0 if stress_val >= 4 else 0.0)
    strength = _weighted_mean([
        (anxiety_term, 0.30),
        (sig("SYM_WAKE_3AM"), 0.20),
        (sig("SYM_INSOMNIA"), 0.15),
        (sig("SYM_IRRITABLE"), 0.15),
        (sig("SYM_PALPITATIONS"), 0.10),
        (sig("SYM_HEADACHES"), 0.05),
        (sig("SYM_UNREFRESHED"), 0.05),
    ])
    supporting = _top_supporting_signals([
        ("SYM_ANXIETY", sig("SYM_ANXIETY")),
        ("SYM_WAKE_3AM", sig("SYM_WAKE_3AM")),
        ("SYM_INSOMNIA", sig("SYM_INSOMNIA")),
        ("SYM_IRRITABLE", sig("SYM_IRRITABLE")),
        ("SYM_PALPITATIONS", sig("SYM_PALPITATIONS")),
        ("SYM_HEADACHES", sig("SYM_HEADACHES")),
        ("SYM_UNREFRESHED", sig("SYM_UNREFRESHED")),
    ])
    confounders = []
    if flag("major_stress_event"):
        confounders.append("acute_stressor_present")
    if flag("is_perimenopause") and sig("SYM_NIGHT_SWEATS") >= 40:
        confounders.append("vasomotor_overlap")
    return _make_cluster_result("CL_STRESS_ACCUM", strength, supporting, confounders)


# --- Cluster 3: CL_SLEEP_DISRUPT ---


def _compute_sleep_disrupt(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: at least 2 of INSOMNIA, WAKE_3AM, UNREFRESHED, NIGHT_SWEATS >= 35
    count = sum(1 for s in ["SYM_INSOMNIA", "SYM_WAKE_3AM", "SYM_UNREFRESHED", "SYM_NIGHT_SWEATS"] if sig(s) >= 35)
    if count < 2:
        return _make_cluster_result("CL_SLEEP_DISRUPT", 0.0, [], [])

    strength = _weighted_mean([
        (sig("SYM_INSOMNIA"), 0.30),
        (sig("SYM_WAKE_3AM"), 0.25),
        (sig("SYM_UNREFRESHED"), 0.30),
        (sig("SYM_NIGHT_SWEATS"), 0.15),
    ])
    supporting = _top_supporting_signals([
        ("SYM_INSOMNIA", sig("SYM_INSOMNIA")),
        ("SYM_WAKE_3AM", sig("SYM_WAKE_3AM")),
        ("SYM_UNREFRESHED", sig("SYM_UNREFRESHED")),
        ("SYM_NIGHT_SWEATS", sig("SYM_NIGHT_SWEATS")),
    ])
    confounders = []
    if _num(flag("stress_level"), 0) >= 4:
        confounders.append("stress_overlap")
    if flag("is_perimenopause") or (flag("is_menopause_stage") and sig("SYM_NIGHT_SWEATS") >= 35):
        confounders.append("vasomotor_overlap")
    return _make_cluster_result("CL_SLEEP_DISRUPT", strength, supporting, confounders)


# --- Cluster 4: CL_CYCLE_VAR ---


def _compute_cycle_var(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float],
    normalized_survey: Any,
) -> ClusterResult:
    # Entry: IRREG_CYCLE>=40 or MISSED_PERIOD>=40 or cycle_regular in {...} or missed_period_3mo=="yes"
    cycle_regular = getattr(normalized_survey, "cycle_regular", None)
    missed_3mo = getattr(normalized_survey, "missed_period_3mo", None)
    eligible = (
        sig("SYM_IRREG_CYCLE") >= 40
        or sig("SYM_MISSED_PERIOD") >= 40
        or cycle_regular in ("somewhat_irregular", "very_irregular")
        or missed_3mo == "yes"
    )
    if not eligible:
        return _make_cluster_result("CL_CYCLE_VAR", 0.0, [], [])

    strength = _weighted_mean([
        (sig("SYM_IRREG_CYCLE"), 0.30),
        (sig("SYM_MISSED_PERIOD"), 0.20),
        (sig("SYM_HEAVY_BLEED"), 0.15),
        (sig("SYM_PMS"), 0.15),
        (sig("SYM_BREAST_TENDER"), 0.10),
        (sig("SYM_BLOATING"), 0.05),
        (sig("SYM_ACNE"), 0.05),
    ])
    supporting = _top_supporting_signals([
        ("SYM_IRREG_CYCLE", sig("SYM_IRREG_CYCLE")),
        ("SYM_MISSED_PERIOD", sig("SYM_MISSED_PERIOD")),
        ("SYM_HEAVY_BLEED", sig("SYM_HEAVY_BLEED")),
        ("SYM_PMS", sig("SYM_PMS")),
        ("SYM_BREAST_TENDER", sig("SYM_BREAST_TENDER")),
        ("SYM_ACNE", sig("SYM_ACNE")),
    ])
    confounders = []
    ct = flag("contraception_type")
    if ct is not None and str(ct).lower() not in ("none", ""):
        confounders.append("hormonal_contraception_overlap")
    if _num(flag("stress_level"), 0) >= 4:
        confounders.append("stress_overlap")
    return _make_cluster_result("CL_CYCLE_VAR", strength, supporting, confounders)


# --- Cluster 5: CL_SUGAR_INSTAB ---


def _compute_sugar_instab(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: post_meal_crash or (SUGAR_CRAVE>=45 and AFTERNOON_CRASH>=40)
    post_meal = bool(flag("post_meal_crash"))
    if not post_meal and not (sig("SYM_SUGAR_CRAVE") >= 45 and sig("SYM_AFTERNOON_CRASH") >= 40):
        return _make_cluster_result("CL_SUGAR_INSTAB", 0.0, [], [])

    post_meal_val = 100.0 if post_meal else 0.0
    strength = _weighted_mean([
        (post_meal_val, 0.30),
        (sig("SYM_AFTERNOON_CRASH"), 0.25),
        (sig("SYM_SUGAR_CRAVE"), 0.25),
        (sig("SYM_FATIGUE"), 0.10),
        (sig("SYM_BRAIN_FOG"), 0.10),
    ])
    supporting = _top_supporting_signals([
        ("SYM_AFTERNOON_CRASH", sig("SYM_AFTERNOON_CRASH")),
        ("SYM_SUGAR_CRAVE", sig("SYM_SUGAR_CRAVE")),
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
        ("SYM_BRAIN_FOG", sig("SYM_BRAIN_FOG")),
    ])
    confounders = []
    if flag("sleep_problem_present"):
        confounders.append("sleep_overlap")
    if _num(flag("stress_level"), 0) >= 4:
        confounders.append("stress_overlap")
    return _make_cluster_result("CL_SUGAR_INSTAB", strength, supporting, confounders)


# --- Cluster 6: CL_IRON_PATTERN ---


def _compute_iron_pattern(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: HEAVY_BLEED>=40 and at least one of FATIGUE>=40, HAIR_LOSS>=40, DIZZINESS>=35, LOW_STAMINA>=35, EX_INTOL>=35
    if sig("SYM_HEAVY_BLEED") < 40:
        return _make_cluster_result("CL_IRON_PATTERN", 0.0, [], [])
    if not (
        sig("SYM_FATIGUE") >= 40
        or sig("SYM_HAIR_LOSS") >= 40
        or sig("SYM_DIZZINESS") >= 35
        or sig("SYM_LOW_STAMINA") >= 35
        or sig("SYM_EX_INTOL") >= 35
    ):
        return _make_cluster_result("CL_IRON_PATTERN", 0.0, [], [])

    strength = _weighted_mean([
        (sig("SYM_HEAVY_BLEED"), 0.30),
        (sig("SYM_FATIGUE"), 0.20),
        (sig("SYM_HAIR_LOSS"), 0.15),
        (sig("SYM_DIZZINESS"), 0.10),
        (sig("SYM_LOW_STAMINA"), 0.10),
        (sig("SYM_EX_INTOL"), 0.10),
        (sig("SYM_BRITTLE_NAILS"), 0.05),
    ])
    supporting = _top_supporting_signals([
        ("SYM_HEAVY_BLEED", sig("SYM_HEAVY_BLEED")),
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
        ("SYM_HAIR_LOSS", sig("SYM_HAIR_LOSS")),
        ("SYM_DIZZINESS", sig("SYM_DIZZINESS")),
        ("SYM_LOW_STAMINA", sig("SYM_LOW_STAMINA")),
        ("SYM_EX_INTOL", sig("SYM_EX_INTOL")),
        ("SYM_BRITTLE_NAILS", sig("SYM_BRITTLE_NAILS")),
    ])
    confounders = []
    if flag("vegetarian_or_vegan"):
        confounders.append("dietary_reserve_modifier")
    if flag("gut_data_present"):
        confounders.append("gut_absorption_overlap")
    return _make_cluster_result("CL_IRON_PATTERN", strength, supporting, confounders)


# --- Cluster 7: CL_THYROID_SIGNALS ---


def _compute_thyroid_signals(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: (COLD_INTOL>=45 and DRY_SKIN>=40) or (WEIGHT_RESIST>=45 and FATIGUE>=45)
    e1 = sig("SYM_COLD_INTOL") >= 45 and sig("SYM_DRY_SKIN") >= 40
    e2 = sig("SYM_WEIGHT_RESIST") >= 45 and sig("SYM_FATIGUE") >= 45
    if not e1 and not e2:
        return _make_cluster_result("CL_THYROID_SIGNALS", 0.0, [], [])

    strength = _weighted_mean([
        (sig("SYM_COLD_INTOL"), 0.25),
        (sig("SYM_DRY_SKIN"), 0.20),
        (sig("SYM_WEIGHT_RESIST"), 0.20),
        (sig("SYM_FATIGUE"), 0.20),
        (sig("SYM_HAIR_LOSS"), 0.10),
        (sig("SYM_BRITTLE_NAILS"), 0.05),
    ])
    supporting = _top_supporting_signals([
        ("SYM_COLD_INTOL", sig("SYM_COLD_INTOL")),
        ("SYM_DRY_SKIN", sig("SYM_DRY_SKIN")),
        ("SYM_WEIGHT_RESIST", sig("SYM_WEIGHT_RESIST")),
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
        ("SYM_HAIR_LOSS", sig("SYM_HAIR_LOSS")),
    ])
    confounders = []
    if flag("thyroid_medication_use"):
        confounders.append("thyroid_medication_context")
    if sig("SYM_HEAVY_BLEED") >= 40 and sig("SYM_FATIGUE") >= 40:
        confounders.append("iron_overlap")
    return _make_cluster_result("CL_THYROID_SIGNALS", strength, supporting, confounders)


# --- Cluster 8: CL_TRAIN_MISMATCH ---


def _compute_train_mismatch(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: (endurance_training or exercise_days>=5 or endurance_minutes_week>=180) and one of UNREFRESHED>=40, FATIGUE>=45, EX_INTOL>=40
    training_load = bool(flag("endurance_training")) or _num(flag("exercise_days"), 0) >= 5 or _num(flag("endurance_minutes_week"), 0) >= 180
    if not training_load:
        return _make_cluster_result("CL_TRAIN_MISMATCH", 0.0, [], [])
    if not (
        sig("SYM_UNREFRESHED") >= 40 or sig("SYM_FATIGUE") >= 45 or sig("SYM_EX_INTOL") >= 40
    ):
        return _make_cluster_result("CL_TRAIN_MISMATCH", 0.0, [], [])

    training_load_signal = 0.0
    if flag("endurance_training"):
        training_load_signal = max(training_load_signal, 80.0)
    if _num(flag("exercise_days"), 0) >= 5:
        training_load_signal = max(training_load_signal, 70.0)
    if _num(flag("endurance_minutes_week"), 0) >= 180:
        training_load_signal = max(training_load_signal, 85.0)

    strength = _weighted_mean([
        (training_load_signal, 0.30),
        (sig("SYM_UNREFRESHED"), 0.20),
        (sig("SYM_FATIGUE"), 0.20),
        (sig("SYM_EX_INTOL"), 0.20),
        (sig("SYM_LOW_STAMINA"), 0.10),
    ])
    supporting = _top_supporting_signals([
        ("SYM_UNREFRESHED", sig("SYM_UNREFRESHED")),
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
        ("SYM_EX_INTOL", sig("SYM_EX_INTOL")),
        ("SYM_LOW_STAMINA", sig("SYM_LOW_STAMINA")),
    ])
    confounders = []
    if _num(flag("stress_level"), 0) >= 4:
        confounders.append("stress_overlap")
    if flag("micro_data_present"):
        confounders.append("reserve_overlap")
    return _make_cluster_result("CL_TRAIN_MISMATCH", strength, supporting, confounders)


# --- Cluster 9: CL_GUT_PATTERN ---


def _compute_gut_pattern(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: BLOATING>=40 and (CONSTIP>=35 or DIARRHEA>=35 or food_sensitivity truthy)
    if sig("SYM_BLOATING") < 40:
        return _make_cluster_result("CL_GUT_PATTERN", 0.0, [], [])
    fs = bool(flag("food_sensitivity"))
    if not (sig("SYM_CONSTIP") >= 35 or sig("SYM_DIARRHEA") >= 35 or fs):
        return _make_cluster_result("CL_GUT_PATTERN", 0.0, [], [])

    food_sens_val = 100.0 if fs else 0.0
    strength = _weighted_mean([
        (sig("SYM_BLOATING"), 0.35),
        (sig("SYM_CONSTIP"), 0.20),
        (sig("SYM_DIARRHEA"), 0.20),
        (food_sens_val, 0.15),
        (sig("SYM_FATIGUE"), 0.10),
    ])
    scored = [
        ("SYM_BLOATING", sig("SYM_BLOATING")),
        ("SYM_CONSTIP", sig("SYM_CONSTIP")),
        ("SYM_DIARRHEA", sig("SYM_DIARRHEA")),
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
    ]
    if fs:
        scored.append(("food_sensitivity", 100.0))
    supporting = _top_supporting_signals(scored)
    confounders = []
    if sig("SYM_PMS") >= 45 and sig("SYM_BLOATING") >= 40:
        confounders.append("cycle_overlap")
    return _make_cluster_result("CL_GUT_PATTERN", strength, supporting, confounders)


# --- Cluster 10: CL_INFLAM_LOAD ---


def _compute_inflam_load(
    sig, flag, flags: Dict[str, Any], score_by_symptom: Dict[str, float]
) -> ClusterResult:
    # Entry: at least 3 of: FATIGUE>=45, sleep_problem_present, gut_data_present, stress_level>=4, micro_data_present
    count = 0
    if sig("SYM_FATIGUE") >= 45:
        count += 1
    if flag("sleep_problem_present"):
        count += 1
    if flag("gut_data_present"):
        count += 1
    if _num(flag("stress_level"), 0) >= 4:
        count += 1
    if flag("micro_data_present"):
        count += 1
    if count < 3:
        return _make_cluster_result("CL_INFLAM_LOAD", 0.0, [], [])

    strength = _weighted_mean([
        (sig("SYM_FATIGUE"), 0.25),
        (70.0 if flag("sleep_problem_present") else 0.0, 0.20),
        (70.0 if flag("gut_data_present") else 0.0, 0.20),
        (80.0 if _num(flag("stress_level"), 0) >= 4 else 0.0, 0.15),
        (70.0 if flag("micro_data_present") else 0.0, 0.10),
        (sig("SYM_UNREFRESHED"), 0.10),
    ])
    supporting = _top_supporting_signals([
        ("SYM_FATIGUE", sig("SYM_FATIGUE")),
        ("SYM_UNREFRESHED", sig("SYM_UNREFRESHED")),
    ])
    if flag("sleep_problem_present"):
        supporting.append("sleep_problem_present")
    if flag("gut_data_present"):
        supporting.append("gut_data_present")
    if flag("micro_data_present"):
        supporting.append("micro_data_present")
    if _num(flag("stress_level"), 0) >= 4:
        supporting.append("high_stress")
    supporting = supporting[:6]
    confounders = ["low_specificity_cluster"]
    return _make_cluster_result("CL_INFLAM_LOAD", strength, supporting, confounders)


# --- Orchestrator ---


def compute_clusters(signal_scores, derived_flags, normalized_survey, registry, config) -> List[ClusterResult]:
    """Return list of ClusterResult for all 10 canonical clusters, sorted by strength descending."""
    # Build score dict from list of SignalScore or dict-like
    score_by_symptom: Dict[str, float] = {}
    if signal_scores is not None:
        for row in signal_scores:
            sid = getattr(row, "symptom_id", None) or (row.get("symptom_id") if isinstance(row, dict) else None)
            sc = getattr(row, "score", None)
            if sc is None and isinstance(row, dict):
                sc = row.get("score")
            if sid is not None and sc is not None:
                score_by_symptom[str(sid)] = float(sc)

    flags = derived_flags or {}
    sig = lambda sid: _sig(score_by_symptom, sid)
    flag = lambda key, default=None: _flag(flags, key, default)

    results: List[ClusterResult] = [
        _compute_energy_var(sig, flag, flags, score_by_symptom),
        _compute_stress_accum(sig, flag, flags, score_by_symptom),
        _compute_sleep_disrupt(sig, flag, flags, score_by_symptom),
        _compute_cycle_var(sig, flag, flags, score_by_symptom, normalized_survey),
        _compute_sugar_instab(sig, flag, flags, score_by_symptom),
        _compute_iron_pattern(sig, flag, flags, score_by_symptom),
        _compute_thyroid_signals(sig, flag, flags, score_by_symptom),
        _compute_train_mismatch(sig, flag, flags, score_by_symptom),
        _compute_gut_pattern(sig, flag, flags, score_by_symptom),
        _compute_inflam_load(sig, flag, flags, score_by_symptom),
    ]
    results.sort(key=lambda r: r.strength, reverse=True)
    return results

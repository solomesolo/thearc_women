"""
Compute derived boolean/categorical flags from normalized survey and signal scores.
Used by cluster gating, root-pattern gating, lens eligibility, safety logic.
"""

from typing import Any, Dict, List

# Ternary mapping for crash_post_meal: No->0, Sometimes->1, Often->2; numeric 1/2 accepted
_CRASH_POST_MEAL_TERNARY = {"no": 0, "yes": 1, "sometimes": 1, "often": 2, "1": 1, "2": 2}


def _sig(score_by_symptom: Dict[str, float], symptom_id: str) -> float:
    return float(score_by_symptom.get(symptom_id, 0.0))


def compute_derived_flags(normalized_survey, signal_scores, registry, config) -> Dict[str, Any]:
    """Return flat dict of derived flags. Only from normalized survey and signal scores."""
    score_by_symptom = {row.symptom_id: row.score for row in (signal_scores or [])}
    sig = lambda sid: _sig(score_by_symptom, sid)

    flags: Dict[str, Any] = {}

    # Copy-through from normalized survey
    flags["has_periods"] = getattr(normalized_survey, "has_periods", None)
    flags["is_menopause_stage"] = getattr(normalized_survey, "is_menopause_stage", False)

    # Modifier/context copy-through
    modifier_flags = getattr(normalized_survey, "modifier_flags", None) or {}
    for key in (
        "shift_work",
        "endurance_training",
        "vegetarian_or_vegan",
        "thyroid_medication_use",
        "glp1_medication_use",
        "contraception_type",
    ):
        flags[key] = modifier_flags.get(key)

    # Cycle flags
    life_stage = getattr(normalized_survey, "life_stage", None)
    flags["cycle_applicable"] = life_stage not in {"LS_MENO", "LS_POSTMENO", "LS_SURG_MENO"}

    # Gut flags
    flags["gut_data_present"] = (
        sum(1 for s in ["SYM_BLOATING", "SYM_CONSTIP", "SYM_DIARRHEA"] if sig(s) >= 30) >= 2
    )
    lifestyle = getattr(normalized_survey, "lifestyle_fields", None) or {}
    flags["food_sensitivity"] = lifestyle.get("food_sensitivity") if lifestyle else None

    # Micro flag (symptom-only for Phase 2)
    flags["micro_data_present"] = any(
        sig(s) >= 40 for s in ["SYM_FATIGUE", "SYM_HAIR_LOSS", "SYM_HEAVY_BLEED"]
    )

    # Sleep/stress
    flags["stress_level"] = lifestyle.get("stress_level") if lifestyle else None
    flags["major_stress_event"] = lifestyle.get("major_stress_event") if lifestyle else None
    flags["sleep_problem_present"] = any(
        sig(s) >= 40 for s in ["SYM_INSOMNIA", "SYM_WAKE_3AM", "SYM_UNREFRESHED"]
    )

    # Energy / post-meal
    flags["fatigue_present"] = sig("SYM_FATIGUE") >= 40
    flags["energy_variability_present"] = (
        (sig("SYM_FATIGUE") >= 40 and sig("SYM_AFTERNOON_CRASH") >= 40)
        or (sig("SYM_FATIGUE") >= 50 and sig("SYM_BRAIN_FOG") >= 40)
    )

    post_meal_crash = False
    raw_fields = getattr(normalized_survey, "raw_fields", None) or {}
    crash_raw = raw_fields.get("crash_post_meal")
    if crash_raw is not None:
        if isinstance(crash_raw, (int, float)) and crash_raw >= 1:
            post_meal_crash = True
        else:
            v = str(crash_raw).strip().lower()
            ternary_val = _CRASH_POST_MEAL_TERNARY.get(v)
            if ternary_val is not None and ternary_val >= 1:
                post_meal_crash = True
    symptom_inputs = getattr(normalized_survey, "symptom_inputs", None) or []
    for inp in symptom_inputs:
        if getattr(inp, "symptom_id", None) == "SYM_AFTERNOON_CRASH" and getattr(inp, "post_meal", False):
            post_meal_crash = True
            break
    flags["post_meal_crash"] = post_meal_crash

    # Life stage convenience
    flags["is_perimenopause"] = life_stage == "LS_PERI"
    flags["is_postpartum"] = life_stage == "LS_POSTPARTUM"
    flags["is_breastfeeding"] = life_stage == "LS_BREASTFEED"

    return flags

"""
Survey normalization: convert raw intake payloads into deterministic internal structure.
No medical logic; only normalize and validate. Output is suitable for signal scoring,
derived flags, cluster rules, lens gating, safety evaluation.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from engine.types import SymptomInput

# --- Canonical mapping constants ---

LIFE_STAGE_MAP = {
    "Early reproductive (18–25)": "LS_EARLY_REPRO",
    "Reproductive (26–35)": "LS_REPRO",
    "Advanced reproductive (36–40)": "LS_ADV_REPRO",
    "Trying to conceive": "LS_TTC",
    "Postpartum": "LS_POSTPARTUM",
    "Breastfeeding": "LS_BREASTFEED",
    "After hormonal contraception": "LS_POST_HC",
    "Perimenopause": "LS_PERI",
    "Menopause": "LS_MENO",
    "Postmenopause": "LS_POSTMENO",
    "Surgical menopause": "LS_SURG_MENO",
}

MENOPAUSE_STAGE_IDS = {"LS_MENO", "LS_POSTMENO", "LS_SURG_MENO"}

CYCLE_REGULARITY_MAP = {
    "Very regular": "regular",
    "Somewhat irregular": "somewhat_irregular",
    "Very irregular": "very_irregular",
    "I do not currently have periods": "no_periods",
}

CYCLE_LENGTH_MAP = {
    "<21": "<21",
    "21–25": "21_25",
    "26–30": "26_30",
    "31–35": "31_35",
    ">35": ">35",
    "Not sure": "not_sure",
}

PERIOD_HEAVINESS_MAP = {
    "Light": "light",
    "Moderate": "moderate",
    "Heavy": "heavy",
    "Very heavy": "very_heavy",
}

PERIOD_CLOTS_MAP = {
    "No": "no",
    "Sometimes": "sometimes",
    "Often": "often",
}

YES_NO_UNSURE_MAP = {
    "No": "no",
    "Yes": "yes",
    "Not sure": "not_sure",
}

FREQUENCY_MAP = {
    "Never": 0,
    "Occasionally": 1,
    "Weekly": 2,
    "Most days": 3,
    "Daily": 4,
}

TIMING_MAP = {
    "Morning": "morning",
    "Afternoon": "afternoon",
    "Evening": "evening",
    "All day": "all_day",
    "Varies": "varies",
}

TERNARY_FREQ_MAP = {
    "No": 0,
    "Sometimes": 1,
    "Often": 2,
}

WEIGHT_CHANGE_MAP = {
    "Stable": "stable",
    "Gained 2–5 kg": "gain_2_5kg",
    "Gained >5 kg": "gain_gt_5kg",
    "Lost 2–5 kg": "loss_2_5kg",
    "Lost >5 kg": "loss_gt_5kg",
    "Not sure": "not_sure",
}

CONTRACEPTION_MAP = {
    "None": "none",
    "Combined pill": "combined_pill",
    "Progestin-only pill": "progestin_only_pill",
    "Hormonal IUD": "hormonal_iud",
    "Copper IUD": "copper_iud",
    "Implant": "implant",
    "Injection": "injection",
    "Ring / patch": "ring_patch",
    "Other": "other",
}


@dataclass
class NormalizedSurvey:
    life_stage: Optional[str] = None
    age_years: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    weight_change_3mo: Optional[str] = None

    cycle_regular: Optional[str] = None
    cycle_length_days: Optional[str] = None
    period_heaviness: Optional[str] = None
    period_clots: Optional[str] = None
    period_pain_sev: Optional[int] = None
    pms_sev: Optional[int] = None
    missed_period_3mo: Optional[str] = None
    contraception_type: Optional[str] = None

    symptom_inputs: List[SymptomInput] = field(default_factory=list)
    lifestyle_fields: Dict[str, Any] = field(default_factory=dict)
    modifier_flags: Dict[str, Any] = field(default_factory=dict)
    raw_fields: Dict[str, Any] = field(default_factory=dict)

    has_periods: Optional[bool] = None
    is_menopause_stage: bool = False


# --- Helpers ---


def _as_dict(obj: Any) -> Dict[str, Any]:
    """Turn SurveyInput or dict-like into a single flat dict for reading."""
    if obj is None:
        return {}
    if hasattr(obj, "raw_fields") and hasattr(obj, "life_stage"):
        # SurveyInput-like: merge raw_fields with top-level attrs
        out = dict(getattr(obj, "raw_fields", {}))
        if getattr(obj, "life_stage", None) is not None:
            out["life_stage"] = obj.life_stage
        if getattr(obj, "age_years", None) is not None:
            out["age_years"] = obj.age_years
        return out
    if isinstance(obj, dict):
        return dict(obj)
    return {}


def _get(raw: Dict[str, Any], key: str, default: Any = None) -> Any:
    return raw.get(key, default)


def _map_value(value: Any, mapping: Dict[str, Any]) -> Any:
    """Return mapped value if present; else None. Preserve None."""
    if value is None:
        return None
    return mapping.get(value, None) if value in mapping else None


def _clamp_scale_0_5(value: Any) -> Optional[int]:
    """Clamp numeric severity to 0–5; return None if not numeric or missing."""
    if value is None:
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    if n < 0:
        return 0
    if n > 5:
        return 5
    return n


def _to_bool_like(value: Any) -> Optional[bool]:
    """Interpret yes/no-style value as bool; None if unclear."""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    s = str(value).strip().lower()
    if s in ("yes", "true", "1"):
        return True
    if s in ("no", "false", "0"):
        return False
    return None


def _normalize_profile(raw: Dict[str, Any], out: NormalizedSurvey) -> None:
    life_stage_raw = _get(raw, "life_stage")
    out.life_stage = _map_value(life_stage_raw, LIFE_STAGE_MAP)
    if out.life_stage is None and life_stage_raw is not None:
        out.raw_fields["life_stage"] = life_stage_raw

    age = _get(raw, "age_years")
    if age is not None:
        try:
            out.age_years = int(age)
        except (TypeError, ValueError):
            out.raw_fields["age_years"] = age
    else:
        out.age_years = None

    h = _get(raw, "height_cm")
    if h is not None:
        try:
            out.height_cm = int(h)
        except (TypeError, ValueError):
            out.raw_fields["height_cm"] = h
    else:
        out.height_cm = None

    w = _get(raw, "weight_kg")
    if w is not None:
        try:
            out.weight_kg = float(w)
        except (TypeError, ValueError):
            out.raw_fields["weight_kg"] = w
    else:
        out.weight_kg = None

    wc = _get(raw, "weight_change_3mo")
    out.weight_change_3mo = _map_value(wc, WEIGHT_CHANGE_MAP)
    if out.weight_change_3mo is None and wc is not None:
        out.raw_fields["weight_change_3mo"] = wc


def _normalize_cycle(raw: Dict[str, Any], out: NormalizedSurvey) -> None:
    cr = _get(raw, "cycle_regular")
    out.cycle_regular = _map_value(cr, CYCLE_REGULARITY_MAP)
    if out.cycle_regular is None and cr is not None:
        out.raw_fields["cycle_regular"] = cr

    if out.cycle_regular == "no_periods":
        out.has_periods = False
    elif cr is not None:
        out.has_periods = cr != "I do not currently have periods"

    cl = _get(raw, "cycle_length_days")
    out.cycle_length_days = _map_value(cl, CYCLE_LENGTH_MAP)
    if out.cycle_length_days is None and cl is not None:
        out.raw_fields["cycle_length_days"] = cl

    ph = _get(raw, "period_heaviness")
    out.period_heaviness = _map_value(ph, PERIOD_HEAVINESS_MAP)
    if out.period_heaviness is None and ph is not None:
        out.raw_fields["period_heaviness"] = ph

    pc = _get(raw, "period_clots")
    out.period_clots = _map_value(pc, PERIOD_CLOTS_MAP)
    if out.period_clots is None and pc is not None:
        out.raw_fields["period_clots"] = pc

    out.period_pain_sev = _clamp_scale_0_5(_get(raw, "period_pain_sev"))
    out.pms_sev = _clamp_scale_0_5(_get(raw, "pms_sev"))

    mp = _get(raw, "missed_period_3mo")
    out.missed_period_3mo = _map_value(mp, YES_NO_UNSURE_MAP)
    if out.missed_period_3mo is None and mp is not None:
        out.raw_fields["missed_period_3mo"] = mp

    ct = _get(raw, "contraception_type")
    out.contraception_type = _map_value(ct, CONTRACEPTION_MAP)
    if out.contraception_type is None and ct is not None:
        out.raw_fields["contraception_type"] = ct


def _build_symptom_inputs(raw: Dict[str, Any], out: NormalizedSurvey) -> None:
    symptoms: List[SymptomInput] = []

    fatigue_freq_raw = _get(raw, "fatigue_freq")
    fatigue_sev_raw = _get(raw, "fatigue_sev")
    fatigue_timing_raw = _get(raw, "fatigue_timing")
    fatigue_freq = _map_value(fatigue_freq_raw, FREQUENCY_MAP)
    fatigue_sev = _clamp_scale_0_5(fatigue_sev_raw)
    fatigue_timing = _map_value(fatigue_timing_raw, TIMING_MAP)
    if fatigue_timing is None and fatigue_timing_raw is not None:
        out.raw_fields["fatigue_timing"] = fatigue_timing_raw

    if fatigue_sev is not None or fatigue_freq is not None:
        symptoms.append(
            SymptomInput(
                symptom_id="SYM_FATIGUE",
                severity=fatigue_sev,
                frequency=fatigue_freq,
                timing=fatigue_timing,
            )
        )

    energy_crash_raw = _get(raw, "energy_crash")
    energy_crash = _map_value(energy_crash_raw, TERNARY_FREQ_MAP)
    if energy_crash is not None or fatigue_timing == "afternoon":
        symptoms.append(
            SymptomInput(
                symptom_id="SYM_AFTERNOON_CRASH",
                severity=None,
                frequency=energy_crash if energy_crash is not None else None,
                timing="afternoon" if fatigue_timing == "afternoon" else None,
            )
        )

    sugar_raw = _get(raw, "sugar_cravings")
    if sugar_raw is not None:
        sev = _clamp_scale_0_5(sugar_raw) if isinstance(sugar_raw, (int, float)) else None
        symptoms.append(
            SymptomInput(symptom_id="SYM_SUGAR_CRAVE", severity=sev, frequency=None)
        )

    if out.missed_period_3mo == "yes":
        symptoms.append(SymptomInput(symptom_id="SYM_MISSED_PERIOD"))

    if out.period_heaviness in ("heavy", "very_heavy"):
        symptoms.append(SymptomInput(symptom_id="SYM_HEAVY_BLEED"))

    if out.period_pain_sev is not None:
        symptoms.append(
            SymptomInput(symptom_id="SYM_PAINFUL_PERIOD", severity=out.period_pain_sev)
        )

    if out.pms_sev is not None:
        symptoms.append(
            SymptomInput(symptom_id="SYM_PMS", severity=out.pms_sev)
        )

    out.symptom_inputs = symptoms


def _build_modifier_flags(raw: Dict[str, Any], out: NormalizedSurvey) -> None:
    flags: Dict[str, Any] = {}
    for key in (
        "shift_work",
        "endurance_training",
        "vegetarian_or_vegan",
        "thyroid_medication_use",
        "glp1_medication_use",
    ):
        v = _get(raw, key)
        if v is not None:
            flags[key] = v
    if out.contraception_type is not None:
        flags["contraception_type"] = out.contraception_type
    out.modifier_flags = flags


def _build_lifestyle_fields(raw: Dict[str, Any], out: NormalizedSurvey) -> None:
    keys = (
        "stress_level",
        "sleep_hours",
        "bedtime_variability",
        "major_stress_event",
        "caffeine",
        "alcohol",
        "exercise_days",
        "endurance_minutes_week",
        "strength_days",
        "meal_regularity",
        "food_sensitivity",
    )
    out.lifestyle_fields = {k: raw[k] for k in keys if k in raw and raw[k] is not None}


def normalize_survey_input(survey_input: Any, registry: Any, config: Any) -> NormalizedSurvey:
    """
    Accept SurveyInput or dict-like; return NormalizedSurvey.
    Unknown labels are preserved in raw_fields; missing values become None.
    """
    raw = _as_dict(survey_input)
    out = NormalizedSurvey(raw_fields=dict(raw))

    _normalize_profile(raw, out)
    _normalize_cycle(raw, out)

    out.is_menopause_stage = out.life_stage in MENOPAUSE_STAGE_IDS if out.life_stage else False

    _build_symptom_inputs(raw, out)
    _build_modifier_flags(raw, out)
    _build_lifestyle_fields(raw, out)

    return out

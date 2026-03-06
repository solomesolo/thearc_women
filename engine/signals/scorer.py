"""
Compute symptom-level signal scores (0–100) from normalized survey.
Deterministic; no diagnosis or pattern inference.
"""

from typing import Any, Dict, List, Optional

from engine.types import SignalScore, SymptomInput

# --- Helper scales ---

FREQ_TO_100 = {
    0: 0.0,
    1: 25.0,
    2: 50.0,
    3: 75.0,
    4: 100.0,
}

TERNARY_TO_100 = {
    0: 0.0,
    1: 50.0,
    2: 100.0,
}

TIMING_MODIFIER = {
    "morning": 0.00,
    "afternoon": 0.10,
    "evening": 0.05,
    "all_day": 0.20,
    "varies": 0.00,
    None: 0.00,
}

PHASE_MODIFIER = {
    "premenstrual": 0.15,
    "during_menses": 0.10,
    "mid_cycle": 0.05,
    "luteal": 0.15,
    "not_linked": 0.00,
    "not_sure": 0.00,
    None: 0.00,
}

POST_MEAL_MODIFIER = 0.15

MODIFIER_CAP_SINGLE = 0.25
MODIFIER_CAP_TOTAL = 0.40

# --- Compact symptom scoring spec ---

SYMPTOM_SCORING_SPEC: Dict[str, Dict[str, Any]] = {
    "SYM_FATIGUE": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_MORNING_EXH": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_AFTERNOON_CRASH": {
        "severity_weight": 0.20,
        "frequency_weight": 0.60,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": True,
    },
    "SYM_SUGAR_CRAVE": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_LOW_STAMINA": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_EX_INTOL": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_WEIGHT_GAIN": {
        "severity_weight": 0.60,
        "frequency_weight": 0.00,
        "duration_weight": 0.40,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_WEIGHT_RESIST": {
        "severity_weight": 0.60,
        "frequency_weight": 0.00,
        "duration_weight": 0.40,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_BRAIN_FOG": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_POOR_FOCUS": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_ANXIETY": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_LOW_MOOD": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_IRRITABLE": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_HEADACHES": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_INSOMNIA": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_WAKE_3AM": {
        "severity_weight": 0.25,
        "frequency_weight": 0.55,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_UNREFRESHED": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_NIGHT_SWEATS": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_IRREG_CYCLE": {
        "severity_weight": 0.30,
        "frequency_weight": 0.20,
        "duration_weight": 0.50,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_MISSED_PERIOD": {
        "severity_weight": 0.20,
        "frequency_weight": 0.10,
        "duration_weight": 0.70,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_HEAVY_BLEED": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_PAINFUL_PERIOD": {
        "severity_weight": 0.55,
        "frequency_weight": 0.15,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_PMS": {
        "severity_weight": 0.55,
        "frequency_weight": 0.15,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_BREAST_TENDER": {
        "severity_weight": 0.55,
        "frequency_weight": 0.15,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_ACNE": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_LOW_LIBIDO": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_BLOATING": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": True,
        "allow_post_meal_modifier": False,
    },
    "SYM_CONSTIP": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_DIARRHEA": {
        "severity_weight": 0.45,
        "frequency_weight": 0.35,
        "duration_weight": 0.20,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_HAIR_LOSS": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_DRY_SKIN": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_BRITTLE_NAILS": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": False,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_COLD_INTOL": {
        "severity_weight": 0.50,
        "frequency_weight": 0.20,
        "duration_weight": 0.30,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": False,
    },
    "SYM_PALPITATIONS": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": True,
    },
    "SYM_DIZZINESS": {
        "severity_weight": 0.50,
        "frequency_weight": 0.30,
        "duration_weight": 0.20,
        "allow_timing_modifier": True,
        "allow_phase_modifier": False,
        "allow_post_meal_modifier": True,
    },
}


def clamp_0_100(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 100.0:
        return 100.0
    return x


def duration_days_to_100(days: Optional[int]) -> float:
    if days is None:
        return 0.0
    if days < 14:
        return 25.0
    if days < 56:
        return 50.0
    if days < 180:
        return 75.0
    return 100.0


def normalize_severity(severity: Optional[int]) -> float:
    """0–5 scale to 0–100. Missing -> 0."""
    if severity is None:
        return 0.0
    n = severity if 0 <= severity <= 5 else max(0, min(5, severity))
    return (n / 5.0) * 100.0


def normalize_frequency(freq: Optional[int]) -> float:
    """Frequency band to 0–100. Missing -> 0."""
    if freq is None:
        return 0.0
    return float(FREQ_TO_100.get(freq, 0.0))


def normalize_ternary_frequency(ternary: Optional[int]) -> float:
    """Ternary (0/1/2) to 0–100. Missing -> 0."""
    if ternary is None:
        return 0.0
    return float(TERNARY_TO_100.get(ternary, 0.0))


def score_symptom_input(
    symptom_input: SymptomInput,
    registry: Any,
    strict: bool,
) -> Optional[SignalScore]:
    """Score one symptom; return None if unknown symptom and non-strict."""
    sid = symptom_input.symptom_id
    if sid not in SYMPTOM_SCORING_SPEC:
        return None
    spec = SYMPTOM_SCORING_SPEC[sid]

    missing: List[str] = []
    sev = symptom_input.severity
    freq = symptom_input.frequency
    dur = symptom_input.duration_days
    if sev is None:
        missing.append("severity")
    if freq is None:
        missing.append("frequency")
    if dur is None:
        missing.append("duration_days")

    severity_norm = normalize_severity(sev)
    frequency_norm = normalize_frequency(freq)
    duration_norm = duration_days_to_100(dur) if dur is not None else 0.0

    sw = spec["severity_weight"]
    fw = spec["frequency_weight"]
    dw = spec["duration_weight"]
    base_score = (
        sw * severity_norm + fw * frequency_norm + dw * duration_norm
    )

    mod_total = 0.0
    timing = getattr(symptom_input, "timing", None)
    phase = getattr(symptom_input, "phase_link", None)
    post_meal = getattr(symptom_input, "post_meal", None)
    if spec.get("allow_timing_modifier") and timing is not None:
        m = TIMING_MODIFIER.get(timing, TIMING_MODIFIER.get(None, 0.0))
        mod_total += min(m, MODIFIER_CAP_SINGLE)
    if spec.get("allow_phase_modifier") and phase is not None:
        m = PHASE_MODIFIER.get(phase, PHASE_MODIFIER.get(None, 0.0))
        mod_total += min(m, MODIFIER_CAP_SINGLE)
    if spec.get("allow_post_meal_modifier") and post_meal is True:
        mod_total += min(POST_MEAL_MODIFIER, MODIFIER_CAP_SINGLE)
    mod_total = min(mod_total, MODIFIER_CAP_TOTAL)

    score = base_score * (1.0 + mod_total)
    score = clamp_0_100(score)

    return SignalScore(symptom_id=sid, score=score, missing_fields=missing)


def compute_signal_scores(normalized_survey, registry, config) -> List[SignalScore]:
    """Produce list of SignalScore from NormalizedSurvey. Optional lookup dict not returned."""
    results: List[SignalScore] = []
    strict = getattr(config, "strict_id_validation", True)
    for inp in getattr(normalized_survey, "symptom_inputs", []) or []:
        ss = score_symptom_input(inp, registry, strict)
        if ss is not None:
            results.append(ss)
    return results

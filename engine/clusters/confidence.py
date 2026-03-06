"""
Base cluster confidence from support, completeness, specificity, and confounders.
Independent of labs; lab modifiers applied later.
"""

from dataclasses import replace
from typing import Any, Dict, List

from engine.types import ClusterResult

CLUSTER_CORE_SIGNALS: Dict[str, List[str]] = {
    "CL_ENERGY_VAR": ["SYM_FATIGUE", "SYM_AFTERNOON_CRASH", "SYM_BRAIN_FOG", "SYM_EX_INTOL"],
    "CL_STRESS_ACCUM": ["SYM_ANXIETY", "SYM_WAKE_3AM", "SYM_INSOMNIA", "SYM_IRRITABLE"],
    "CL_SLEEP_DISRUPT": ["SYM_INSOMNIA", "SYM_WAKE_3AM", "SYM_UNREFRESHED", "SYM_NIGHT_SWEATS"],
    "CL_CYCLE_VAR": ["SYM_IRREG_CYCLE", "SYM_MISSED_PERIOD", "SYM_HEAVY_BLEED", "SYM_PMS"],
    "CL_SUGAR_INSTAB": ["SYM_AFTERNOON_CRASH", "SYM_SUGAR_CRAVE", "SYM_FATIGUE"],
    "CL_IRON_PATTERN": ["SYM_HEAVY_BLEED", "SYM_FATIGUE", "SYM_HAIR_LOSS", "SYM_DIZZINESS"],
    "CL_THYROID_SIGNALS": ["SYM_COLD_INTOL", "SYM_DRY_SKIN", "SYM_WEIGHT_RESIST", "SYM_FATIGUE"],
    "CL_TRAIN_MISMATCH": ["SYM_UNREFRESHED", "SYM_FATIGUE", "SYM_EX_INTOL", "SYM_LOW_STAMINA"],
    "CL_GUT_PATTERN": ["SYM_BLOATING", "SYM_CONSTIP", "SYM_DIARRHEA"],
    "CL_INFLAM_LOAD": ["SYM_FATIGUE", "SYM_UNREFRESHED"],
}

CLUSTER_SPECIFICITY_SCORE: Dict[str, int] = {
    "CL_ENERGY_VAR": 65,
    "CL_STRESS_ACCUM": 70,
    "CL_SLEEP_DISRUPT": 75,
    "CL_CYCLE_VAR": 80,
    "CL_SUGAR_INSTAB": 80,
    "CL_IRON_PATTERN": 82,
    "CL_THYROID_SIGNALS": 72,
    "CL_TRAIN_MISMATCH": 78,
    "CL_GUT_PATTERN": 78,
    "CL_INFLAM_LOAD": 45,
}

CONFOUNDER_PENALTIES: Dict[str, int] = {
    "sleep_overlap": 8,
    "stress_overlap": 8,
    "iron_overlap": 8,
    "gut_absorption_overlap": 6,
    "cycle_overlap": 6,
    "hormonal_contraception_overlap": 8,
    "thyroid_medication_context": 10,
    "dietary_reserve_modifier": 4,
    "reserve_overlap": 6,
    "acute_stressor_present": 10,
    "vasomotor_overlap": 8,
    "low_specificity_cluster": 12,
}

DEFAULT_CONFOUNDER_PENALTY = 5
PENALTY_CAP = 25


def _clamp_0_100(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def entry_score_from_strength(strength: float) -> float:
    if strength >= 70:
        return 85.0
    if strength >= 55:
        return 70.0
    if strength >= 40:
        return 55.0
    if strength > 0:
        return 40.0
    return 0.0


def support_count_score(support_n: int) -> float:
    if support_n >= 5:
        return 90.0
    if support_n == 4:
        return 75.0
    if support_n == 3:
        return 60.0
    if support_n == 2:
        return 45.0
    if support_n == 1:
        return 25.0
    return 0.0


def signal_completeness_score(
    cluster_id: str, score_by_symptom: Dict[str, float]
) -> float:
    core = CLUSTER_CORE_SIGNALS.get(cluster_id, [])
    if not core:
        return 0.0
    present = sum(1 for sid in core if score_by_symptom.get(sid, 0) >= 30)
    ratio = present / len(core)
    return _clamp_0_100(ratio * 100.0)


def confounder_penalty(confounders_applied: List[str]) -> float:
    penalty = sum(
        CONFOUNDER_PENALTIES.get(c, DEFAULT_CONFOUNDER_PENALTY)
        for c in (confounders_applied or [])
    )
    return min(penalty, PENALTY_CAP)


def confidence_band(value: float) -> str:
    if value < 40:
        return "weak"
    if value < 70:
        return "moderate"
    if value < 85:
        return "strong"
    return "very_strong"


def compute_cluster_confidence(
    clusters: List[ClusterResult],
    signal_scores: Any,
    derived_flags: Any,
    normalized_survey: Any,
    registry: Any,
    config: Any,
) -> List[ClusterResult]:
    """Update each cluster with base confidence; return new list (no lab modifiers)."""
    score_by_symptom: Dict[str, float] = {}
    if signal_scores is not None:
        for row in signal_scores:
            sid = getattr(row, "symptom_id", None) or (
                row.get("symptom_id") if isinstance(row, dict) else None
            )
            sc = getattr(row, "score", None)
            if sc is None and isinstance(row, dict):
                sc = row.get("score")
            if sid is not None and sc is not None:
                score_by_symptom[str(sid)] = float(sc)

    out: List[ClusterResult] = []
    for c in clusters:
        if c.strength == 0:
            out.append(replace(c, confidence=0.0))
            continue

        entry_sc = entry_score_from_strength(c.strength)
        support_n = len(c.supporting_signals or [])
        support_sc = support_count_score(support_n)
        completeness_sc = signal_completeness_score(c.cluster_id, score_by_symptom)
        specificity_sc = float(CLUSTER_SPECIFICITY_SCORE.get(c.cluster_id, 50))
        penalty = confounder_penalty(c.confounders_applied or [])

        confidence = (
            0.35 * entry_sc
            + 0.20 * support_sc
            + 0.20 * completeness_sc
            + 0.25 * specificity_sc
        ) - penalty
        confidence = _clamp_0_100(confidence)

        if c.strength > 0 and c.strength < 25:
            confidence = min(confidence, 60.0)
        if c.cluster_id == "CL_INFLAM_LOAD":
            confidence = min(confidence, 70.0)

        out.append(replace(c, confidence=float(confidence)))
    return out

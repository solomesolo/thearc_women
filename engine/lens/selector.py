"""
Select primary (and optional secondary) lens from systems and flags.
Phase 8: framing layer only; gate before ranking; baseline fallback required.
"""

from typing import Any, Dict, List, Optional, Tuple

from engine.types import LensResult

DEFAULT_SYSTEM_CONFIDENCE = 70.0

# Lens weights: (system_id, weight). Use adjusted system scores.
LENS_SYSTEM_WEIGHTS: Dict[str, List[Tuple[str, float]]] = {
    "LENS_STRESS_RECOVERY": [
        ("SYS_STRESS", 0.45),
        ("SYS_SLEEP", 0.35),
        ("SYS_RECOVERY", 0.20),
    ],
    "LENS_ENERGY_METABOLIC": [
        ("SYS_METABOLIC", 0.70),
        ("SYS_SLEEP", 0.30),
    ],
    "LENS_HORMONAL_RHYTHM": [
        ("SYS_HORMONAL", 0.85),
        ("SYS_SLEEP", 0.15),
    ],
    "LENS_GUT_ABSORPTION": [
        ("SYS_GUT", 0.75),
        ("SYS_MICRO", 0.25),
    ],
    "LENS_NUTRIENT_RESERVES": [
        ("SYS_MICRO", 0.70),
        ("SYS_METABOLIC", 0.15),
        ("SYS_SLEEP", 0.15),
    ],
}

# Fallback when SYS_RECOVERY missing: stress 0.55, sleep 0.45
LENS_STRESS_RECOVERY_FALLBACK_WEIGHTS: List[Tuple[str, float]] = [
    ("SYS_STRESS", 0.55),
    ("SYS_SLEEP", 0.45),
]

MIN_TOP_LENS_SCORE = 35.0


def system_lookup(systems: Any) -> Dict[str, Any]:
    """Build system_id -> result (with score, confidence) map from list of SystemResult."""
    out: Dict[str, Any] = {}
    for s in systems or []:
        sid = getattr(s, "system_id", None)
        if sid:
            out[sid] = s
    return out


def system_score(system_map: Dict[str, Any], system_id: str) -> float:
    """Raw system score; 0 if missing."""
    s = system_map.get(system_id)
    if s is None:
        return 0.0
    return float(getattr(s, "score", 0) or 0)


def system_confidence(
    system_map: Dict[str, Any],
    system_id: str,
    default_confidence: float = DEFAULT_SYSTEM_CONFIDENCE,
) -> float:
    """System confidence; default if missing."""
    s = system_map.get(system_id)
    if s is None:
        return default_confidence
    conf = getattr(s, "confidence", None)
    if conf is None:
        return default_confidence
    return float(conf)


def adjusted_system_score(
    system_map: Dict[str, Any],
    system_id: str,
    default_confidence: float = DEFAULT_SYSTEM_CONFIDENCE,
) -> float:
    """AdjSystemScore(system) = SystemScore(system) * (0.7 + 0.3 * (SystemConfidence(system) / 100.0))."""
    raw = system_score(system_map, system_id)
    conf = system_confidence(system_map, system_id, default_confidence)
    return raw * (0.7 + 0.3 * (conf / 100.0))


def lens_score(lens_id: str, system_map: Dict[str, Any]) -> float:
    """Compute lens score from adjusted system scores. Uses fallback weights for LENS_STRESS_RECOVERY when SYS_RECOVERY missing."""
    if lens_id == "LENS_BASELINE":
        return 0.0
    weights = LENS_SYSTEM_WEIGHTS.get(lens_id)
    if not weights:
        return 0.0
    if lens_id == "LENS_STRESS_RECOVERY" and system_score(system_map, "SYS_RECOVERY") <= 0:
        weights = LENS_STRESS_RECOVERY_FALLBACK_WEIGHTS
    total = 0.0
    for sys_id, w in weights:
        total += adjusted_system_score(system_map, sys_id) * w
    return total


def lens_eligible(lens_id: str, system_map: Dict[str, Any], derived_flags: Dict[str, Any]) -> bool:
    """True if lens passes its eligibility gate. Uses raw system scores for thresholds."""
    flags = derived_flags or {}

    def sys(sid: str) -> float:
        return system_score(system_map, sid)

    if lens_id == "LENS_BASELINE":
        return True

    if lens_id == "LENS_STRESS_RECOVERY":
        return sys("SYS_STRESS") >= 40 or sys("SYS_SLEEP") >= 40 or sys("SYS_RECOVERY") >= 40

    if lens_id == "LENS_ENERGY_METABOLIC":
        return sys("SYS_METABOLIC") >= 40 or bool(flags.get("post_meal_crash", False))

    if lens_id == "LENS_HORMONAL_RHYTHM":
        return bool(flags.get("cycle_applicable")) and sys("SYS_HORMONAL") >= 35

    if lens_id == "LENS_GUT_ABSORPTION":
        return sys("SYS_GUT") >= 35 or bool(flags.get("gut_data_present"))

    if lens_id == "LENS_NUTRIENT_RESERVES":
        return sys("SYS_MICRO") >= 35 or bool(flags.get("micro_data_present"))

    return False


def select_lens(
    systems: Any,
    derived_flags: Any,
    registry: Any,
    config: Any,
) -> LensResult:
    """
    Compute lens scores, apply eligibility gates, choose top eligible lens or baseline.
    Task 8.1: no blend; single top lens or baseline.
    """
    system_map = system_lookup(systems)
    default_conf = getattr(config, "default_system_confidence", None)
    if default_conf is None:
        default_conf = DEFAULT_SYSTEM_CONFIDENCE

    non_baseline_lens_ids = [
        "LENS_STRESS_RECOVERY",
        "LENS_ENERGY_METABOLIC",
        "LENS_HORMONAL_RHYTHM",
        "LENS_GUT_ABSORPTION",
        "LENS_NUTRIENT_RESERVES",
    ]

    # Default gate: at least 2 systems in the lens have SystemScore >= 30.
    # Exception: hormonal uses only its own gate. Two-system lenses (ENERGY_METABOLIC, HORMONAL_RHYTHM, GUT_ABSORPTION) use lens-specific gate only so flags can make them eligible.
    def default_gate_passes(lid: str) -> bool:
        if lid == "LENS_HORMONAL_RHYTHM":
            return True
        weights = LENS_SYSTEM_WEIGHTS.get(lid)
        if lid == "LENS_STRESS_RECOVERY" and system_score(system_map, "SYS_RECOVERY") <= 0:
            weights = LENS_STRESS_RECOVERY_FALLBACK_WEIGHTS
        if not weights or len(weights) < 3:
            return True
        count = sum(1 for sid, _ in weights if system_score(system_map, sid) >= 30)
        return count >= 2

    eligible: List[Tuple[str, float]] = []
    for lid in non_baseline_lens_ids:
        if not lens_eligible(lid, system_map, derived_flags or {}):
            continue
        if not default_gate_passes(lid):
            continue
        score = lens_score(lid, system_map)
        eligible.append((lid, score))

    if not eligible:
        return LensResult(
            primary_lens_id="LENS_BASELINE",
            primary_lens_score=0.0,
            secondary_lens_id=None,
            secondary_lens_score=None,
            is_blended=False,
            lens_reason_tags=[],
            lens_confidence=None,
            explain_meta={"baseline_reason": "no_eligible_lens"},
        )

    best_id, best_score = max(eligible, key=lambda x: x[1])
    if best_score < MIN_TOP_LENS_SCORE:
        return LensResult(
            primary_lens_id="LENS_BASELINE",
            primary_lens_score=0.0,
            secondary_lens_id=None,
            secondary_lens_score=None,
            is_blended=False,
            lens_reason_tags=[],
            lens_confidence=None,
            explain_meta={"baseline_reason": "top_score_below_35", "top_lens_id": best_id, "top_lens_score": best_score},
        )

    def weights_used(lid: str) -> List[Tuple[str, float]]:
        if lid == "LENS_STRESS_RECOVERY" and system_score(system_map, "SYS_RECOVERY") <= 0:
            return LENS_STRESS_RECOVERY_FALLBACK_WEIGHTS
        return LENS_SYSTEM_WEIGHTS.get(lid, [])

    return LensResult(
        primary_lens_id=best_id,
        primary_lens_score=round(best_score, 4),
        secondary_lens_id=None,
        secondary_lens_score=None,
        is_blended=False,
        lens_reason_tags=[],
        lens_confidence=None,
        explain_meta={
            "contributing_systems": [sid for sid, _ in weights_used(best_id)],
            "raw_lens_scores": {lid: lens_score(lid, system_map) for lid in non_baseline_lens_ids},
            "eligibility_results": {lid: lens_eligible(lid, system_map, derived_flags or {}) and default_gate_passes(lid) for lid in non_baseline_lens_ids},
        },
    )

from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Any

from client_output.baseline.contracts import RawBaselineSnapshot, SystemStatus


REQUIRED_SYSTEM_IDS = {
    "SYS_HORMONAL",
    "SYS_METABOLIC",
    "SYS_STRESS",
    "SYS_SLEEP",
    "SYS_GUT",
    "SYS_MICRO",
    "SYS_CARDIO",
    "SYS_BONE",
    "SYS_RECOVERY",
    "SYS_BIOMARKERS_CTX",
    "SYS_INFLAM_CTX",
    "SYS_NUTRITION",
}


def _validate_baseline_snapshot(raw: RawBaselineSnapshot) -> None:
    if not is_dataclass(raw):
        raise TypeError("raw must be a RawBaselineSnapshot dataclass instance")

    if not raw.baseline_date:
        raise ValueError("baseline_date is required")

    if raw.confidence is None:
        raise ValueError("confidence is required")

    if raw.safety is None:
        raise ValueError("safety is required")

    system_ids = {system.system_id for system in raw.systems}
    missing = REQUIRED_SYSTEM_IDS - system_ids
    if missing:
        raise ValueError(f"missing required systems: {sorted(missing)}")

    for system in raw.systems:
        if system.status not in ("stable", "monitor", "needs_attention"):
            raise ValueError(f"invalid system status: {system.status!r}")


def translate_baseline_snapshot(raw: RawBaselineSnapshot) -> dict[str, Any]:
    """
    Temporary orchestrator for later section builders.

    For now, validate the input contract and return a structured placeholder
    object suitable for the baseline view.
    """
    _validate_baseline_snapshot(raw)

    return {
        "baseline_date": raw.baseline_date,
        "systems_count": len(raw.systems),
        "patterns_count": len(raw.patterns),
        "priority_areas_count": len(raw.priority_areas),
        "confidence_score": raw.confidence.score,
        "safety_triggered": raw.safety.triggered,
    }


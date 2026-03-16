from __future__ import annotations

import inspect
from dataclasses import replace
from typing import Any

import pytest

from client_output.baseline.contracts import (
    RawBaselineSnapshot,
    RawSystem,
    RawSystemReasoning,
    RawCluster,
    RawPattern,
    RawPriorityArea,
    RawConfidence,
    RawSafety,
)
from client_output.baseline.translator import (
    REQUIRED_SYSTEM_IDS,
    translate_baseline_snapshot,
)


def _make_full_snapshot() -> RawBaselineSnapshot:
    systems = [
        RawSystem(
            system_id=system_id,
            score=70,
            status="stable",
            cluster_ids=[f"CL_{system_id}_1"],
            reasoning=RawSystemReasoning(
                supporting_signal_ids=[f"SIG_{system_id}_1"],
                contributing_cluster_ids=[f"CL_{system_id}_1"],
                monitor_tags=[],
            ),
        )
        for system_id in sorted(REQUIRED_SYSTEM_IDS)
    ]

    clusters = [
        RawCluster(
            cluster_id="CL_1",
            score=65,
            confidence=60,
            active=True,
            supporting_signal_ids=["SIG_A", "SIG_B"],
        ),
        RawCluster(
            cluster_id="CL_2",
            score=55,
            confidence=55,
            active=True,
            supporting_signal_ids=["SIG_C"],
        ),
    ]

    patterns = [
        RawPattern(
            pattern_id="PAT_1",
            score=75,
            confidence=70,
            supporting_cluster_ids=["CL_1", "CL_2"],
        )
    ]

    priority_areas = [
        RawPriorityArea(system_id=system_id, score=80 - idx * 5, rank=idx + 1)
        for idx, system_id in enumerate(sorted(list(REQUIRED_SYSTEM_IDS))[:3])
    ]

    confidence = RawConfidence(
        score=65,
        signal_count_factor=0.8,
        cluster_strength_factor=0.7,
        temporal_persistence_factor=0.6,
        lab_presence_factor=0.5,
        life_stage_relevance_factor=0.9,
    )

    safety = RawSafety(
        triggered=False,
        message_type=None,
        flags=[],
        interpretation_mode="normal",
    )

    return RawBaselineSnapshot(
        baseline_date="2025-01-01",
        systems=systems,
        clusters=clusters,
        patterns=patterns,
        priority_areas=priority_areas,
        confidence=confidence,
        safety=safety,
    )


def _make_low_signal_snapshot() -> RawBaselineSnapshot:
    systems = [
        RawSystem(
            system_id=system_id,
            score=10,
            status="monitor",
            cluster_ids=[],
            reasoning=RawSystemReasoning(
                supporting_signal_ids=[],
                contributing_cluster_ids=[],
                monitor_tags=["LOW_SIGNAL"],
            ),
        )
        for system_id in sorted(REQUIRED_SYSTEM_IDS)
    ]

    confidence = RawConfidence(
        score=20,
        signal_count_factor=0.2,
        cluster_strength_factor=0.1,
        temporal_persistence_factor=0.1,
        lab_presence_factor=0.0,
        life_stage_relevance_factor=0.3,
    )

    safety = RawSafety(
        triggered=False,
        message_type=None,
        flags=[],
        interpretation_mode="normal",
    )

    return RawBaselineSnapshot(
        baseline_date="2025-01-02",
        systems=systems,
        clusters=[],
        patterns=[],
        priority_areas=[],
        confidence=confidence,
        safety=safety,
    )


def _make_safety_snapshot() -> RawBaselineSnapshot:
    base = _make_low_signal_snapshot()
    safety = RawSafety(
        triggered=True,
        message_type="MSG_CLINICIAN",
        flags=["HIGH_RISK"],
        interpretation_mode="reduced_strength",
    )
    return replace(base, safety=safety)


def test_valid_full_snapshot_translates_successfully():
    snapshot = _make_full_snapshot()
    result = translate_baseline_snapshot(snapshot)

    assert result["baseline_date"] == snapshot.baseline_date
    assert result["systems_count"] == len(snapshot.systems)
    assert result["patterns_count"] == len(snapshot.patterns)
    assert result["priority_areas_count"] == len(snapshot.priority_areas)
    assert result["confidence_score"] == snapshot.confidence.score
    assert result["safety_triggered"] is False


def test_low_signal_snapshot_still_validates():
    snapshot = _make_low_signal_snapshot()
    result = translate_baseline_snapshot(snapshot)

    assert result["baseline_date"] == snapshot.baseline_date
    assert result["systems_count"] == len(snapshot.systems)
    assert result["patterns_count"] == 0
    assert result["priority_areas_count"] == 0
    assert result["confidence_score"] == snapshot.confidence.score


def test_safety_triggered_snapshot_preserves_safety_state():
    snapshot = _make_safety_snapshot()
    result = translate_baseline_snapshot(snapshot)

    assert snapshot.safety.triggered is True
    assert snapshot.safety.message_type == "MSG_CLINICIAN"
    assert snapshot.safety.interpretation_mode == "reduced_strength"
    assert result["safety_triggered"] is True


def test_missing_required_field_baseline_date_raises():
    snapshot = replace(_make_full_snapshot(), baseline_date="")
    with pytest.raises(ValueError):
        translate_baseline_snapshot(snapshot)


def test_missing_required_field_confidence_raises():
    snapshot = replace(_make_full_snapshot(), confidence=None)  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        translate_baseline_snapshot(snapshot)


def test_invalid_status_enum_raises():
    base = _make_full_snapshot()
    bad_first = replace(base.systems[0], status="warning")  # type: ignore[arg-type]
    snapshot = replace(base, systems=[bad_first, *base.systems[1:]])
    with pytest.raises(ValueError):
        translate_baseline_snapshot(snapshot)


def test_full_system_coverage_for_required_system_ids():
    snapshot = _make_full_snapshot()
    system_ids = {s.system_id for s in snapshot.systems}
    assert REQUIRED_SYSTEM_IDS.issubset(system_ids)


def test_raw_baseline_snapshot_has_no_presentation_fields():
    snapshot_fields = {f.name for f in RawBaselineSnapshot.__dataclass_fields__.values()}
    forbidden = {"title", "summary", "headline", "description", "confidence_label"}
    assert snapshot_fields.isdisjoint(forbidden)


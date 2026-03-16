"""
Automated tests for strict presentation contracts.

- Schema validation: every builder output validates against its contract.
- Unexpected field rejection: injecting pattern_id (or other forbidden field) fails.
- Required-field completeness: each builder populates all required non-null fields.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from client_output.contracts import (
    LensCardVM,
    SystemTileVM,
    RootPatternCardVM,
    ClusterCardVM,
    WatchItemVM,
    LabAwarenessCardVM,
    RecommendationVM,
    PreventiveStrategyVM,
    WeeklyInsightVM,
    DashboardVM,
)
from client_output.builders import (
    build_lens_view_models,
    build_system_status_view_models,
    build_root_pattern_view_models,
    build_cluster_view_models,
    build_watch_item_view_models,
    build_lab_awareness_view_models,
    build_recommendation_view_models,
    build_preventive_strategy_view_models,
    build_weekly_insight_view_models,
)
from client_output.validation import (
    validate_lens_cards,
    validate_system_tiles,
    validate_root_pattern_cards,
    validate_cluster_cards,
    validate_watch_items,
    validate_lab_awareness_cards,
    validate_recommendations,
    validate_preventive_strategies,
    validate_weekly_insights,
    validate_dashboard,
)


# ---------------------------------------------------------------------------
# Typical fixtures with all required fields for completeness tests
# ---------------------------------------------------------------------------

TYPICAL_LENS = {"title": "Wellness", "headline": "Wellness lens", "description": "Focus on wellness.", "focus_area": "Health"}
TYPICAL_SYSTEM = {"name": "Cardiovascular", "short_label": "Cardio", "status_label": "Stable", "summary": "System stable."}
TYPICAL_ROOT_PATTERN = {
    "title": "Pattern A",
    "short_label": "Pat A",
    "summary": "Summary.",
    "expanded_explanation": "Full explanation.",
    "evidence_label": "Evidence",
    "caution_note": "Note.",
}
TYPICAL_CLUSTER = {
    "title": "Cluster 1",
    "summary": "Cluster summary.",
    "typical_signals": ["Signal 1", "Signal 2"],
}
TYPICAL_WATCH = {"title": "Watch X", "description": "Monitor X."}
TYPICAL_LAB = {"title": "Lab item", "short_label": "Lab", "description": "Lab description."}
TYPICAL_REC = {"title": "Rec 1", "content_tag": "rec-1", "reason": "Because.", "priority": "high"}
TYPICAL_STRATEGY = {"title": "Strategy 1", "focus_description": "Focus.", "priority_area": "Area 1"}
TYPICAL_INSIGHT = {"headline": "Insight 1", "bullets": ["A", "B"], "interpretation": "Summary."}


# ---------------------------------------------------------------------------
# Schema validation: every builder output must validate against its contract
# ---------------------------------------------------------------------------

def test_lens_builder_output_validates_against_contract():
    raw = [TYPICAL_LENS]
    view_models = build_lens_view_models(raw)
    assert len(view_models) == 1
    validated = validate_lens_cards([vm.model_dump() for vm in view_models])
    assert len(validated) == 1
    assert validated[0].title == TYPICAL_LENS["title"]


def test_system_builder_output_validates_against_contract():
    raw = [TYPICAL_SYSTEM]
    view_models = build_system_status_view_models(raw)
    assert len(view_models) == 1
    validated = validate_system_tiles([vm.model_dump() for vm in view_models])
    assert len(validated) == 1
    assert validated[0].status_label == "Stable"


def test_root_pattern_builder_output_validates_against_contract():
    raw = [TYPICAL_ROOT_PATTERN]
    view_models = build_root_pattern_view_models(raw)
    assert len(view_models) == 1
    validated = validate_root_pattern_cards([vm.model_dump() for vm in view_models])
    assert len(validated) == 1
    assert validated[0].title == TYPICAL_ROOT_PATTERN["title"]


def test_cluster_builder_output_validates_against_contract():
    raw = [TYPICAL_CLUSTER]
    view_models = build_cluster_view_models(raw)
    assert len(view_models) == 1
    validated = validate_cluster_cards([vm.model_dump() for vm in view_models])
    assert len(validated) == 1
    assert validated[0].typical_signals == TYPICAL_CLUSTER["typical_signals"]


def test_watch_builder_output_validates_against_contract():
    raw = [TYPICAL_WATCH]
    view_models = build_watch_item_view_models(raw)
    assert len(view_models) == 1
    validated = validate_watch_items([vm.model_dump() for vm in view_models])
    assert len(validated) == 1


def test_lab_awareness_builder_output_validates_against_contract():
    raw = [TYPICAL_LAB]
    view_models = build_lab_awareness_view_models(raw)
    assert len(view_models) == 1
    validated = validate_lab_awareness_cards([vm.model_dump() for vm in view_models])
    assert len(validated) == 1


def test_recommendation_builder_output_validates_against_contract():
    raw = [TYPICAL_REC]
    view_models = build_recommendation_view_models(raw)
    assert len(view_models) == 1
    validated = validate_recommendations([vm.model_dump() for vm in view_models])
    assert len(validated) == 1


def test_preventive_strategy_builder_output_validates_against_contract():
    raw = [TYPICAL_STRATEGY]
    view_models = build_preventive_strategy_view_models(raw)
    assert len(view_models) == 1
    validated = validate_preventive_strategies([vm.model_dump() for vm in view_models])
    assert len(validated) == 1


def test_weekly_insight_builder_output_validates_against_contract():
    raw = [TYPICAL_INSIGHT]
    view_models = build_weekly_insight_view_models(raw)
    assert len(view_models) == 1
    validated = validate_weekly_insights([vm.model_dump() for vm in view_models])
    assert len(validated) == 1


def test_full_dashboard_validates_against_dashboard_vm():
    raw = {
        "lenses": [TYPICAL_LENS],
        "systems": [TYPICAL_SYSTEM],
        "root_patterns": [TYPICAL_ROOT_PATTERN],
        "clusters": [TYPICAL_CLUSTER],
        "watch_items": [TYPICAL_WATCH],
        "lab_awareness": [TYPICAL_LAB],
        "recommendations": [TYPICAL_REC],
        "preventive_strategies": [TYPICAL_STRATEGY],
        "weekly_insights": [TYPICAL_INSIGHT],
    }
    from client_output.translator import build_dashboard_vm
    dashboard = build_dashboard_vm(raw)
    payload = dashboard.model_dump()
    validated = validate_dashboard(payload)
    assert len(validated.lenses) == 1
    # Recommendations are now built from hierarchy (lens/patterns/clusters/systems); max 3
    assert len(validated.recommendations) <= 3


# ---------------------------------------------------------------------------
# Unexpected field rejection: inject pattern_id (or unsupported field), assert validation fails
# ---------------------------------------------------------------------------

def test_unsupported_field_pattern_id_rejected():
    """Inject pattern_id into a VM payload; validation must fail (extra='forbid')."""
    valid_payload = {
        "title": "Pattern A",
        "short_label": "Pat A",
        "summary": "S",
        "expanded_explanation": "E",
        "confidence_label": "high",
        "confidence_text": "High",
        "evidence_label": "Ev",
        "caution_note": "N",
    }
    with pytest.raises(ValidationError) as exc_info:
        RootPatternCardVM.model_validate({**valid_payload, "pattern_id": "uuid-123"})
    assert "pattern_id" in str(exc_info.value).lower() or "extra" in str(exc_info.value).lower()


def test_unsupported_field_cluster_id_rejected():
    valid_payload = {
        "title": "C1",
        "summary": "S",
        "typical_signals": [],
        "confidence_label": "medium",
        "confidence_text": "Medium",
    }
    with pytest.raises(ValidationError) as exc_info:
        ClusterCardVM.model_validate({**valid_payload, "cluster_id": "abc"})
    assert "cluster_id" in str(exc_info.value).lower() or "extra" in str(exc_info.value).lower()


def test_unsupported_field_system_id_rejected():
    valid_payload = {
        "title": "Sys",
        "short_label": "S",
        "status_label": "Stable",
        "summary": "Summary",
    }
    with pytest.raises(ValidationError):
        SystemTileVM.model_validate({**valid_payload, "system_id": "xyz"})


def test_unsupported_field_lens_id_rejected():
    valid_payload = {"title": "L", "headline": "H", "description": "D"}
    with pytest.raises(ValidationError):
        LensCardVM.model_validate({**valid_payload, "lens_id": "id-1"})


# ---------------------------------------------------------------------------
# Required-field completeness: each builder populates all required non-null fields
# ---------------------------------------------------------------------------

def test_lens_builder_populates_all_required_fields():
    view_models = build_lens_view_models([TYPICAL_LENS])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Wellness"
    assert vm.headline == "Wellness lens"
    assert vm.description == "Focus on wellness."
    assert vm.focus_area == "Health"


def test_system_builder_populates_all_required_fields():
    view_models = build_system_status_view_models([TYPICAL_SYSTEM])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Cardiovascular"
    assert vm.short_label == "Cardio"
    assert vm.status_label == "Stable"
    assert vm.summary == "System stable."


def test_root_pattern_builder_populates_all_required_fields():
    view_models = build_root_pattern_view_models([TYPICAL_ROOT_PATTERN])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Pattern A"
    assert vm.short_label == "Pat A"
    assert vm.summary == "Summary."
    assert vm.expanded_explanation == "Full explanation."
    assert vm.confidence_label in ("Low signal", "Moderate support", "Strong support", "Very strong support")
    assert vm.confidence_text
    assert vm.evidence_label == "Evidence"
    assert vm.caution_note == "Note."


def test_cluster_builder_populates_all_required_fields():
    view_models = build_cluster_view_models([TYPICAL_CLUSTER])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Cluster 1"
    assert vm.summary == "Cluster summary."
    assert vm.typical_signals == ["Signal 1", "Signal 2"]
    assert vm.confidence_label in ("Low signal", "Moderate support", "Strong support", "Very strong support")
    assert vm.confidence_text


def test_watch_builder_populates_all_required_fields():
    view_models = build_watch_item_view_models([TYPICAL_WATCH])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Watch X"
    assert vm.description == "Monitor X."


def test_lab_awareness_builder_populates_all_required_fields():
    view_models = build_lab_awareness_view_models([TYPICAL_LAB])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Lab item"
    assert vm.short_label == "Lab"
    assert vm.description == "Lab description."


def test_recommendation_builder_populates_all_required_fields():
    view_models = build_recommendation_view_models([TYPICAL_REC])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.content_tag == "rec-1"
    assert vm.title == "Rec 1"
    assert vm.reason == "Because."
    assert vm.priority == "high"


def test_preventive_strategy_builder_populates_all_required_fields():
    view_models = build_preventive_strategy_view_models([TYPICAL_STRATEGY])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.title == "Strategy 1"
    assert vm.focus_description == "Focus."
    assert vm.priority_area == "Area 1"


def test_weekly_insight_builder_populates_all_required_fields():
    view_models = build_weekly_insight_view_models([TYPICAL_INSIGHT])
    assert len(view_models) == 1
    vm = view_models[0]
    assert vm.headline == "Insight 1"
    assert vm.bullets == ["A", "B"]
    assert vm.interpretation == "Summary."

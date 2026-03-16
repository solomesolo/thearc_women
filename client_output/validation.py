"""
Validation: ensure builder output conforms to strict presentation contracts.

Validates by constructing Pydantic models (extra='forbid'); invalid or
extra fields raise ValidationError. Use to guard the UI from debug/raw data.
"""

from __future__ import annotations

from typing import Any

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


def validate_lens_cards(items: list[dict[str, Any]]) -> list[LensCardVM]:
    """Validate and return list of LensCardVM; raises ValidationError if invalid."""
    return [LensCardVM.model_validate(x) for x in items]


def validate_system_tiles(items: list[dict[str, Any]]) -> list[SystemTileVM]:
    """Validate and return list of SystemTileVM; raises ValidationError if invalid."""
    return [SystemTileVM.model_validate(x) for x in items]


def validate_root_pattern_cards(items: list[dict[str, Any]]) -> list[RootPatternCardVM]:
    """Validate and return list of RootPatternCardVM; raises ValidationError if invalid."""
    return [RootPatternCardVM.model_validate(x) for x in items]


def validate_cluster_cards(items: list[dict[str, Any]]) -> list[ClusterCardVM]:
    """Validate and return list of ClusterCardVM; raises ValidationError if invalid."""
    return [ClusterCardVM.model_validate(x) for x in items]


def validate_watch_items(items: list[dict[str, Any]]) -> list[WatchItemVM]:
    """Validate and return list of WatchItemVM; raises ValidationError if invalid."""
    return [WatchItemVM.model_validate(x) for x in items]


def validate_lab_awareness_cards(items: list[dict[str, Any]]) -> list[LabAwarenessCardVM]:
    """Validate and return list of LabAwarenessCardVM; raises ValidationError if invalid."""
    return [LabAwarenessCardVM.model_validate(x) for x in items]


def validate_recommendations(items: list[dict[str, Any]]) -> list[RecommendationVM]:
    """Validate and return list of RecommendationVM; raises ValidationError if invalid."""
    return [RecommendationVM.model_validate(x) for x in items]


def validate_preventive_strategies(items: list[dict[str, Any]]) -> list[PreventiveStrategyVM]:
    """Validate and return list of PreventiveStrategyVM; raises ValidationError if invalid."""
    return [PreventiveStrategyVM.model_validate(x) for x in items]


def validate_weekly_insights(items: list[dict[str, Any]]) -> list[WeeklyInsightVM]:
    """Validate and return list of WeeklyInsightVM; raises ValidationError if invalid."""
    return [WeeklyInsightVM.model_validate(x) for x in items]


def validate_dashboard(payload: dict[str, Any]) -> DashboardVM:
    """
    Validate full dashboard payload against DashboardVM contract.
    Raises ValidationError if any section has invalid or unexpected fields.
    """
    return DashboardVM.model_validate(payload)

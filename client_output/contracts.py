"""
Presentation contracts (view models) for the dashboard.

UI code must consume only these types. Raw engine IDs (cluster_id, pattern_id,
system_id, lens_id) and raw confidence values must not be exposed; use
display-safe labels and confidence tiers from this module instead.

Strict section contracts (LensCardVM, SystemTileVM, etc.) are Pydantic models
with extra='forbid' so unexpected fields (e.g. pattern_id) cause validation failure.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Confidence & safety (display-only, no raw values)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ConfidenceTier:
    """Display-safe confidence level (e.g. 'high', 'medium', 'low')."""

    label: str
    sort_order: int


@dataclass(frozen=True)
class DisplayConfidence:
    """Confidence as shown in the UI; no raw numeric value exposed."""

    tier: ConfidenceTier
    display_text: str


# ---------------------------------------------------------------------------
# Strict presentation contracts (Pydantic, extra='forbid')
# UI and builders must use only these; no engine IDs or raw confidence.
# ---------------------------------------------------------------------------

_FORBID_EXTRA = ConfigDict(extra="forbid")


class LensCardVM(BaseModel):
    """Strict contract for lens card. No lens_id or raw confidence."""

    model_config = _FORBID_EXTRA

    title: str
    headline: str
    description: str
    focus_area: Optional[str] = None


class SystemTileVM(BaseModel):
    """Strict contract for system status tile. No system_id."""

    model_config = _FORBID_EXTRA

    title: str
    short_label: str
    status_label: Literal["Stable", "Variable", "Needs attention"]
    summary: str


class RootPatternCardVM(BaseModel):
    """Strict contract for root pattern card. No pattern_id or raw confidence."""

    model_config = _FORBID_EXTRA

    title: str
    short_label: str
    summary: str
    expanded_explanation: str
    confidence_label: str
    confidence_text: str
    evidence_label: str
    caution_note: str


class ClusterCardVM(BaseModel):
    """Strict contract for cluster card. No cluster_id or raw confidence."""

    model_config = _FORBID_EXTRA

    title: str
    summary: str
    typical_signals: list[str]
    confidence_label: str
    confidence_text: str


class WatchItemVM(BaseModel):
    """Strict contract for watch list item. No internal IDs."""

    model_config = _FORBID_EXTRA

    title: str
    description: str


class LabAwarenessCardVM(BaseModel):
    """Strict contract for lab awareness card. No internal IDs."""

    model_config = _FORBID_EXTRA

    title: str
    short_label: str
    description: str


class RecommendationVM(BaseModel):
    """Strict contract for recommendation. No internal IDs."""

    model_config = _FORBID_EXTRA

    content_tag: str
    title: str
    reason: str
    priority: Literal["high", "medium", "low"]


class PreventiveStrategyVM(BaseModel):
    """Strict contract for preventive strategy. No internal IDs."""

    model_config = _FORBID_EXTRA

    title: str
    focus_description: str
    priority_area: str


class WeeklyInsightVM(BaseModel):
    """Strict contract for weekly insight. No internal IDs or raw confidence."""

    model_config = _FORBID_EXTRA

    headline: str
    bullets: list[str]
    interpretation: str


class DashboardVM(BaseModel):
    """Aggregate dashboard view; all sections use strict contracts only."""

    model_config = _FORBID_EXTRA

    lenses: list[LensCardVM] = []
    systems: list[SystemTileVM] = []
    root_patterns: list[RootPatternCardVM] = []
    clusters: list[ClusterCardVM] = []
    watch_items: list[WatchItemVM] = []
    lab_awareness: list[LabAwarenessCardVM] = []
    recommendations: list[RecommendationVM] = []
    preventive_strategies: list[PreventiveStrategyVM] = []
    weekly_insights: list[WeeklyInsightVM] = []


# ---------------------------------------------------------------------------
# Legacy view models (used internally by builders before mapping to strict VMs)
# ---------------------------------------------------------------------------


@dataclass
class LensViewModel:
    """View model for a lens; UI refers to it by display key/label only."""

    display_key: str
    label: str
    description: str
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class SystemStatusViewModel:
    """View model for system status; no system_id exposed."""

    display_key: str
    name: str
    status_label: str
    summary: str
    confidence: DisplayConfidence
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class RootPatternViewModel:
    """View model for a root pattern; no pattern_id exposed."""

    display_key: str
    title: str
    description: str
    confidence: DisplayConfidence
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class ClusterViewModel:
    """View model for a cluster; no cluster_id exposed."""

    display_key: str
    title: str
    summary: str
    confidence: DisplayConfidence
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class WatchItemViewModel:
    """View model for a watch-list item."""

    display_key: str
    title: str
    description: str
    priority_label: str
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class LabAwarenessViewModel:
    """View model for lab-awareness content."""

    display_key: str
    title: str
    summary: str
    confidence: DisplayConfidence
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class RecommendationViewModel:
    """View model for a recommendation."""

    display_key: str
    title: str
    body: str
    priority_label: str
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class PreventiveStrategyViewModel:
    """View model for a preventive strategy."""

    display_key: str
    title: str
    description: str
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class WeeklyInsightViewModel:
    """View model for a weekly insight."""

    display_key: str
    title: str
    summary: str
    confidence: DisplayConfidence
    sort_order: int
    extra: dict[str, Any] = field(default_factory=dict)

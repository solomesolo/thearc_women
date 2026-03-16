from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional


SystemStatus = Literal["stable", "monitor", "needs_attention"]


@dataclass(frozen=True)
class RawSystemReasoning:
    supporting_signal_ids: list[str] = field(default_factory=list)
    contributing_cluster_ids: list[str] = field(default_factory=list)
    monitor_tags: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class RawSystem:
    system_id: str
    score: int
    status: SystemStatus
    cluster_ids: list[str] = field(default_factory=list)
    reasoning: RawSystemReasoning = field(default_factory=RawSystemReasoning)


@dataclass(frozen=True)
class RawCluster:
    cluster_id: str
    score: int
    confidence: int
    active: bool
    supporting_signal_ids: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class RawPattern:
    pattern_id: str
    score: int
    confidence: int
    supporting_cluster_ids: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class RawPriorityArea:
    system_id: str
    score: int
    rank: int


@dataclass(frozen=True)
class RawConfidence:
    score: int
    signal_count_factor: float
    cluster_strength_factor: float
    temporal_persistence_factor: float
    lab_presence_factor: float
    life_stage_relevance_factor: float


@dataclass(frozen=True)
class RawSafety:
    triggered: bool
    message_type: Optional[str]
    flags: list[str] = field(default_factory=list)
    interpretation_mode: Literal["normal", "reduced_strength"] = "normal"


@dataclass(frozen=True)
class RawBaselineSnapshot:
    baseline_date: str
    systems: list[RawSystem] = field(default_factory=list)
    clusters: list[RawCluster] = field(default_factory=list)
    patterns: list[RawPattern] = field(default_factory=list)
    priority_areas: list[RawPriorityArea] = field(default_factory=list)
    confidence: RawConfidence = field(default=None)  # type: ignore[assignment]
    safety: RawSafety = field(default=None)  # type: ignore[assignment]


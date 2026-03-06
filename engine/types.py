"""
Canonical types for the medical reasoning engine.

Input, intermediate, and output shapes. All fields reserved for the pipeline;
business logic fills them in later stages.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# --- Basic input types ---


@dataclass
class SymptomInput:
    symptom_id: str
    severity: Optional[int] = None
    frequency: Optional[int] = None
    duration_days: Optional[int] = None
    timing: Optional[str] = None
    phase_link: Optional[str] = None
    post_meal: Optional[bool] = None


@dataclass
class LabInput:
    lab_id: str
    value: Optional[float] = None
    date: Optional[str] = None
    value_state: Optional[str] = None


@dataclass
class SurveyInput:
    life_stage: Optional[str] = None
    age_years: Optional[int] = None
    symptom_inputs: List[SymptomInput] = field(default_factory=list)
    raw_fields: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EngineInput:
    user_id: str
    timestamp: str
    time_window: str = "7d"
    survey: SurveyInput = field(default_factory=SurveyInput)
    labs: List[LabInput] = field(default_factory=list)
    history: Dict[str, Any] = field(default_factory=dict)


# --- Intermediate types ---


@dataclass
class SignalScore:
    symptom_id: str
    score: float
    missing_fields: List[str] = field(default_factory=list)


@dataclass
class ClusterResult:
    cluster_id: str
    strength: float = 0.0
    confidence: float = 0.0
    supporting_signals: List[str] = field(default_factory=list)
    confounders_applied: List[str] = field(default_factory=list)
    reasoning_trace_id: Optional[str] = None


@dataclass
class SystemResult:
    system_id: str
    score: float = 0.0
    status: str = "stable"
    top_drivers: List[str] = field(default_factory=list)
    reasoning_trace_id: Optional[str] = None


@dataclass
class RootPatternResult:
    pattern_id: str
    score: float = 0.0
    confidence: float = 0.0
    evidence_level: Optional[str] = None
    reasoning_trace_id: Optional[str] = None


@dataclass
class LensResult:
    primary_lens_id: str = "LENS_BASELINE"
    primary_lens_score: float = 0.0
    secondary_lens_id: Optional[str] = None
    secondary_lens_score: Optional[float] = None
    is_blended: bool = False
    lens_reason_tags: List[str] = field(default_factory=list)
    lens_confidence: Optional[float] = None
    reasoning_trace_id: Optional[str] = None


@dataclass
class SafetyPrompt:
    safety_rule_id: str
    priority: str
    message_type: str
    trigger_signals: List[str] = field(default_factory=list)
    escalation: Optional[str] = None
    cluster_override: List[str] = field(default_factory=list)
    reasoning_trace_id: Optional[str] = None


# --- Final output type ---


@dataclass
class EngineOutput:
    user_id: str
    timestamp: str
    time_window: str
    last_updated_days: Optional[int] = None
    life_stage: Optional[str] = None
    cycle_status: Optional[str] = None

    signal_scores: List[SignalScore] = field(default_factory=list)
    clusters: List[ClusterResult] = field(default_factory=list)
    systems: List[SystemResult] = field(default_factory=list)
    root_patterns: List[RootPatternResult] = field(default_factory=list)

    lens: LensResult = field(default_factory=LensResult)
    safety_prompts: List[SafetyPrompt] = field(default_factory=list)

    watch_items: List[Dict[str, Any]] = field(default_factory=list)
    lab_awareness: List[Dict[str, Any]] = field(default_factory=list)
    biological_priorities: List[Dict[str, Any]] = field(default_factory=list)
    weekly_insights: List[Dict[str, Any]] = field(default_factory=list)

    debug_meta: Dict[str, Any] = field(default_factory=dict)

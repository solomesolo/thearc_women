"""
Medical reasoning engine.

Pipeline: Survey Inputs → Signal Scoring → Cluster Detection → Temporal Stability
→ Cluster Confidence Adjustment → System Scoring → Root Pattern Mapping
→ Lens Selection → Safety Overrides → Dashboard Output → Reasoning Traces.
"""

from engine.config import DEFAULT_CONFIG, EngineConfig
from engine.errors import (
    EngineError,
    EngineValidationError,
    MalformedInputError,
    RuleEvaluationError,
    UnknownEntityIdError,
)
from engine.run import run_engine
from engine.types import (
    ClusterResult,
    EngineInput,
    EngineOutput,
    LabInput,
    LensResult,
    RootPatternResult,
    SafetyPrompt,
    SignalScore,
    SurveyInput,
    SymptomInput,
    SystemResult,
)

__all__ = [
    "DEFAULT_CONFIG",
    "EngineConfig",
    "EngineError",
    "EngineInput",
    "EngineOutput",
    "EngineValidationError",
    "MalformedInputError",
    "RuleEvaluationError",
    "UnknownEntityIdError",
    "ClusterResult",
    "LabInput",
    "LensResult",
    "RootPatternResult",
    "SafetyPrompt",
    "SignalScore",
    "SurveyInput",
    "SymptomInput",
    "SystemResult",
    "run_engine",
]

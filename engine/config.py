"""
Minimal engine configuration.

strict_id_validation=True: unknown IDs raise errors.
default_system_confidence=70: used by lens selection when system confidence is unavailable.
enable_reasoning_traces=True: reserves trace support from the start.
time_window_default="7d": deterministic default behavior.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class EngineConfig:
    strict_id_validation: bool = True
    default_system_confidence: int = 70
    enable_reasoning_traces: bool = True
    time_window_default: str = "7d"


DEFAULT_CONFIG = EngineConfig()

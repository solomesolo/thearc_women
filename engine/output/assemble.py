"""
Assemble final EngineOutput from pipeline stage results.
"""

from engine.types import EngineInput, EngineOutput, LensResult


def assemble_engine_output(
    engine_input: EngineInput,
    normalized_survey,
    signal_scores,
    clusters,
    systems,
    root_patterns,
    lens: LensResult,
    safety_prompts,
    derived_flags,
    temporal_meta,
    registry,
    config,
) -> EngineOutput:
    """Build and return EngineOutput. Stub: minimal valid output."""
    return EngineOutput(
        user_id=engine_input.user_id,
        timestamp=engine_input.timestamp,
        time_window=engine_input.time_window,
        life_stage=normalized_survey.life_stage if normalized_survey else None,
        signal_scores=signal_scores or [],
        clusters=clusters or [],
        systems=systems or [],
        root_patterns=root_patterns or [],
        lens=lens or LensResult(),
        safety_prompts=safety_prompts or [],
    )

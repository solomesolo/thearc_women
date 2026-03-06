"""
Single orchestrator entrypoint. Calls all stages in fixed order.
No business logic inline; each stage is a pure function.
"""

from engine.config import DEFAULT_CONFIG, EngineConfig
from engine.ids.registry import get_default_registry
from engine.ids.validators import validate_engine_input
from engine.ingest.labs_normalize import normalize_lab_inputs
from engine.ingest.survey_normalize import normalize_survey_input
from engine.output.assemble import assemble_engine_output
from engine.safety.evaluator import evaluate_safety
from engine.signals.flags import compute_derived_flags
from engine.signals.scorer import compute_signal_scores
from engine.clusters.engine import compute_clusters
from engine.temporal.persistence import apply_temporal_logic
from engine.labs.modifiers import apply_lab_modifiers
from engine.systems.scorer import compute_systems
from engine.patterns.mapper import map_root_patterns
from engine.lens.selector import select_lens
from engine.trace.builders import attach_reasoning_traces
from engine.types import EngineInput, EngineOutput


def run_engine(
    engine_input: EngineInput,
    config: EngineConfig = DEFAULT_CONFIG,
) -> EngineOutput:
    """Run the full pipeline and return EngineOutput."""
    registry = get_default_registry()
    validate_engine_input(engine_input, registry, config)

    normalized_survey = normalize_survey_input(engine_input.survey, registry, config)
    normalized_labs = normalize_lab_inputs(
        engine_input.labs, registry, config, reference_timestamp=engine_input.timestamp
    )

    signal_scores = compute_signal_scores(normalized_survey, registry, config)
    derived_flags = compute_derived_flags(
        normalized_survey, signal_scores, registry, config
    )

    clusters = compute_clusters(
        signal_scores, derived_flags, normalized_survey, registry, config
    )
    clusters, temporal_meta = apply_temporal_logic(
        clusters, engine_input.history, registry, config
    )
    clusters = apply_lab_modifiers(clusters, normalized_labs, registry, config)

    systems = compute_systems(clusters, registry, config)
    root_patterns = map_root_patterns(
        clusters, systems, derived_flags, normalized_survey, registry, config
    )
    lens = select_lens(systems, derived_flags, registry, config)
    safety_prompts = evaluate_safety(
        normalized_survey, signal_scores, clusters, root_patterns, registry, config
    )

    output = assemble_engine_output(
        engine_input,
        normalized_survey,
        signal_scores,
        clusters,
        systems,
        root_patterns,
        lens,
        safety_prompts,
        derived_flags,
        temporal_meta,
        registry,
        config,
    )

    if config.enable_reasoning_traces:
        output = attach_reasoning_traces(output, registry, config)

    return output

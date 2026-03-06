"""
Assemble final EngineOutput from pipeline stage results.
Phase 10: output first, prose second; preserve IDs; degrade gracefully.
"""

from typing import Any, Dict, List, Optional

from engine.types import EngineInput, EngineOutput, LensResult

from engine.output.templates.lens import build_primary_lens_card
from engine.output.templates.systems import (
    build_system_detail_inspector,
    build_systems_map,
)


def compute_cycle_status(normalized_survey: Any) -> Optional[str]:
    """Derive cycle_status from normalized_survey per output schema."""
    if not normalized_survey:
        return None
    life_stage = getattr(normalized_survey, "life_stage", None)
    if life_stage == "LS_PERI":
        return "perimenopause"
    if life_stage in {"LS_MENO", "LS_POSTMENO", "LS_SURG_MENO"}:
        return "menopause"
    if life_stage == "LS_POSTPARTUM":
        return "postpartum"
    if life_stage == "LS_BREASTFEED":
        return "breastfeeding"
    contraception = getattr(normalized_survey, "contraception_type", None)
    if contraception not in (None, "none"):
        return "on_hormonal_contraception"
    has_periods = getattr(normalized_survey, "has_periods", None)
    if has_periods is False:
        return "no_periods_other"
    return "cycling"


def compute_last_updated_days(engine_input: EngineInput) -> int:
    """Whole-day difference from prior update; MVP returns 0."""
    return 0


def build_dashboard_sections(
    lens: Any,
    systems: Any,
    clusters: Any,
    root_patterns: Any,
    safety_prompts: Any,
    safety_meta: Optional[Dict[str, Any]] = None,
    registry: Any = None,
    config: Any = None,
) -> Dict[str, Any]:
    """Build dashboard_sections with required keys; lens card and systems from templates."""
    systems_map = build_systems_map(systems, registry, config)
    selected_system_id = systems_map.get("selected_system_id")
    sections: Dict[str, Any] = {
        "primary_lens_card": build_primary_lens_card(lens, registry, config),
        "systems_map": systems_map,
        "system_detail_inspector": build_system_detail_inspector(
            systems, selected_system_id, registry, config
        ),
        "clusters_panel": _section_clusters_panel(clusters),
        "root_patterns_panel": _section_root_patterns_panel(root_patterns),
        "safety_panel": _section_safety_panel(safety_prompts, safety_meta),
    }
    return sections


def _section_clusters_panel(clusters: Any) -> Dict[str, Any]:
    """Clusters panel; pass through with minimal shape."""
    items = clusters or []
    return {
        "clusters": [
            {
                "cluster_id": getattr(c, "cluster_id", ""),
                "strength": float(getattr(c, "strength", 0) or 0),
                "confidence": float(getattr(c, "confidence", 0) or 0),
                "reasoning_trace_id": getattr(c, "reasoning_trace_id", None),
            }
            for c in items
        ],
    }


def _section_root_patterns_panel(root_patterns: Any) -> Dict[str, Any]:
    """Root patterns panel; pass through with minimal shape."""
    items = root_patterns or []
    return {
        "root_patterns": [
            {
                "pattern_id": getattr(r, "pattern_id", ""),
                "score": float(getattr(r, "score", 0) or 0),
                "confidence": float(getattr(r, "confidence", 0) or 0),
                "evidence_level": getattr(r, "evidence_level", None),
                "reasoning_trace_id": getattr(r, "reasoning_trace_id", None),
            }
            for r in items
        ],
    }


def _section_safety_panel(
    safety_prompts: Any,
    safety_meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Safety panel; prompts and override metadata."""
    prompts = safety_prompts or []
    return {
        "prompts": [
            {
                "safety_rule_id": getattr(p, "safety_rule_id", ""),
                "priority": getattr(p, "priority", ""),
                "message_type": getattr(p, "message_type", ""),
                "reasoning_trace_id": getattr(p, "reasoning_trace_id", None),
            }
            for p in prompts
        ],
        "meta": dict(safety_meta) if safety_meta else {},
    }


def assemble_engine_output(
    engine_input: EngineInput,
    normalized_survey: Any,
    signal_scores: Any,
    clusters: Any,
    systems: Any,
    root_patterns: Any,
    lens: LensResult,
    safety_prompts: Any,
    derived_flags: Any,
    temporal_meta: Any,
    registry: Any,
    config: Any,
    safety_meta: Optional[Dict[str, Any]] = None,
    mapping_meta: Optional[Dict[str, Any]] = None,
    lab_meta: Optional[Dict[str, Any]] = None,
) -> EngineOutput:
    """Build canonical EngineOutput with top-level context, arrays, dashboard sections, and debug_meta."""
    cycle_status = compute_cycle_status(normalized_survey)
    last_updated_days = compute_last_updated_days(engine_input)
    life_stage = getattr(normalized_survey, "life_stage", None) if normalized_survey else None

    dashboard_sections = build_dashboard_sections(
        lens, systems, clusters, root_patterns, safety_prompts, safety_meta, registry, config
    )

    debug_meta: Dict[str, Any] = {}
    if safety_meta is not None:
        debug_meta["safety_meta"] = safety_meta
    if temporal_meta is not None:
        debug_meta["temporal_meta"] = temporal_meta
    if mapping_meta is not None:
        debug_meta["mapping_meta"] = mapping_meta
    if lab_meta is not None:
        debug_meta["lab_meta"] = lab_meta

    return EngineOutput(
        user_id=engine_input.user_id,
        timestamp=engine_input.timestamp,
        time_window=getattr(engine_input, "time_window", "7d"),
        last_updated_days=last_updated_days,
        life_stage=life_stage,
        cycle_status=cycle_status,
        signal_scores=signal_scores or [],
        clusters=clusters or [],
        systems=systems or [],
        root_patterns=root_patterns or [],
        lens=lens or LensResult(),
        safety_prompts=safety_prompts or [],
        watch_items=[],
        lab_awareness=[],
        biological_priorities=[],
        weekly_insights=[],
        dashboard_sections=dashboard_sections,
        debug_meta=debug_meta,
    )

"""
Translator: maps raw engine entities to presentation view models.

This module is the single entry point for converting engine output (clusters,
patterns, systems, lenses, etc.) into display-safe view models. It uses
builders and content modules internally; it does not expose raw IDs or
raw confidence values to callers. Returns a validated DashboardVM.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import DashboardVM
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
from client_output.content import build_display_dictionary
from client_output.watch_catalog import build_watch_items
from client_output.lab_awareness_library import build_lab_awareness_cards
from client_output.recommendation_library import build_recommendations
from client_output.preventive_strategy_library import build_preventive_strategies
from client_output.weekly_insight_rules import build_weekly_insights


def build_dashboard_view(raw_engine_output: dict[str, Any]) -> dict[str, Any]:
    """
    Turn raw engine output into a dashboard-ready view.

    All IDs and raw confidence values are translated into strict contract
    types (LensCardVM, SystemTileVM, etc.). The returned structure contains
    only validated view models and a display_dictionary for UI lookups.
    """
    raw = raw_engine_output

    lenses = build_lens_view_models(raw.get("lenses") or [])
    systems = build_system_status_view_models(raw.get("systems") or [])
    root_patterns = build_root_pattern_view_models(raw.get("root_patterns") or [])
    clusters_raw = raw.get("clusters") or []
    clusters = build_cluster_view_models(clusters_raw)
    watch_items = build_watch_items(clusters_raw, raw.get("temporal_state"))
    lab_awareness = build_lab_awareness_cards(raw.get("root_patterns") or [])
    recommendations = build_recommendations(raw)
    preventive_strategies = build_preventive_strategies(
        raw.get("root_patterns") or [],
        raw.get("systems") or [],
    )
    weekly_insights = build_weekly_insights(
        raw.get("temporal_state") or {},
        raw.get("safety_state") or {},
    )

    dashboard = DashboardVM(
        lenses=lenses,
        systems=systems,
        root_patterns=root_patterns,
        clusters=clusters,
        watch_items=watch_items,
        lab_awareness=lab_awareness,
        recommendations=recommendations,
        preventive_strategies=preventive_strategies,
        weekly_insights=weekly_insights,
    )

    payload = dashboard.model_dump()
    payload["display_dictionary"] = build_display_dictionary(dashboard)
    return payload


def build_dashboard_vm(raw_engine_output: dict[str, Any]) -> DashboardVM:
    """
    Turn raw engine output into a DashboardVM (strict contract only).
    Use when the caller wants the typed model rather than a dict.
    """
    raw = raw_engine_output
    clusters_raw = raw.get("clusters") or []
    return DashboardVM(
        lenses=build_lens_view_models(raw.get("lenses") or []),
        systems=build_system_status_view_models(raw.get("systems") or []),
        root_patterns=build_root_pattern_view_models(raw.get("root_patterns") or []),
        clusters=build_cluster_view_models(clusters_raw),
        watch_items=build_watch_items(clusters_raw, raw.get("temporal_state")),
        lab_awareness=build_lab_awareness_cards(raw.get("root_patterns") or []),
        recommendations=build_recommendations(raw),
        preventive_strategies=build_preventive_strategies(
            raw.get("root_patterns") or [],
            raw.get("systems") or [],
        ),
        weekly_insights=build_weekly_insights(
            raw.get("temporal_state") or {},
            raw.get("safety_state") or {},
        ),
    )

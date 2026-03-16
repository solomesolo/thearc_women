"""
client_output — presentation layer for dashboard UI.

This package is the single place that turns raw engine entities into UI objects.
Dashboard components consume only view-model / presentation contracts from here;
they must not read cluster_id, pattern_id, system_id, lens_id, or raw confidence
directly. The interpretation layer sits downstream of the engine and does not
modify reasoning.
"""

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
from client_output.display_resolver import (
    DisplayDictionaryError,
    resolve_cluster,
    resolve_system,
    resolve_pattern,
    resolve_lab,
    resolve_lens,
    resolve_message_type,
)
from client_output.confidence import ConfidenceBand, map_confidence, map_confidence_optional
from client_output.lens_card import build_lens_card, LensConfigError
from client_output.root_pattern_card import build_root_pattern_card, RootPatternConfigError
from client_output.cluster_card import build_cluster_card, ClusterConfigError
from client_output.watch_catalog import build_watch_items
from client_output.lab_awareness_library import build_lab_awareness_cards
from client_output.recommendation_library import build_recommendations
from client_output.preventive_strategy_library import build_preventive_strategies
from client_output.language_safety import (
    LanguageSafetyError,
    LanguageSafetyValidator,
    ValidationContext,
    validate_text as validate_language_safety,
    sanitize_or_raise as sanitize_language_or_raise,
    validate_dashboard_strings,
)

__all__ = [
    "LensCardVM",
    "SystemTileVM",
    "RootPatternCardVM",
    "ClusterCardVM",
    "WatchItemVM",
    "LabAwarenessCardVM",
    "RecommendationVM",
    "PreventiveStrategyVM",
    "WeeklyInsightVM",
    "DashboardVM",
    "DisplayDictionaryError",
    "resolve_cluster",
    "resolve_system",
    "resolve_pattern",
    "resolve_lab",
    "resolve_lens",
    "resolve_message_type",
    "ConfidenceBand",
    "map_confidence",
    "map_confidence_optional",
    "build_lens_card",
    "LensConfigError",
    "build_root_pattern_card",
    "RootPatternConfigError",
    "build_cluster_card",
    "ClusterConfigError",
    "build_watch_items",
    "build_lab_awareness_cards",
    "build_recommendations",
    "build_preventive_strategies",
    "LanguageSafetyError",
    "LanguageSafetyValidator",
    "ValidationContext",
    "validate_language_safety",
    "sanitize_language_or_raise",
    "validate_dashboard_strings",
]

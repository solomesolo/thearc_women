"""
Builders: construct view models from raw engine entities.

Each builder turns one category of engine output (lenses, systems, patterns,
clusters, etc.) into the corresponding view model. They use dictionary and
confidence modules to produce display keys and display-safe confidence only.
"""

from client_output.builders.lens import build_lens_view_models
from client_output.builders.systems import build_system_status_view_models
from client_output.builders.root_patterns import build_root_pattern_view_models
from client_output.builders.clusters import build_cluster_view_models
from client_output.builders.watch_items import build_watch_item_view_models
from client_output.builders.lab_awareness import build_lab_awareness_view_models
from client_output.builders.recommendations import build_recommendation_view_models
from client_output.builders.preventive_strategies import build_preventive_strategy_view_models
from client_output.builders.weekly_insights import build_weekly_insight_view_models

__all__ = [
    "build_lens_view_models",
    "build_system_status_view_models",
    "build_root_pattern_view_models",
    "build_cluster_view_models",
    "build_watch_item_view_models",
    "build_lab_awareness_view_models",
    "build_recommendation_view_models",
    "build_preventive_strategy_view_models",
    "build_weekly_insight_view_models",
]

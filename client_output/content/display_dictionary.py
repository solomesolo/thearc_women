"""
Display dictionary: map display keys to human-readable labels for the UI.

Uses strict VM types only; keys are derived from section and title (no engine IDs).
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import DashboardVM
from client_output.dictionary import display_key


def build_display_dictionary(dashboard: DashboardVM) -> dict[str, dict[str, Any]]:
    """
    Build a display_key -> { label, type } dictionary for UI lookups.
    Keys use section prefix + slug(title). No engine IDs.
    """
    result: dict[str, dict[str, Any]] = {}
    for vm in dashboard.lenses:
        result[display_key("lens", vm.title)] = {"label": vm.title, "type": "lens"}
    for vm in dashboard.systems:
        result[display_key("system", vm.title)] = {"label": vm.title, "type": "system"}
    for vm in dashboard.root_patterns:
        result[display_key("pattern", vm.title)] = {"label": vm.title, "type": "root_pattern"}
    for vm in dashboard.clusters:
        result[display_key("cluster", vm.title)] = {"label": vm.title, "type": "cluster"}
    for vm in dashboard.watch_items:
        result[display_key("watch", vm.title)] = {"label": vm.title, "type": "watch_item"}
    for vm in dashboard.lab_awareness:
        result[display_key("lab", vm.title)] = {"label": vm.title, "type": "lab_awareness"}
    for vm in dashboard.recommendations:
        result[display_key("rec", vm.content_tag)] = {"label": vm.title, "type": "recommendation"}
    for vm in dashboard.preventive_strategies:
        result[display_key("strategy", vm.title)] = {"label": vm.title, "type": "preventive_strategy"}
    for vm in dashboard.weekly_insights:
        result[display_key("insight", vm.headline)] = {"label": vm.headline, "type": "weekly_insight"}
    return result

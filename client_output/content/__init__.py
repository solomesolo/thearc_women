"""
Content: assemble display-ready content from view models.

Content modules take view models (and optional context) and produce
structures ready for rendering in the dashboard (e.g. tables, cards, sections).
They do not accept or expose raw engine IDs or raw confidence.
"""

from client_output.content.display_dictionary import build_display_dictionary
from client_output.content.confidence_table import build_confidence_table_content
from client_output.content.lens_content import build_lens_content
from client_output.content.system_status_content import build_system_status_content
from client_output.content.root_pattern_content import build_root_pattern_content
from client_output.content.cluster_content import build_cluster_content
from client_output.content.watch_catalog import build_watch_catalog_content
from client_output.content.lab_awareness_content import build_lab_awareness_content
from client_output.content.recommendation_content import build_recommendation_content
from client_output.content.preventive_strategy_content import build_preventive_strategy_content
from client_output.content.weekly_insight_content import build_weekly_insight_content

__all__ = [
    "build_display_dictionary",
    "build_confidence_table_content",
    "build_lens_content",
    "build_system_status_content",
    "build_root_pattern_content",
    "build_cluster_content",
    "build_watch_catalog_content",
    "build_lab_awareness_content",
    "build_recommendation_content",
    "build_preventive_strategy_content",
    "build_weekly_insight_content",
]

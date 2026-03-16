"""
Weekly insight content: display-ready content for weekly insight sections.

Consumes only WeeklyInsightVM. No internal IDs or raw confidence.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import WeeklyInsightVM


def build_weekly_insight_content(
    insights: list[WeeklyInsightVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from WeeklyInsightVM list; output matches contract shape."""
    return [vm.model_dump() for vm in insights]

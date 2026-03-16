"""
Build WeeklyInsightVM list from raw engine weekly-insight data.

Consumes raw insight entities; outputs only strict WeeklyInsightVM.
No internal IDs or raw confidence exposed.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import WeeklyInsightVM


def build_weekly_insight_view_models(
    raw_items: list[dict[str, Any]],
) -> list[WeeklyInsightVM]:
    """
    Build a list of WeeklyInsightVM from raw engine weekly-insight data.
    All required fields (headline, bullets, interpretation) are populated.
    """
    result: list[WeeklyInsightVM] = []
    for i, raw in enumerate(raw_items):
        headline = raw.get("headline") or raw.get("title") or raw.get("name") or f"Weekly insight {i + 1}"
        bullets = raw.get("bullets") or raw.get("bullet_points") or []
        if isinstance(bullets, list):
            bullets = [str(b) for b in bullets]
        else:
            bullets = []
        interpretation = raw.get("interpretation") or raw.get("summary") or raw.get("description") or ""
        result.append(
            WeeklyInsightVM(
                headline=headline,
                bullets=bullets,
                interpretation=interpretation,
            )
        )
    return result

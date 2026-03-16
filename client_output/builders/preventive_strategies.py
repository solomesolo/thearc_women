"""
Build PreventiveStrategyVM list from raw engine preventive-strategy data.

Consumes raw strategy entities; outputs only strict PreventiveStrategyVM.
No internal IDs exposed.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import PreventiveStrategyVM


def build_preventive_strategy_view_models(
    raw_items: list[dict[str, Any]],
) -> list[PreventiveStrategyVM]:
    """
    Build a list of PreventiveStrategyVM from raw engine data.
    All required fields (title, focus_description, priority_area) are populated.
    """
    result: list[PreventiveStrategyVM] = []
    for i, raw in enumerate(raw_items):
        title = raw.get("title") or raw.get("name") or f"Strategy {i + 1}"
        focus_description = raw.get("focus_description") or raw.get("description") or ""
        priority_area = raw.get("priority_area") or raw.get("focus_area") or ""
        result.append(
            PreventiveStrategyVM(
                title=title,
                focus_description=focus_description,
                priority_area=priority_area,
            )
        )
    return result

"""
Build WatchItemVM list from raw engine watch-item data.

Consumes raw watch items; outputs only strict WatchItemVM. No internal IDs exposed.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import WatchItemVM


def build_watch_item_view_models(
    raw_items: list[dict[str, Any]],
) -> list[WatchItemVM]:
    """
    Build a list of WatchItemVM from raw engine watch-item data.
    All required fields (title, description) are populated.
    """
    result: list[WatchItemVM] = []
    for i, raw in enumerate(raw_items):
        title = raw.get("title") or raw.get("name") or f"Watch item {i + 1}"
        description = raw.get("description") or ""
        result.append(
            WatchItemVM(
                title=title,
                description=description,
            )
        )
    return result

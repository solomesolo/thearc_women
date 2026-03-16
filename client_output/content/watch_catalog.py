"""
Watch catalog content: display-ready content for watch-list sections.

Consumes only WatchItemVM. No internal IDs.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import WatchItemVM


def build_watch_catalog_content(
    watch_items: list[WatchItemVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from WatchItemVM list; output matches contract shape."""
    return [vm.model_dump() for vm in watch_items]

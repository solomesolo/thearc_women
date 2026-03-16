"""
Confidence table content: display-safe confidence summary for the UI.

Produces table rows using only DisplayConfidence (tier, display_text).
No raw confidence values exposed.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import DisplayConfidence


def build_confidence_table_content(
    items: list[tuple[str, DisplayConfidence]],
) -> list[dict[str, Any]]:
    """
    Build table content for a confidence summary.
    Each row has display_key and confidence display_text/tier only; no raw values.
    """
    return [
        {
            "display_key": display_key,
            "confidence_tier": conf.tier.label,
            "confidence_display": conf.display_text,
        }
        for display_key, conf in items
    ]

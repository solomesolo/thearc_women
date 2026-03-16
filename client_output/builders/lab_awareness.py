"""
Build LabAwarenessCardVM list from raw engine lab-awareness data.

Consumes raw lab-awareness entities; outputs only strict LabAwarenessCardVM.
Uses display resolver when lab_id is present; no internal IDs exposed.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import LabAwarenessCardVM
from client_output.display_resolver import resolve_lab


def build_lab_awareness_view_models(
    raw_items: list[dict[str, Any]],
) -> list[LabAwarenessCardVM]:
    """
    Build a list of LabAwarenessCardVM from raw engine lab-awareness data.
    When raw has lab_id, uses display dictionary for title/short_label.
    """
    result: list[LabAwarenessCardVM] = []
    for i, raw in enumerate(raw_items):
        if "lab_id" in raw:
            resolved = resolve_lab(str(raw["lab_id"]))
            title = resolved["display_title"]
            short_label = resolved["short_label"]
        else:
            title = raw.get("title") or raw.get("name") or f"Lab awareness {i + 1}"
            short_label = raw.get("short_label") or title
        description = raw.get("description") or raw.get("summary") or ""
        result.append(
            LabAwarenessCardVM(
                title=title,
                short_label=short_label,
                description=description,
            )
        )
    return result

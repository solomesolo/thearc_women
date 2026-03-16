"""
Build LensCardVM list from raw engine lens data.

Consumes raw lens entities; outputs only strict LensCardVM.
Uses display resolver when lens_id is present; no lens_id exposed.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import LensCardVM
from client_output.display_resolver import resolve_lens


def build_lens_view_models(raw_lenses: list[dict[str, Any]]) -> list[LensCardVM]:
    """
    Build a list of LensCardVM from raw engine lens data.
    When raw has lens_id, uses display dictionary for title/headline.
    """
    result: list[LensCardVM] = []
    for i, raw in enumerate(raw_lenses):
        if "lens_id" in raw:
            resolved = resolve_lens(str(raw["lens_id"]))
            title = resolved["display_title"]
            headline = resolved.get("short_label") or title
        else:
            title = raw.get("title") or raw.get("label") or raw.get("name") or f"Lens {i + 1}"
            headline = raw.get("headline") or title
        description = raw.get("description") or ""
        focus_area = raw.get("focus_area")
        if focus_area is not None:
            focus_area = str(focus_area)
        result.append(
            LensCardVM(
                title=title,
                headline=headline,
                description=description,
                focus_area=focus_area,
            )
        )
    return result

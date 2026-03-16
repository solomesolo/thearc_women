"""
Build RootPatternCardVM list from raw engine root-pattern data.

When raw has pattern_id, uses root pattern explanation library (build_root_pattern_card).
Otherwise builds from raw fields for backward compatibility.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import RootPatternCardVM
from client_output.confidence import map_confidence_optional
from client_output.display_resolver import resolve_pattern
from client_output.root_pattern_card import build_root_pattern_card


def build_root_pattern_view_models(
    raw_patterns: list[dict[str, Any]],
) -> list[RootPatternCardVM]:
    """
    Build a list of RootPatternCardVM from raw engine root-pattern data.
    When raw has pattern_id, uses explanation library (build_root_pattern_card).
    """
    result: list[RootPatternCardVM] = []
    for i, raw in enumerate(raw_patterns):
        if raw.get("pattern_id"):
            result.append(build_root_pattern_card(raw))
        else:
            title = raw.get("title") or raw.get("name") or f"Pattern {i + 1}"
            short_label = raw.get("short_label") or title
            summary = raw.get("summary") or raw.get("description") or ""
            expanded_explanation = raw.get("expanded_explanation") or raw.get("explanation") or summary
            band = map_confidence_optional(raw.get("confidence"))
            evidence_label = raw.get("evidence_label") or "Evidence"
            caution_note = raw.get("caution_note") or ""
            result.append(
                RootPatternCardVM(
                    title=title,
                    short_label=short_label,
                    summary=summary,
                    expanded_explanation=expanded_explanation,
                    confidence_label=band.confidence_label,
                    confidence_text=band.confidence_text,
                    evidence_label=evidence_label,
                    caution_note=caution_note,
                )
            )
    return result

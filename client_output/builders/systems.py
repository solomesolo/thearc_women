"""
Build SystemTileVM list from raw engine system data.

Consumes raw system entities; outputs only strict SystemTileVM.
Uses display resolver when system_id is present; no system_id exposed.
status_label is normalized to Literal["Stable", "Variable", "Needs attention"].
"""

from __future__ import annotations

from typing import Any, Literal

from client_output.contracts import SystemTileVM
from client_output.display_resolver import resolve_system

StatusLabel = Literal["Stable", "Variable", "Needs attention"]

_STATUS_VALUES: frozenset[str] = frozenset({"Stable", "Variable", "Needs attention"})


def _normalize_status(raw: str | None) -> StatusLabel:
    if not raw:
        return "Variable"
    normalized = raw.strip()
    if normalized in _STATUS_VALUES:
        return normalized  # type: ignore[return-value]
    lower = normalized.lower()
    if "stable" in lower or lower == "ok":
        return "Stable"
    if "attention" in lower or "need" in lower or "alert" in lower:
        return "Needs attention"
    return "Variable"


def build_system_status_view_models(
    raw_systems: list[dict[str, Any]],
) -> list[SystemTileVM]:
    """
    Build a list of SystemTileVM from raw engine system data.
    When raw has system_id, uses display dictionary for title/short_label.
    """
    result: list[SystemTileVM] = []
    for i, raw in enumerate(raw_systems):
        if "system_id" in raw:
            resolved = resolve_system(str(raw["system_id"]))
            name = resolved["display_title"]
            short_label = resolved["short_label"]
        else:
            name = raw.get("name") or raw.get("title") or f"System {i + 1}"
            short_label = raw.get("short_label") or name
        status_label = _normalize_status(
            raw.get("status_label") or raw.get("status")
        )
        summary = raw.get("summary") or ""
        result.append(
            SystemTileVM(
                title=name,
                short_label=short_label,
                status_label=status_label,
                summary=summary,
            )
        )
    return result

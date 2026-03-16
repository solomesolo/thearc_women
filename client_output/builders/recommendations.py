"""
Build RecommendationVM list from raw engine recommendation data.

Consumes raw recommendation entities; outputs only strict RecommendationVM.
priority is normalized to Literal["high", "medium", "low"]. No internal IDs exposed.
"""

from __future__ import annotations

from typing import Any, Literal

from client_output.contracts import RecommendationVM

PriorityLabel = Literal["high", "medium", "low"]

_PRIORITY_VALUES: frozenset[str] = frozenset({"high", "medium", "low"})


def _normalize_priority(raw: str | None) -> PriorityLabel:
    if not raw:
        return "medium"
    normalized = raw.strip().lower()
    if normalized in _PRIORITY_VALUES:
        return normalized  # type: ignore[return-value]
    if "high" in normalized or "urgent" in normalized:
        return "high"
    if "low" in normalized:
        return "low"
    return "medium"


def build_recommendation_view_models(
    raw_items: list[dict[str, Any]],
) -> list[RecommendationVM]:
    """
    Build a list of RecommendationVM from raw engine recommendation data.
    All required fields (content_tag, title, reason, priority) are populated.
    """
    result: list[RecommendationVM] = []
    for i, raw in enumerate(raw_items):
        title = raw.get("title") or raw.get("name") or f"Recommendation {i + 1}"
        content_tag = raw.get("content_tag") or f"rec-{i + 1}"
        reason = raw.get("reason") or raw.get("body") or raw.get("description") or ""
        priority = _normalize_priority(
            raw.get("priority") or raw.get("priority_label")
        )
        result.append(
            RecommendationVM(
                content_tag=content_tag,
                title=title,
                reason=reason,
                priority=priority,
            )
        )
    return result

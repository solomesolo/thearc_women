"""
Recommendation content: display-ready content for recommendation sections.

Consumes only RecommendationVM. No internal IDs.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import RecommendationVM


def build_recommendation_content(
    recommendations: list[RecommendationVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from RecommendationVM list; output matches contract shape."""
    return [vm.model_dump() for vm in recommendations]

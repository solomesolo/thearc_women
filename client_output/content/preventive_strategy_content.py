"""
Preventive strategy content: display-ready content for strategy sections.

Consumes only PreventiveStrategyVM. No internal IDs.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import PreventiveStrategyVM


def build_preventive_strategy_content(
    strategies: list[PreventiveStrategyVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from PreventiveStrategyVM list; output matches contract shape."""
    return [vm.model_dump() for vm in strategies]

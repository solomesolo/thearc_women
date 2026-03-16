"""
Root pattern content: display-ready content for root pattern sections.

Consumes only RootPatternCardVM. No pattern_id or raw confidence.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import RootPatternCardVM


def build_root_pattern_content(
    patterns: list[RootPatternCardVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from RootPatternCardVM list; output matches contract shape."""
    return [vm.model_dump() for vm in patterns]

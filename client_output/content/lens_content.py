"""
Lens content: display-ready content for lens sections in the dashboard.

Consumes only LensCardVM; produces structures for UI rendering. No lens_id.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import LensCardVM


def build_lens_content(lenses: list[LensCardVM]) -> list[dict[str, Any]]:
    """Build display-ready content from LensCardVM list; output matches contract shape."""
    return [vm.model_dump() for vm in lenses]

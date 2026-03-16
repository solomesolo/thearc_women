"""
Lab awareness content: display-ready content for lab-awareness sections.

Consumes only LabAwarenessCardVM. No internal IDs.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import LabAwarenessCardVM


def build_lab_awareness_content(
    items: list[LabAwarenessCardVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from LabAwarenessCardVM list; output matches contract shape."""
    return [vm.model_dump() for vm in items]

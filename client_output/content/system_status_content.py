"""
System status content: display-ready content for system status sections.

Consumes only SystemTileVM. No system_id.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import SystemTileVM


def build_system_status_content(
    systems: list[SystemTileVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from SystemTileVM list; output matches contract shape."""
    return [vm.model_dump() for vm in systems]

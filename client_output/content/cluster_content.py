"""
Cluster content: display-ready content for cluster sections.

Consumes only ClusterCardVM. No cluster_id or raw confidence.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import ClusterCardVM


def build_cluster_content(
    clusters: list[ClusterCardVM],
) -> list[dict[str, Any]]:
    """Build display-ready content from ClusterCardVM list; output matches contract shape."""
    return [vm.model_dump() for vm in clusters]

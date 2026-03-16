"""
Build ClusterCardVM list from raw engine cluster data.

When raw has cluster_id, uses cluster explanation table (build_cluster_card).
Otherwise builds from raw fields for backward compatibility.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import ClusterCardVM
from client_output.confidence import map_confidence_optional
from client_output.display_resolver import resolve_cluster
from client_output.cluster_card import build_cluster_card


def build_cluster_view_models(
    raw_clusters: list[dict[str, Any]],
) -> list[ClusterCardVM]:
    """
    Build a list of ClusterCardVM from raw engine cluster data.
    When raw has cluster_id, uses explanation table (build_cluster_card).
    """
    result: list[ClusterCardVM] = []
    for i, raw in enumerate(raw_clusters):
        if raw.get("cluster_id"):
            result.append(build_cluster_card(raw))
        else:
            title = raw.get("title") or raw.get("name") or f"Cluster {i + 1}"
            summary = raw.get("summary") or ""
            typical_signals = raw.get("typical_signals") or raw.get("signals") or []
            if isinstance(typical_signals, list):
                typical_signals = [str(s).strip() for s in typical_signals if str(s).strip()]
            else:
                typical_signals = []
            band = map_confidence_optional(raw.get("confidence"))
            result.append(
                ClusterCardVM(
                    title=title,
                    summary=summary,
                    typical_signals=typical_signals,
                    confidence_label=band.confidence_label,
                    confidence_text=band.confidence_text,
                )
            )
    return result

"""
Cluster card translator: cluster -> readable card (ClusterCardVM).

Uses approved cluster explanation table only. Title from display dictionary;
summary from explanation (<= 120 chars); typical_signals as trimmed tag list.
Confidence from bands. No cluster_id in output.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import ClusterCardVM
from client_output.confidence import map_confidence_optional
from client_output.display_resolver import resolve_cluster


SUMMARY_MAX_LEN = 120

# ---------------------------------------------------------------------------
# Cluster explanation table (explanation, typical_signals)
# Title comes from display dictionary (resolve_cluster).
# ---------------------------------------------------------------------------

CLUSTER_EXPLANATIONS: dict[str, dict[str, Any]] = {
    "CL_ENERGY_VAR": {
        "explanation": "Signals suggesting energy and mental stamina may fluctuate across the day.",
        "typical_signals": ["fatigue", "morning exhaustion", "afternoon crash", "brain fog"],
    },
    "CL_STRESS_ACCUM": {
        "explanation": "Signals suggesting ongoing stress activation and reduced recovery capacity.",
        "typical_signals": [],
    },
    "CL_SLEEP_DISRUPT": {
        "explanation": "Signals suggesting sleep may be lighter, shorter, or less restorative.",
        "typical_signals": [],
    },
    "CL_CYCLE_VAR": {
        "explanation": "Signals suggesting menstrual timing or bleeding patterns may be less consistent.",
        "typical_signals": [],
    },
    "CL_SUGAR_INSTAB": {
        "explanation": "Signals suggesting energy and hunger may shift noticeably around meals.",
        "typical_signals": [],
    },
    "CL_IRON_PATTERN": {
        "explanation": "Signals sometimes seen when iron reserve support may need closer attention.",
        "typical_signals": [],
    },
    "CL_THYROID_SIGNALS": {
        "explanation": "Signals sometimes seen when metabolic pace or thyroid-related regulation shifts.",
        "typical_signals": [],
    },
    "CL_TRAIN_MISMATCH": {
        "explanation": "Signals suggesting physical load may be exceeding current recovery capacity.",
        "typical_signals": [],
    },
    "CL_GUT_PATTERN": {
        "explanation": "Signals suggesting digestion comfort or bowel patterns may be less steady.",
        "typical_signals": [],
    },
    "CL_INFLAM_LOAD": {
        "explanation": "Signals suggesting multi-system overlap that may reflect broader inflammatory context.",
        "typical_signals": [],
    },
}


class ClusterConfigError(LookupError):
    """Raised when a cluster_id has no entry in the explanation table."""

    def __init__(self, cluster_id: str) -> None:
        self.cluster_id = cluster_id
        super().__init__(f"Cluster card: no explanation for cluster {cluster_id!r}")


def _normalize_typical_signals(signals: Any) -> list[str]:
    """Return trimmed, non-empty list of strings. Split strings by comma if needed."""
    if not signals:
        return []
    out: list[str] = []
    if isinstance(signals, list):
        for s in signals:
            if isinstance(s, str):
                for part in s.split(","):
                    tag = part.strip()
                    if tag:
                        out.append(tag)
            else:
                tag = str(s).strip()
                if tag:
                    out.append(tag)
    elif isinstance(signals, str):
        for part in signals.split(","):
            tag = part.strip()
            if tag:
                out.append(tag)
    return out


def build_cluster_card(cluster: dict[str, Any]) -> ClusterCardVM:
    """
    Build a ClusterCardVM from raw cluster data.

    - title from display dictionary (resolve_cluster).
    - summary from explanation table (<= 120 chars); calm, educational tone.
    - typical_signals from table, normalized (trimmed, no empty tags).
    - confidence_label and confidence_text from confidence bands.
    - No cluster_id in output.
    """
    cluster_id = cluster.get("cluster_id") or cluster.get("id")
    if not cluster_id:
        raise ClusterConfigError("<missing>")
    cluster_id = str(cluster_id).strip()

    if cluster_id not in CLUSTER_EXPLANATIONS:
        raise ClusterConfigError(cluster_id)

    resolved = resolve_cluster(cluster_id)
    title = resolved["display_title"]

    entry = CLUSTER_EXPLANATIONS[cluster_id]
    explanation = entry["explanation"]
    if len(explanation) > SUMMARY_MAX_LEN:
        raise ValueError(
            f"Cluster card: explanation for {cluster_id} exceeds {SUMMARY_MAX_LEN} chars (got {len(explanation)})"
        )

    raw_signals = entry.get("typical_signals") or []
    typical_signals = _normalize_typical_signals(raw_signals)

    band = map_confidence_optional(cluster.get("confidence"))

    return ClusterCardVM(
        title=title,
        summary=explanation,
        typical_signals=typical_signals,
        confidence_label=band.confidence_label,
        confidence_text=band.confidence_text,
    )

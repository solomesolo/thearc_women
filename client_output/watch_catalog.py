"""
What to Watch: deterministic watch items tied to qualifying clusters.

Catalog is cluster-backed; selection by cluster strength, confidence, and
temporal persistence. Max 3 items; up to 2 per cluster. Educational,
monitoring-oriented language only.
"""

from __future__ import annotations

from typing import Any, Dict, List

from client_output.contracts import WatchItemVM
from client_output.language_safety import validate_text

# ---------------------------------------------------------------------------
# Default thresholds when not provided by engine config (0 = no filtering)
# ---------------------------------------------------------------------------

DEFAULT_STRENGTH_THRESHOLD = 0.0
DEFAULT_CONFIDENCE_THRESHOLD = 0.0

# ---------------------------------------------------------------------------
# Watch item catalog: cluster_id -> list of { title, description }
# Educational, calm, monitoring-oriented; helps users observe patterns over time.
# ---------------------------------------------------------------------------

WATCH_ITEM_CATALOG: Dict[str, List[Dict[str, str]]] = {
    "CL_SLEEP_DISRUPT": [
        {"title": "Sleep quality", "description": "Track how often sleep feels restorative; patterns may help you notice what supports better rest."},
        {"title": "Sleep timing", "description": "Notice when you fall asleep and wake; consistency can sometimes support sleep architecture."},
    ],
    "CL_ENERGY_VAR": [
        {"title": "Daily energy patterns", "description": "Observe when energy peaks and dips across the day; patterns may relate to meals, sleep, or stress."},
        {"title": "Afternoon energy dips", "description": "Track afternoon energy changes; timing can sometimes align with meal timing or sleep."},
    ],
    "CL_STRESS_ACCUM": [
        {"title": "Stress load signals", "description": "Notice periods of high demand or limited recovery; tracking may help you spot patterns over time."},
    ],
    "CL_TRAIN_MISMATCH": [
        {"title": "Recovery balance", "description": "Compare training load with how recovered you feel; balance may shift with rest and life stress."},
        {"title": "Post-exercise fatigue", "description": "Track how you feel after activity; recovery patterns can sometimes inform pacing."},
    ],
    "CL_SUGAR_INSTAB": [
        {"title": "Meal timing patterns", "description": "Observe how energy and hunger shift around meals; timing may relate to blood sugar variability."},
        {"title": "Cravings patterns", "description": "Notice when cravings appear; patterns can sometimes align with meal timing or energy dips."},
    ],
    "CL_CYCLE_VAR": [
        {"title": "Cycle timing", "description": "Track cycle length and regularity; patterns may help you notice what supports consistency."},
        {"title": "Cycle flow patterns", "description": "Observe flow and symptom patterns across the cycle; tracking can support context over time."},
    ],
    "CL_GUT_PATTERN": [
        {"title": "Digestion comfort", "description": "Notice how digestion feels after meals; patterns may relate to meal timing or food choices."},
        {"title": "Bowel pattern changes", "description": "Track bowel habits gently; patterns can sometimes reflect gut balance over time."},
    ],
    "CL_IRON_PATTERN": [
        {"title": "Hair and skin changes", "description": "Notice hair or skin changes over time; patterns may sometimes relate to nutrient reserves."},
        {"title": "Physical stamina", "description": "Observe stamina with activity; trends can sometimes align with iron reserve context."},
    ],
    "CL_THYROID_SIGNALS": [
        {"title": "Temperature sensitivity", "description": "Track how often you feel cold or need extra layers; patterns may relate to metabolic context."},
    ],
    "CL_INFLAM_LOAD": [
        {"title": "Multiple system signals", "description": "Notice when fatigue or discomfort spans several areas; patterns may reflect broader context."},
    ],
}

MAX_ITEMS_GLOBAL = 3
MAX_ITEMS_PER_CLUSTER = 2


def _get_cluster_value(c: Any, key: str) -> float:
    """Extract numeric value from cluster dict or object."""
    if hasattr(c, key):
        v = getattr(c, key, None)
    else:
        v = c.get(key) if isinstance(c, dict) else None
    try:
        return float(v) if v is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def _get_persistence(temporal_state: Any, cluster_id: str) -> float:
    """Extract temporal persistence for a cluster (0 if absent)."""
    if not temporal_state or not isinstance(temporal_state, dict):
        return 0.0
    p = temporal_state.get(cluster_id) or temporal_state.get("persistence") or temporal_state.get("temporal_persistence")
    if isinstance(p, dict) and cluster_id in p:
        p = p[cluster_id]
    try:
        return float(p) if p is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def build_watch_items(
    clusters: List[Any],
    temporal_state: Any = None,
    *,
    strength_threshold: float = DEFAULT_STRENGTH_THRESHOLD,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> List[WatchItemVM]:
    """
    Build up to 3 watch items from qualifying clusters.

    - Only clusters with strength >= strength_threshold and confidence >= confidence_threshold qualify.
    - From each qualifying cluster, up to 2 items from the catalog.
    - Rank by (cluster strength, cluster confidence, temporal persistence) descending.
    - Return at most 3 items. Descriptions pass language safety (dashboard context).
    """
    # Normalize clusters to list of dict-like with cluster_id, strength, confidence
    cluster_list: List[Dict[str, Any]] = []
    for c in clusters or []:
        if isinstance(c, dict):
            cid = c.get("cluster_id") or c.get("id")
        else:
            cid = getattr(c, "cluster_id", None) or getattr(c, "id", None)
        if not cid:
            continue
        cid = str(cid).strip()
        if cid not in WATCH_ITEM_CATALOG:
            continue
        strength = _get_cluster_value(c, "strength")
        confidence = _get_cluster_value(c, "confidence")
        if strength < strength_threshold or confidence < confidence_threshold:
            continue
        cluster_list.append({
            "cluster_id": cid,
            "strength": strength,
            "confidence": confidence,
            "persistence": _get_persistence(temporal_state, cid),
        })

    # Build candidate items: (title, description, strength, confidence, persistence, cluster_id)
    candidates: List[tuple[str, str, float, float, float, str]] = []
    for cl in cluster_list:
        cid = cl["cluster_id"]
        items = WATCH_ITEM_CATALOG.get(cid) or []
        for entry in items[:MAX_ITEMS_PER_CLUSTER]:
            title = entry.get("title") or ""
            description = entry.get("description") or ""
            if not title:
                continue
            candidates.append((
                title,
                description,
                cl["strength"],
                cl["confidence"],
                cl["persistence"],
                cid,
            ))

    # Rank by strength desc, confidence desc, persistence desc
    candidates.sort(key=lambda x: (x[2], x[3], x[4]), reverse=True)

    # Take up to 3, at most 2 per cluster
    result: List[WatchItemVM] = []
    per_cluster_count: Dict[str, int] = {}
    for title, description, _s, _c, _p, cid in candidates:
        if len(result) >= MAX_ITEMS_GLOBAL:
            break
        if per_cluster_count.get(cid, 0) >= MAX_ITEMS_PER_CLUSTER:
            continue
        validate_text(description, "dashboard")
        result.append(WatchItemVM(title=title, description=description))
        per_cluster_count[cid] = per_cluster_count.get(cid, 0) + 1

    return result

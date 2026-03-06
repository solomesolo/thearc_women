"""
Apply temporal logic and persistence to clusters.
Simple, deterministic; no forecasting. Adjusts strength by persistence category.
"""

from dataclasses import replace
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from engine.types import ClusterResult

PERSISTENCE_MULTIPLIERS = {
    "transient": 0.70,
    "emerging": 0.90,
    "persistent": 1.10,
}

TIME_WINDOW_LOOKBACK_DAYS = {
    "today": 7,
    "7d": 14,
    "30d": 45,
}

MIN_HISTORY_POINTS = {
    "today": 2,
    "7d": 2,
    "30d": 3,
}


def clamp_0_100(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def parse_timestamp_safe(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    s = str(ts).strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        pass
    if len(s) >= 10:
        try:
            dt = datetime.strptime(s[:10], "%Y-%m-%d")
            return dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            pass
    return None


def days_between(reference_ts: Optional[str], prior_ts: Optional[str]) -> Optional[float]:
    """Positive = prior is in the past relative to reference."""
    ref = parse_timestamp_safe(reference_ts) if reference_ts else datetime.now(timezone.utc)
    prior = parse_timestamp_safe(prior_ts)
    if ref is None or prior is None:
        return None
    delta = ref - prior
    return delta.total_seconds() / 86400.0


def recency_weight_from_days(days_old: Optional[float]) -> float:
    """Tiered recency decay: recent data counts more."""
    if days_old is None:
        return 0.25
    if days_old <= 7:
        return 1.00
    if days_old <= 14:
        return 0.85
    if days_old <= 30:
        return 0.60
    return 0.35


def recency_weighted_mean(points: List[Tuple[float, float]]) -> float:
    """points = [(value, weight), ...]. Returns sum(v*w)/sum(w) or 0.0 if empty."""
    if not points:
        return 0.0
    total_w = sum(w for _, w in points)
    if total_w <= 0:
        return 0.0
    return sum(v * w for v, w in points) / total_w


def get_cluster_history_points(
    history: Any,
    cluster_id: str,
    reference_timestamp: Optional[str],
    lookback_days: float,
) -> List[Tuple[float, float]]:
    """Return list of (strength, recency_weight) for this cluster within lookback."""
    out: List[Tuple[float, float]] = []
    if not history or not isinstance(history, dict):
        return out
    snapshots = history.get("cluster_snapshots") or []
    ref = reference_timestamp
    for snap in snapshots:
        if not isinstance(snap, dict):
            continue
        ts = snap.get("timestamp")
        if ts is None:
            continue
        d = days_between(ref, ts)
        if d is None or d < 0 or d > lookback_days:
            continue
        clusters = snap.get("clusters") or []
        strength = None
        for c in clusters:
            if isinstance(c, dict) and c.get("cluster_id") == cluster_id:
                strength = c.get("strength")
                break
            if getattr(c, "cluster_id", None) == cluster_id:
                strength = getattr(c, "strength", None)
                break
        if strength is None:
            continue
        try:
            strength_f = float(strength)
        except (TypeError, ValueError):
            continue
        w = recency_weight_from_days(d)
        out.append((strength_f, w))
    return out


def summarize_cluster_history(
    history: Any,
    cluster_id: str,
    reference_timestamp: Optional[str],
    lookback_days: float,
) -> Dict[str, Any]:
    """Return metadata dict: strengths, weights, weighted_mean, history_points_used, max_strength, min_strength."""
    points = get_cluster_history_points(history, cluster_id, reference_timestamp, lookback_days)
    if not points:
        return {
            "strengths": [],
            "weights": [],
            "weighted_mean": 0.0,
            "history_points_used": 0,
            "max_strength": 0.0,
            "min_strength": 0.0,
        }
    strengths = [s for s, _ in points]
    weights = [w for _, w in points]
    return {
        "strengths": strengths,
        "weights": weights,
        "weighted_mean": round(recency_weighted_mean(points), 1),
        "history_points_used": len(points),
        "max_strength": max(strengths),
        "min_strength": min(strengths),
    }


def classify_persistence(
    current_strength: float,
    prior_points: List[Tuple[float, float]],
    min_points: int,
) -> Tuple[str, float, int, bool]:
    """
    prior_points = [(strength, recency_weight), ...].
    Returns (persistence_label, recency_weighted_mean, history_points_used, minimum_data_met).
    """
    n = len(prior_points)
    min_met = n >= min_points
    recency_mean = recency_weighted_mean(prior_points)
    prior_strengths = [s for s, _ in prior_points]

    if min_met and sum(1 for s in prior_strengths if s >= 40) >= 2 and recency_mean >= 45:
        return ("persistent", recency_mean, n, min_met)
    if current_strength >= 40 and sum(1 for s in prior_strengths if s >= 35) >= 1:
        return ("emerging", recency_mean, n, min_met)
    if not min_met:
        return ("transient", recency_mean, n, False)
    return ("transient", recency_mean, n, min_met)


def apply_temporal_logic(
    clusters: List[ClusterResult],
    history: Any,
    registry: Any,
    config: Any,
    time_window: str = "7d",
    reference_timestamp: Optional[str] = None,
) -> Tuple[List[ClusterResult], Dict[str, Any]]:
    """Return (updated clusters with adjusted strength, temporal_meta)."""
    lookback_days = float(TIME_WINDOW_LOOKBACK_DAYS.get(time_window, 14))
    min_points = MIN_HISTORY_POINTS.get(time_window, 2)

    temporal_meta: Dict[str, Any] = {
        "time_window": time_window,
        "cluster_temporal": {},
    }

    updated: List[ClusterResult] = []
    for c in clusters:
        current_strength = float(c.strength)

        # Rule A: zero stays zero
        if current_strength == 0:
            temporal_meta["cluster_temporal"][c.cluster_id] = {
                "persistence_label": "transient",
                "persistence_multiplier": PERSISTENCE_MULTIPLIERS["transient"],
                "history_points_used": 0,
                "recency_weighted_mean": 0.0,
                "current_vs_history_delta": 0.0,
                "minimum_data_met": False,
            }
            updated.append(c)
            continue

        prior_points = get_cluster_history_points(
            history, c.cluster_id, reference_timestamp, lookback_days
        )
        label, recency_mean, n_used, min_met = classify_persistence(
            current_strength, prior_points, min_points
        )
        mult = PERSISTENCE_MULTIPLIERS[label]
        adjusted = current_strength * mult
        adjusted = clamp_0_100(adjusted)

        # Rule B: low current strength cap at 30
        if current_strength < 25:
            adjusted = min(adjusted, 30.0)

        # Rule C: CL_INFLAM_LOAD cap at 80
        if c.cluster_id == "CL_INFLAM_LOAD":
            adjusted = min(adjusted, 80.0)

        delta = current_strength - recency_mean if prior_points else 0.0
        trend = "rising" if delta >= 10 else ("falling" if delta <= -10 else "stable")
        temporal_meta["cluster_temporal"][c.cluster_id] = {
            "persistence_label": label,
            "persistence_multiplier": mult,
            "history_points_used": n_used,
            "recency_weighted_mean": round(recency_mean, 1),
            "current_vs_history_delta": round(delta, 1),
            "minimum_data_met": min_met,
            "trend": trend,
        }
        updated.append(replace(c, strength=adjusted))

    return updated, temporal_meta

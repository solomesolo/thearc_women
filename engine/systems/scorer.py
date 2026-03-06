"""
Compute system scores and status from confidence-adjusted clusters.
Deterministic; no graph propagation or probabilistic inference.
"""

from typing import Any, Dict, List, Optional, Tuple

from engine.types import ClusterResult, SystemResult

SYSTEM_CLUSTER_WEIGHTS: Dict[str, List[Tuple[str, float]]] = {
    "SYS_HORMONAL": [
        ("CL_CYCLE_VAR", 0.60),
        ("CL_THYROID_SIGNALS", 0.20),
        ("CL_STRESS_ACCUM", 0.10),
        ("CL_SLEEP_DISRUPT", 0.10),
    ],
    "SYS_METABOLIC": [
        ("CL_ENERGY_VAR", 0.35),
        ("CL_SUGAR_INSTAB", 0.45),
        ("CL_SLEEP_DISRUPT", 0.10),
        ("CL_STRESS_ACCUM", 0.10),
    ],
    "SYS_STRESS": [
        ("CL_STRESS_ACCUM", 0.60),
        ("CL_SLEEP_DISRUPT", 0.20),
        ("CL_ENERGY_VAR", 0.10),
        ("CL_INFLAM_LOAD", 0.10),
    ],
    "SYS_SLEEP": [
        ("CL_SLEEP_DISRUPT", 0.65),
        ("CL_STRESS_ACCUM", 0.15),
        ("CL_ENERGY_VAR", 0.10),
        ("CL_TRAIN_MISMATCH", 0.10),
    ],
    "SYS_GUT": [
        ("CL_GUT_PATTERN", 0.75),
        ("CL_INFLAM_LOAD", 0.15),
        ("CL_IRON_PATTERN", 0.10),
    ],
    "SYS_MICRO": [
        ("CL_IRON_PATTERN", 0.55),
        ("CL_ENERGY_VAR", 0.15),
        ("CL_GUT_PATTERN", 0.10),
        ("CL_THYROID_SIGNALS", 0.10),
        ("CL_TRAIN_MISMATCH", 0.10),
    ],
    "SYS_CARDIO": [
        ("CL_SUGAR_INSTAB", 0.35),
        ("CL_STRESS_ACCUM", 0.25),
        ("CL_INFLAM_LOAD", 0.20),
        ("CL_TRAIN_MISMATCH", 0.20),
    ],
    "SYS_BONE": [
        ("CL_IRON_PATTERN", 0.20),
        ("CL_GUT_PATTERN", 0.20),
        ("CL_INFLAM_LOAD", 0.20),
        ("CL_THYROID_SIGNALS", 0.20),
        ("CL_CYCLE_VAR", 0.20),
    ],
    "SYS_RECOVERY": [
        ("CL_SLEEP_DISRUPT", 0.35),
        ("CL_STRESS_ACCUM", 0.30),
        ("CL_TRAIN_MISMATCH", 0.25),
        ("CL_ENERGY_VAR", 0.10),
    ],
    "SYS_INFLAM_CTX": [
        ("CL_INFLAM_LOAD", 0.70),
        ("CL_GUT_PATTERN", 0.15),
        ("CL_SLEEP_DISRUPT", 0.15),
    ],
    "SYS_NUTRITION": [
        ("CL_GUT_PATTERN", 0.35),
        ("CL_IRON_PATTERN", 0.30),
        ("CL_SUGAR_INSTAB", 0.20),
        ("CL_ENERGY_VAR", 0.15),
    ],
}

SYS_BONE_CAP = 65.0
SYS_INFLAM_CTX_CAP = 80.0
TOP_DRIVERS_LIMIT = 4  # top 2-4 drivers with contribution > 0
FLIP_THRESHOLD = 15


def clamp_0_100(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def adjusted_cluster_strength(cluster: Any) -> float:
    """Confidence-adjusted cluster contribution."""
    strength = float(getattr(cluster, "strength", 0) or 0)
    confidence = float(getattr(cluster, "confidence", 0) or 0)
    return strength * (0.6 + 0.4 * (confidence / 100.0))


def system_status_from_score(score: float) -> str:
    if score < 30:
        return "stable"
    if score < 60:
        return "variable"
    return "needs_attention"


def cluster_lookup(clusters: List[ClusterResult]) -> Dict[str, Any]:
    return {getattr(c, "cluster_id", ""): c for c in (clusters or []) if getattr(c, "cluster_id", None)}


def compute_system_top_drivers(
    system_id: str,
    clusters: Any,
    cluster_weights: List[Tuple[str, float]],
) -> List[str]:
    """Return top 2-4 cluster IDs by weighted adjusted contribution (contribution > 0)."""
    cluster_map = cluster_lookup(list(clusters) if clusters else [])
    contributions: List[Tuple[str, float]] = []
    for cid, weight in cluster_weights:
        cluster = cluster_map.get(cid)
        adj = adjusted_cluster_strength(cluster) if cluster else 0.0
        term = adj * weight
        if term > 0:
            contributions.append((cid, term))
    contributions.sort(key=lambda x: x[1], reverse=True)
    return [cid for cid, _ in contributions[:TOP_DRIVERS_LIMIT]]


def compute_system_confidence(
    system_id: str,
    clusters: Any,
    cluster_weights: List[Tuple[str, float]],
    default_confidence: float = 70.0,
) -> float:
    """Weighted average of contributing cluster confidences; default if none."""
    cluster_map = cluster_lookup(list(clusters) if clusters else [])
    total_weight = 0.0
    weighted_conf = 0.0
    for cid, weight in cluster_weights:
        cluster = cluster_map.get(cid)
        if cluster is None:
            continue
        adj = adjusted_cluster_strength(cluster)
        if adj <= 0:
            continue
        conf = float(getattr(cluster, "confidence", 0) or 0)
        total_weight += weight
        weighted_conf += conf * weight
    if total_weight <= 0:
        return default_confidence
    return weighted_conf / total_weight


def get_previous_system_state(history: Any, system_id: str) -> Optional[Dict[str, Any]]:
    """Return {score, status} from most recent system_snapshot containing this system, or None."""
    if not history or not isinstance(history, dict):
        return None
    snapshots = history.get("system_snapshots") or []
    for snap in reversed(snapshots):
        if not isinstance(snap, dict):
            continue
        systems = snap.get("systems") or []
        for s in systems:
            sid = s.get("system_id") if isinstance(s, dict) else getattr(s, "system_id", None)
            if sid == system_id:
                score = s.get("score") if isinstance(s, dict) else getattr(s, "score", None)
                status = s.get("status") if isinstance(s, dict) else getattr(s, "status", None)
                return {"score": float(score) if score is not None else 0.0, "status": status or "stable"}
    return None


def compute_weighted_system_score(
    cluster_map: Dict[str, Any],
    cluster_weights: List[Tuple[str, float]],
) -> Tuple[float, List[str]]:
    """Return (score before clamp, top_drivers sorted by contribution desc)."""
    total = 0.0
    contributions: List[Tuple[str, float]] = []
    for cid, weight in cluster_weights:
        cluster = cluster_map.get(cid)
        adj = adjusted_cluster_strength(cluster) if cluster else 0.0
        term = adj * weight
        total += term
        if term > 0:
            contributions.append((cid, term))
    contributions.sort(key=lambda x: x[1], reverse=True)
    top = [cid for cid, _ in contributions[:TOP_DRIVERS_LIMIT]]
    return total, top


def compute_biomarkers_context_score(normalized_labs: Any) -> float:
    """Lab count only: 0→10, 1-2→35, 3-4→55, 5+→75."""
    n = len(normalized_labs) if normalized_labs else 0
    if n == 0:
        return 10.0
    if n <= 2:
        return 35.0
    if n <= 4:
        return 55.0
    return 75.0


def compute_systems(
    clusters: Any,
    registry: Any,
    config: Any,
    normalized_survey: Any = None,
    normalized_labs: Any = None,
    history: Any = None,
) -> List[SystemResult]:
    """Return list of SystemResult for all canonical systems with status, drivers, confidence, smoothing meta."""
    cluster_map = cluster_lookup(list(clusters) if clusters else [])
    default_conf = float(getattr(config, "default_system_confidence", 70))
    results: List[SystemResult] = []

    # Cluster-weighted systems
    for system_id, weights in SYSTEM_CLUSTER_WEIGHTS.items():
        raw_score, top_drivers = compute_weighted_system_score(cluster_map, weights)
        score = clamp_0_100(raw_score)
        if system_id == "SYS_BONE":
            score = min(score, SYS_BONE_CAP)
        if system_id == "SYS_INFLAM_CTX":
            score = min(score, SYS_INFLAM_CTX_CAP)
        status = system_status_from_score(score)
        confidence = compute_system_confidence(system_id, clusters, weights, default_conf)
        explain_meta: Dict[str, Any] = {}
        prev = get_previous_system_state(history, system_id)
        if prev is not None:
            prev_score = prev.get("score", 0.0)
            prev_status = prev.get("status", "stable")
            score_delta = score - prev_score
            would_flip = status != prev_status
            explain_meta["previous_score"] = prev_score
            explain_meta["score_delta"] = round(score_delta, 1)
            explain_meta["would_flip_status"] = would_flip
            explain_meta["flip_large_enough"] = abs(score_delta) >= FLIP_THRESHOLD
        results.append(
            SystemResult(
                system_id=system_id,
                score=score,
                status=status,
                top_drivers=top_drivers,
                confidence=confidence,
                explain_meta=explain_meta,
            )
        )

    # SYS_BIOMARKERS_CTX: lab count only
    bio_score = compute_biomarkers_context_score(normalized_labs)
    bio_status = system_status_from_score(bio_score)
    bio_explain: Dict[str, Any] = {}
    prev_bio = get_previous_system_state(history, "SYS_BIOMARKERS_CTX")
    if prev_bio is not None:
        bio_explain["previous_score"] = prev_bio.get("score", 0.0)
        bio_explain["score_delta"] = round(bio_score - bio_explain["previous_score"], 1)
        bio_explain["would_flip_status"] = bio_status != prev_bio.get("status", "stable")
        bio_explain["flip_large_enough"] = abs(bio_explain["score_delta"]) >= FLIP_THRESHOLD
    results.append(
        SystemResult(
            system_id="SYS_BIOMARKERS_CTX",
            score=bio_score,
            status=bio_status,
            top_drivers=[],
            confidence=default_conf,
            explain_meta=bio_explain,
        )
    )

    return results

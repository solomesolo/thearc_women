"""
Validation harness helpers: extraction and invariant assertions.
Task 12.2 — Validation Harness, Regression Checks, and Release Gate.
"""

import re
from typing import Any, Dict, List

VALID_SYSTEM_STATUSES = {"stable", "variable", "needs_attention"}
VALID_SAFETY_PRIORITIES = {"low", "medium", "high"}
SAFE_RULE_ID_PATTERN = re.compile(r"^SAFE\d+$")


def _num(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def extract_top_cluster_ids(engine_output: Any, limit: int = 3) -> List[str]:
    """Return top cluster IDs by strength (descending), up to limit."""
    clusters = getattr(engine_output, "clusters", None) or []
    sorted_ids = [
        c.cluster_id
        for c in sorted(
            clusters,
            key=lambda x: (_num(getattr(x, "strength", 0)), getattr(x, "cluster_id", "")),
            reverse=True,
        )
    ]
    return sorted_ids[:limit]


def extract_top_root_pattern_ids(engine_output: Any, limit: int = 3) -> List[str]:
    """Return top root pattern IDs by score (descending), up to limit."""
    patterns = getattr(engine_output, "root_patterns", None) or []
    sorted_ids = [
        r.pattern_id
        for r in sorted(
            patterns,
            key=lambda x: (_num(getattr(x, "score", 0)), getattr(x, "pattern_id", "")),
            reverse=True,
        )
    ]
    return sorted_ids[:limit]


def extract_system_status_map(engine_output: Any) -> Dict[str, str]:
    """Return system_id -> status for all systems."""
    systems = getattr(engine_output, "systems", None) or []
    out: Dict[str, str] = {}
    for s in systems:
        sid = getattr(s, "system_id", None)
        if sid:
            out[sid] = getattr(s, "status", "stable") or "stable"
    return out


def extract_safety_rule_ids(engine_output: Any) -> List[str]:
    """Return list of safety_rule_id from safety_prompts."""
    prompts = getattr(engine_output, "safety_prompts", None) or []
    return [getattr(p, "safety_rule_id", "") for p in prompts if getattr(p, "safety_rule_id", "")]


def assert_scores_in_bounds(engine_output: Any) -> None:
    """Invariant 1: all scores in [0, 100] for clusters, systems, root patterns, lens."""
    clusters = getattr(engine_output, "clusters", None) or []
    for c in clusters:
        strength = _num(getattr(c, "strength", 0))
        conf = _num(getattr(c, "confidence", 0))
        if not (0 <= strength <= 100):
            raise AssertionError(f"Cluster {getattr(c, 'cluster_id', '?')} strength out of bounds: {strength}")
        if not (0 <= conf <= 100):
            raise AssertionError(f"Cluster {getattr(c, 'cluster_id', '?')} confidence out of bounds: {conf}")

    systems = getattr(engine_output, "systems", None) or []
    for s in systems:
        score = _num(getattr(s, "score", 0))
        if not (0 <= score <= 100):
            raise AssertionError(f"System {getattr(s, 'system_id', '?')} score out of bounds: {score}")
        conf = getattr(s, "confidence", None)
        if conf is not None and not (0 <= _num(conf) <= 100):
            raise AssertionError(f"System {getattr(s, 'system_id', '?')} confidence out of bounds: {conf}")

    patterns = getattr(engine_output, "root_patterns", None) or []
    for r in patterns:
        score = _num(getattr(r, "score", 0))
        conf = _num(getattr(r, "confidence", 0))
        if not (0 <= score <= 100):
            raise AssertionError(f"Root pattern {getattr(r, 'pattern_id', '?')} score out of bounds: {score}")
        if not (0 <= conf <= 100):
            raise AssertionError(f"Root pattern {getattr(r, 'pattern_id', '?')} confidence out of bounds: {conf}")

    lens = getattr(engine_output, "lens", None)
    if lens is not None:
        score = _num(getattr(lens, "primary_lens_score", 0))
        if not (0 <= score <= 100):
            raise AssertionError(f"Lens primary_lens_score out of bounds: {score}")
        conf = getattr(lens, "lens_confidence", None)
        if conf is not None and not (0 <= _num(conf) <= 100):
            raise AssertionError(f"Lens lens_confidence out of bounds: {conf}")


def assert_ids_canonical(engine_output: Any, registry: Any) -> None:
    """Invariant 2: all returned IDs are in registry (clusters, systems, root patterns, lens). Safety rule IDs allow SAFE##."""
    clusters = getattr(engine_output, "clusters", None) or []
    for c in clusters:
        cid = getattr(c, "cluster_id", None)
        if cid and not registry.is_valid_cluster(cid):
            raise AssertionError(f"Unknown cluster ID: {cid}")

    systems = getattr(engine_output, "systems", None) or []
    for s in systems:
        sid = getattr(s, "system_id", None)
        if sid and not registry.is_valid_system(sid):
            raise AssertionError(f"Unknown system ID: {sid}")

    patterns = getattr(engine_output, "root_patterns", None) or []
    for r in patterns:
        pid = getattr(r, "pattern_id", None)
        if pid and not registry.is_valid_root_pattern(pid):
            raise AssertionError(f"Unknown root pattern ID: {pid}")

    lens = getattr(engine_output, "lens", None)
    if lens is not None:
        primary = getattr(lens, "primary_lens_id", None) or "LENS_BASELINE"
        if not registry.is_valid_lens(primary):
            raise AssertionError(f"Unknown primary lens ID: {primary}")
        secondary = getattr(lens, "secondary_lens_id", None)
        if secondary is not None and not registry.is_valid_lens(secondary):
            raise AssertionError(f"Unknown secondary lens ID: {secondary}")

    prompts = getattr(engine_output, "safety_prompts", None) or []
    for p in prompts:
        rid = getattr(p, "safety_rule_id", None) or ""
        if rid and not (registry.is_valid_safety_message(rid) or bool(SAFE_RULE_ID_PATTERN.match(rid))):
            raise AssertionError(f"Unknown or invalid safety rule ID: {rid}")


def assert_valid_system_statuses(engine_output: Any) -> None:
    """Invariant 3: all system status values are allowed."""
    status_map = extract_system_status_map(engine_output)
    for sid, status in status_map.items():
        if status not in VALID_SYSTEM_STATUSES:
            raise AssertionError(f"Invalid system status for {sid}: {status!r}. Allowed: {VALID_SYSTEM_STATUSES}")


def assert_lens_always_exists(engine_output: Any) -> None:
    """Invariant 4: primary_lens_id is always set."""
    lens = getattr(engine_output, "lens", None)
    if lens is None:
        raise AssertionError("engine_output.lens is missing")
    primary = getattr(lens, "primary_lens_id", None)
    if not primary:
        raise AssertionError("engine_output.lens.primary_lens_id is not set")


def assert_blended_lens_consistency(engine_output: Any) -> None:
    """Invariant 5: if is_blended True then secondary_lens_id not null; if False, secondary may be null."""
    lens = getattr(engine_output, "lens", None)
    if lens is None:
        return
    is_blended = getattr(lens, "is_blended", False)
    secondary = getattr(lens, "secondary_lens_id", None)
    if is_blended and secondary is None:
        raise AssertionError("is_blended is True but secondary_lens_id is null")


def assert_safety_priority_valid(engine_output: Any) -> None:
    """Invariant 6: safety priorities are low, medium, or high."""
    prompts = getattr(engine_output, "safety_prompts", None) or []
    for p in prompts:
        pri = getattr(p, "priority", None) or ""
        if pri and pri not in VALID_SAFETY_PRIORITIES:
            raise AssertionError(f"Invalid safety priority: {pri!r}. Allowed: {VALID_SAFETY_PRIORITIES}")


def assert_trace_ids_when_enabled(engine_output: Any, config: Any) -> None:
    """Invariant 7: when config.enable_reasoning_traces is True, lens and all non-empty entities have trace IDs."""
    if not getattr(config, "enable_reasoning_traces", False):
        return
    lens = getattr(engine_output, "lens", None)
    if lens is not None:
        tid = getattr(lens, "reasoning_trace_id", None)
        if not tid:
            raise AssertionError("enable_reasoning_traces is True but lens.reasoning_trace_id is null")
    for c in getattr(engine_output, "clusters", None) or []:
        if not getattr(c, "reasoning_trace_id", None):
            raise AssertionError(f"Cluster {getattr(c, 'cluster_id', '?')} missing reasoning_trace_id")
    for s in getattr(engine_output, "systems", None) or []:
        if not getattr(s, "reasoning_trace_id", None):
            raise AssertionError(f"System {getattr(s, 'system_id', '?')} missing reasoning_trace_id")
    for r in getattr(engine_output, "root_patterns", None) or []:
        if not getattr(r, "reasoning_trace_id", None):
            raise AssertionError(f"Root pattern {getattr(r, 'pattern_id', '?')} missing reasoning_trace_id")
    for p in getattr(engine_output, "safety_prompts", None) or []:
        if not getattr(p, "reasoning_trace_id", None):
            raise AssertionError(f"Safety prompt {getattr(p, 'safety_rule_id', '?')} missing reasoning_trace_id")


def assert_no_duplicate_ids(engine_output: Any) -> None:
    """Invariant 8: no duplicate cluster, system, or root pattern IDs in returned lists."""
    clusters = getattr(engine_output, "clusters", None) or []
    cids = [getattr(c, "cluster_id", None) for c in clusters]
    seen: set = set()
    for cid in cids:
        if cid in seen:
            raise AssertionError(f"Duplicate cluster ID: {cid}")
        seen.add(cid)

    systems = getattr(engine_output, "systems", None) or []
    sids = [getattr(s, "system_id", None) for s in systems]
    seen = set()
    for sid in sids:
        if sid in seen:
            raise AssertionError(f"Duplicate system ID: {sid}")
        seen.add(sid)

    patterns = getattr(engine_output, "root_patterns", None) or []
    pids = [getattr(r, "pattern_id", None) for r in patterns]
    seen = set()
    for pid in pids:
        if pid in seen:
            raise AssertionError(f"Duplicate root pattern ID: {pid}")
        seen.add(pid)


def assert_baseline_lens_consistency(engine_output: Any) -> None:
    """Invariant 9: if primary_lens_id is LENS_BASELINE then is_blended False and secondary_lens_id None."""
    lens = getattr(engine_output, "lens", None)
    if lens is None:
        return
    primary = getattr(lens, "primary_lens_id", None) or "LENS_BASELINE"
    if primary != "LENS_BASELINE":
        return
    if getattr(lens, "is_blended", False):
        raise AssertionError("primary_lens_id is LENS_BASELINE but is_blended is True")
    secondary = getattr(lens, "secondary_lens_id", None)
    if secondary is not None:
        raise AssertionError("primary_lens_id is LENS_BASELINE but secondary_lens_id is not None")


def assert_urgent_attention_precedence(engine_output: Any) -> None:
    """Invariant 10: if any safety prompt has message_type 'urgent attention', highest priority must be high."""
    prompts = getattr(engine_output, "safety_prompts", None) or []
    has_urgent = any(getattr(p, "message_type", None) == "urgent attention" for p in prompts)
    if not has_urgent:
        return
    priorities = [getattr(p, "priority", None) or "" for p in prompts]
    if "high" not in priorities:
        raise AssertionError("At least one safety prompt has message_type 'urgent attention' but no priority is 'high'")


def format_golden_mismatch(actual: Dict[str, Any], expected: Dict[str, Any], fixture_name: str) -> str:
    """Produce a short mismatch report for CI (fixture name, top_clusters, lens, safety_rule_ids)."""
    lines = [f"Fixture {fixture_name} failed:"]
    exp_pl = expected.get("primary_lens_id")
    act_pl = actual.get("primary_lens_id")
    if exp_pl != act_pl:
        lines.append(f"  expected primary_lens_id={exp_pl!r}")
        lines.append(f"  actual primary_lens_id={act_pl!r}")
    exp_tc = expected.get("top_clusters") or []
    act_tc = actual.get("top_clusters") or []
    if act_tc[: len(exp_tc)] != exp_tc:
        lines.append(f"  expected top_clusters={exp_tc}")
        lines.append(f"  actual top_clusters={act_tc}")
    exp_safe = sorted(expected.get("safety_rule_ids") or [])
    act_safe = sorted(actual.get("safety_rule_ids") or [])
    if act_safe != exp_safe:
        lines.append(f"  expected safety_rule_ids={exp_safe}")
        lines.append(f"  actual safety_rule_ids={act_safe}")
    return "\n".join(lines)


def assert_engine_invariants(engine_output: Any, registry: Any, config: Any) -> None:
    """Run all invariant checks. Raises AssertionError on first failure with clear message."""
    assert_scores_in_bounds(engine_output)
    assert_ids_canonical(engine_output, registry)
    assert_valid_system_statuses(engine_output)
    assert_lens_always_exists(engine_output)
    assert_blended_lens_consistency(engine_output)
    assert_safety_priority_valid(engine_output)
    assert_trace_ids_when_enabled(engine_output, config)
    assert_no_duplicate_ids(engine_output)
    assert_baseline_lens_consistency(engine_output)
    assert_urgent_attention_precedence(engine_output)

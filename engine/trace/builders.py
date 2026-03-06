"""
Build reasoning traces for clusters, systems, patterns, lens, and safety.
Deterministic trace IDs; lightweight payloads.
"""

import hashlib
import json
from typing import Any, Dict, List, Optional

from engine.types import ReasoningTrace
from engine.trace.store import TraceStore


def to_stable_json(data: Dict[str, Any]) -> str:
    """Deterministic JSON: sorted keys, no extra whitespace."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def stable_trace_id(trace_type: str, entity_id: str, payload: Dict[str, Any]) -> str:
    """Deterministic trace ID: trace_type:entity_id:first10hex(sha1(stable_json(payload)))."""
    payload_str = to_stable_json(payload)
    h = hashlib.sha1(payload_str.encode("utf-8")).hexdigest()
    short_hash = h[:10]
    return f"{trace_type}:{entity_id}:{short_hash}"


def signal_score_lookup(signal_scores: Any) -> Dict[str, float]:
    """symptom_id -> score from list of SignalScore."""
    out: Dict[str, float] = {}
    for row in signal_scores or []:
        sid = getattr(row, "symptom_id", None)
        if sid:
            out[sid] = float(getattr(row, "score", 0) or 0)
    return out


def cluster_lookup(clusters: Any) -> Dict[str, Any]:
    """cluster_id -> cluster result."""
    out: Dict[str, Any] = {}
    for c in clusters or []:
        cid = getattr(c, "cluster_id", None)
        if cid:
            out[cid] = c
    return out


def system_lookup(systems: Any) -> Dict[str, Any]:
    """system_id -> system result."""
    out: Dict[str, Any] = {}
    for s in systems or []:
        sid = getattr(s, "system_id", None)
        if sid:
            out[sid] = s
    return out


def _adjusted_cluster_strength(cluster: Any) -> float:
    strength = float(getattr(cluster, "strength", 0) or 0)
    confidence = float(getattr(cluster, "confidence", 0) or 0)
    return strength * (0.6 + 0.4 * (confidence / 100.0))


def build_cluster_trace(
    cluster: Any,
    signal_scores: Any,
    derived_flags: Any,
    temporal_meta: Any = None,
    lab_meta: Any = None,
) -> ReasoningTrace:
    """Build a reasoning trace for a cluster result."""
    entity_id = getattr(cluster, "cluster_id", "") or ""
    supporting = list(getattr(cluster, "supporting_signals", None) or [])
    score_map = signal_score_lookup(signal_scores)
    supporting_signals = [{"symptom_id": sid, "score": score_map.get(sid, 0.0)} for sid in supporting]
    flags = derived_flags or {}
    inputs: Dict[str, Any] = {
        "supporting_signals": supporting_signals,
        "derived_flags": {k: v for k, v in flags.items() if v is not None},
        "confounders": list(getattr(cluster, "confounders_applied", None) or []),
    }
    strength = float(getattr(cluster, "strength", 0) or 0)
    confidence = float(getattr(cluster, "confidence", 0) or 0)
    calculations: Dict[str, Any] = {
        "strength": strength,
        "confidence": confidence,
        "temporal": temporal_meta if temporal_meta else {},
        "lab_effects": lab_meta if lab_meta else {},
    }
    outputs: Dict[str, Any] = {
        "cluster_id": entity_id,
        "strength": strength,
        "confidence": confidence,
    }
    links: Dict[str, List[str]] = {
        "upstream_signal_ids": supporting,
        "downstream_system_ids": [],
        "downstream_pattern_ids": [],
    }
    payload = {"inputs": inputs, "calculations": calculations, "outputs": outputs}
    trace_id = stable_trace_id("cluster", entity_id, payload)
    return ReasoningTrace(
        trace_id=trace_id,
        trace_type="cluster",
        entity_id=entity_id,
        summary="Cluster derived from symptom signals and context flags.",
        inputs=inputs,
        calculations=calculations,
        outputs=outputs,
        links=links,
    )


def build_system_trace(system: Any, clusters: Any) -> ReasoningTrace:
    """Build a reasoning trace for a system result."""
    entity_id = getattr(system, "system_id", "") or ""
    cluster_map = cluster_lookup(clusters)
    top_drivers = list(getattr(system, "top_drivers", None) or [])
    contributing_clusters: List[Dict[str, Any]] = []
    for cid in top_drivers:
        c = cluster_map.get(cid)
        if c is None:
            continue
        strength = float(getattr(c, "strength", 0) or 0)
        confidence = float(getattr(c, "confidence", 0) or 0)
        adj = _adjusted_cluster_strength(c)
        contributing_clusters.append({
            "cluster_id": cid,
            "strength": strength,
            "confidence": confidence,
            "adjusted_strength": round(adj, 2),
        })
    inputs: Dict[str, Any] = {"contributing_clusters": contributing_clusters}
    score = float(getattr(system, "score", 0) or 0)
    status = getattr(system, "status", "stable") or "stable"
    calculations: Dict[str, Any] = {
        "raw_score": score,
        "status_mapping": status,
    }
    outputs: Dict[str, Any] = {
        "system_id": entity_id,
        "score": score,
        "status": status,
        "top_drivers": top_drivers,
    }
    if getattr(system, "confidence", None) is not None:
        outputs["confidence"] = getattr(system, "confidence")
    links: Dict[str, List[str]] = {"upstream_cluster_ids": top_drivers, "downstream_lens_ids": []}
    payload = {"inputs": inputs, "calculations": calculations, "outputs": outputs}
    trace_id = stable_trace_id("system", entity_id, payload)
    return ReasoningTrace(
        trace_id=trace_id,
        trace_type="system",
        entity_id=entity_id,
        summary="System score from cluster contributions and weights.",
        inputs=inputs,
        calculations=calculations,
        outputs=outputs,
        links=links,
    )


def build_pattern_trace(pattern: Any, mapping_meta: Any = None) -> ReasoningTrace:
    """Build a reasoning trace for a root pattern result."""
    entity_id = getattr(pattern, "pattern_id", "") or ""
    explain = getattr(pattern, "explain_meta", None) or {}
    contributing = explain.get("contributing_clusters", [])
    if isinstance(contributing, list) and contributing and isinstance(contributing[0], dict):
        contrib_list = [{"cluster_id": c.get("cluster_id"), "contribution": c.get("contribution")} for c in contributing]
    else:
        contrib_list = [{"cluster_id": cid} for cid in contributing] if isinstance(contributing, list) else []
    # upstream cluster IDs for links
    upstream = []
    for c in contributing:
        if isinstance(c, str):
            upstream.append(c)
        elif isinstance(c, dict) and c.get("cluster_id"):
            upstream.append(c["cluster_id"])
    inputs: Dict[str, Any] = {
        "contributing_clusters": contrib_list,
        "fallback_used": explain.get("fallback_only", False),
    }
    score = float(getattr(pattern, "score", 0) or 0)
    confidence = float(getattr(pattern, "confidence", 0) or 0)
    evidence = getattr(pattern, "evidence_level", None)
    calculations: Dict[str, Any] = {
        "raw_contribution_sum": explain.get("raw_contribution_sum", score),
        "chosen_evidence_level": evidence,
        "confidence_components": {"score": score, "confidence": confidence},
    }
    outputs: Dict[str, Any] = {
        "pattern_id": entity_id,
        "score": score,
        "confidence": confidence,
        "evidence_level": evidence,
    }
    links: Dict[str, List[str]] = {"upstream_cluster_ids": upstream}
    payload = {"inputs": inputs, "calculations": calculations, "outputs": outputs}
    trace_id = stable_trace_id("pattern", entity_id, payload)
    return ReasoningTrace(
        trace_id=trace_id,
        trace_type="pattern",
        entity_id=entity_id,
        summary="Root pattern from cluster mapping and gates.",
        inputs=inputs,
        calculations=calculations,
        outputs=outputs,
        links=links,
    )


def build_lens_trace(lens: Any, systems: Any) -> ReasoningTrace:
    """Build a reasoning trace for the lens result."""
    primary = getattr(lens, "primary_lens_id", None) or "LENS_BASELINE"
    entity_id = primary
    explain = getattr(lens, "explain_meta", None) or {}
    inputs: Dict[str, Any] = {
        "contributing_systems": list(explain.get("contributing_systems", [])),
        "raw_lens_scores": explain.get("raw_lens_scores", {}),
        "eligibility_results": explain.get("eligibility_results", {}),
    }
    score = float(getattr(lens, "primary_lens_score", 0) or 0)
    calculations: Dict[str, Any] = {
        "chosen_lens_score": score,
        "blend_decision": getattr(lens, "is_blended", False),
        "baseline_fallback_reason": explain.get("baseline_reason"),
    }
    outputs: Dict[str, Any] = {
        "primary_lens_id": primary,
        "secondary_lens_id": getattr(lens, "secondary_lens_id", None),
        "is_blended": getattr(lens, "is_blended", False),
        "lens_confidence": getattr(lens, "lens_confidence", None),
        "reason_tags": list(getattr(lens, "lens_reason_tags", None) or []),
    }
    sys_ids = list(explain.get("contributing_systems", []))
    links: Dict[str, List[str]] = {"upstream_system_ids": sys_ids}
    payload = {"inputs": inputs, "calculations": calculations, "outputs": outputs}
    trace_id = stable_trace_id("lens", entity_id, payload)
    return ReasoningTrace(
        trace_id=trace_id,
        trace_type="lens",
        entity_id=entity_id,
        summary="Lens selected from system scores and eligibility.",
        inputs=inputs,
        calculations=calculations,
        outputs=outputs,
        links=links,
    )


def build_safety_trace(prompt: Any, safety_meta: Any = None) -> ReasoningTrace:
    """Build a reasoning trace for a safety prompt."""
    entity_id = getattr(prompt, "safety_rule_id", "") or ""
    inputs: Dict[str, Any] = {
        "rule_id": entity_id,
        "trigger_signals": list(getattr(prompt, "trigger_signals", None) or []),
    }
    calculations: Dict[str, Any] = {
        "priority": getattr(prompt, "priority", ""),
        "message_type": getattr(prompt, "message_type", ""),
        "escalation": getattr(prompt, "escalation", None),
    }
    outputs: Dict[str, Any] = {
        "safety_rule_id": entity_id,
        "priority": getattr(prompt, "priority", ""),
        "message_type": getattr(prompt, "message_type", ""),
        "cluster_override": list(getattr(prompt, "cluster_override", None) or []),
    }
    overrides = list(getattr(prompt, "cluster_override", None) or [])
    links: Dict[str, List[str]] = {"affected_cluster_ids": overrides}
    payload = {"inputs": inputs, "calculations": calculations, "outputs": outputs}
    trace_id = stable_trace_id("safety", entity_id, payload)
    return ReasoningTrace(
        trace_id=trace_id,
        trace_type="safety",
        entity_id=entity_id,
        summary="Safety rule evaluated; prompt generated.",
        inputs=inputs,
        calculations=calculations,
        outputs=outputs,
        links=links,
    )


def trace_store_to_debug_dict(store: TraceStore) -> Dict[str, Dict[str, Any]]:
    """Serialize TraceStore to JSON-friendly dict for engine_output.debug_meta['reasoning_traces']."""
    return store.as_dict()


def attach_trace_id_to_dashboard_sections(engine_output: Any) -> None:
    """Patch dashboard_sections with trace IDs from attached entities (lens, systems, safety_prompts)."""
    sections = getattr(engine_output, "dashboard_sections", None) or {}
    # Lens card
    if "primary_lens_card" in sections and engine_output.lens is not None:
        tid = getattr(engine_output.lens, "reasoning_trace_id", None)
        if isinstance(sections["primary_lens_card"], dict):
            sections["primary_lens_card"]["show_reasoning_trace_id"] = tid
    # Systems map items: match by system_id
    systems = list(getattr(engine_output, "systems", None) or [])
    sys_by_id = {getattr(s, "system_id", None): s for s in systems if getattr(s, "system_id", None)}
    if "systems_map" in sections:
        sm = sections["systems_map"]
        items = sm.get("items") if isinstance(sm, dict) else []
        for item in items or []:
            if isinstance(item, dict):
                sid = item.get("system_id")
                s = sys_by_id.get(sid) if sid else None
                if s is not None:
                    item["reasoning_trace_id"] = getattr(s, "reasoning_trace_id", None)
        # System detail inspector: selected system's trace
        selected_id = sm.get("selected_system_id") if isinstance(sm, dict) else None
        sel_system = sys_by_id.get(selected_id) if selected_id else None
        if "system_detail_inspector" in sections and isinstance(sections["system_detail_inspector"], dict):
            sections["system_detail_inspector"]["show_reasoning_trace_id"] = (
                getattr(sel_system, "reasoning_trace_id", None) if sel_system is not None else None
            )
    # Safety panel: align prompts with engine_output.safety_prompts by index
    prompts = list(getattr(engine_output, "safety_prompts", None) or [])
    if "safety_panel" in sections:
        sp = sections["safety_panel"]
        panel_prompts = sp.get("prompts") if isinstance(sp, dict) else []
        for i, p in enumerate(prompts):
            if i < len(panel_prompts) and isinstance(panel_prompts[i], dict):
                panel_prompts[i]["reasoning_trace_id"] = getattr(p, "reasoning_trace_id", None)


def attach_reasoning_traces(engine_output: Any, registry: Any, config: Any) -> Any:
    """Build traces for all entities, attach trace IDs, patch dashboard sections, embed serialized store."""
    store = TraceStore()
    debug = getattr(engine_output, "debug_meta", None) or {}
    signal_scores = getattr(engine_output, "signal_scores", None) or []
    derived_flags = debug.get("derived_flags") if isinstance(debug.get("derived_flags"), dict) else {}
    temporal_meta = debug.get("temporal_meta")
    lab_meta = debug.get("lab_meta")
    mapping_meta = debug.get("mapping_meta")
    safety_meta = debug.get("safety_meta")

    # Clusters
    for cluster in getattr(engine_output, "clusters", None) or []:
        trace = build_cluster_trace(cluster, signal_scores, derived_flags, temporal_meta, lab_meta)
        store.add(trace)
        if hasattr(cluster, "reasoning_trace_id"):
            cluster.reasoning_trace_id = trace.trace_id

    # Systems
    clusters = getattr(engine_output, "clusters", None) or []
    for system in getattr(engine_output, "systems", None) or []:
        trace = build_system_trace(system, clusters)
        store.add(trace)
        if hasattr(system, "reasoning_trace_id"):
            system.reasoning_trace_id = trace.trace_id

    # Root patterns
    for pattern in getattr(engine_output, "root_patterns", None) or []:
        trace = build_pattern_trace(pattern, mapping_meta)
        store.add(trace)
        if hasattr(pattern, "reasoning_trace_id"):
            pattern.reasoning_trace_id = trace.trace_id

    # Lens
    lens = getattr(engine_output, "lens", None)
    if lens is not None:
        systems_list = getattr(engine_output, "systems", None) or []
        trace = build_lens_trace(lens, systems_list)
        store.add(trace)
        if hasattr(lens, "reasoning_trace_id"):
            lens.reasoning_trace_id = trace.trace_id

    # Safety prompts
    for prompt in getattr(engine_output, "safety_prompts", None) or []:
        trace = build_safety_trace(prompt, safety_meta)
        store.add(trace)
        if hasattr(prompt, "reasoning_trace_id"):
            prompt.reasoning_trace_id = trace.trace_id

    attach_trace_id_to_dashboard_sections(engine_output)

    if not hasattr(engine_output, "debug_meta"):
        engine_output.debug_meta = {}
    engine_output.debug_meta["reasoning_traces"] = trace_store_to_debug_dict(store)
    return engine_output

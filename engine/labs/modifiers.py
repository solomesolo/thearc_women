"""
Apply lab-based confidence (and optional strength) modification to clusters.
Labs add context; no diagnosis. Confidence first; strength only when rule specifies.
"""

from collections import defaultdict
from dataclasses import replace
from typing import Any, Dict, List, Optional, Tuple

from engine.types import ClusterResult

MAX_LAB_CONFIDENCE_DELTA_PER_CLUSTER = 30.0
RECENCY_FACTORS = {
    "le_12m": 1.0,
    "between_12m_24m": 0.5,
    "gt_24m_or_unknown": 0.25,
}

LAB_CLUSTER_RULES = [
    {"lab_id": "LAB_FERRITIN", "cluster_id": "CL_IRON_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 20, "delta_strength": 0, "note": "Ferritin adds iron-store context."},
    {"lab_id": "LAB_FERRITIN", "cluster_id": "CL_IRON_PATTERN", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 25, "delta_strength": 5, "note": "Out-of-range ferritin increases confidence and slightly strengthens the cluster."},
    {"lab_id": "LAB_FERRITIN", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 8, "delta_strength": 0, "note": "Ferritin adds fatigue-context."},
    {"lab_id": "LAB_FERRITIN", "cluster_id": "CL_GUT_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Ferritin may add absorption-context."},
    {"lab_id": "LAB_B12", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 6, "delta_strength": 0, "note": "B12 adds fatigue/brain-fog context."},
    {"lab_id": "LAB_B12", "cluster_id": "CL_IRON_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 5, "delta_strength": 0, "note": "B12 adds reserve-context."},
    {"lab_id": "LAB_B12", "cluster_id": "CL_GUT_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 8, "delta_strength": 0, "note": "B12 may support absorption context."},
    {"lab_id": "LAB_B12", "cluster_id": "CL_THYROID_SIGNALS", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 3, "delta_strength": 0, "note": "Minimal thyroid-context effect."},
    {"lab_id": "LAB_B12", "cluster_id": "CL_INFLAM_LOAD", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 3, "delta_strength": 0, "note": "Context only in multi-system fatigue."},
    {"lab_id": "LAB_FOLATE", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Folate adds fatigue context."},
    {"lab_id": "LAB_FOLATE", "cluster_id": "CL_GUT_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Folate adds mild absorption context."},
    {"lab_id": "LAB_VITD", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 5, "delta_strength": 0, "note": "Vitamin D adds low-energy context."},
    {"lab_id": "LAB_VITD", "cluster_id": "CL_TRAIN_MISMATCH", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Vitamin D adds recovery context."},
    {"lab_id": "LAB_VITD", "cluster_id": "CL_INFLAM_LOAD", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 5, "delta_strength": 0, "note": "Vitamin D adds broad context only."},
    {"lab_id": "LAB_VITD", "cluster_id": "CL_THYROID_SIGNALS", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 3, "delta_strength": 0, "note": "Minimal thyroid-context effect."},
    {"lab_id": "LAB_VITD", "cluster_id": "CL_SLEEP_DISRUPT", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 2, "delta_strength": 0, "note": "Sleep context only."},
    {"lab_id": "LAB_TSH", "cluster_id": "CL_THYROID_SIGNALS", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 20, "delta_strength": 0, "note": "TSH strongly increases thyroid-context confidence."},
    {"lab_id": "LAB_TSH", "cluster_id": "CL_THYROID_SIGNALS", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 25, "delta_strength": 5, "note": "Out-of-range TSH increases thyroid-context confidence and modest strength."},
    {"lab_id": "LAB_TSH", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 6, "delta_strength": 0, "note": "TSH adds fatigue/weight/cold context."},
    {"lab_id": "LAB_TSH", "cluster_id": "CL_CYCLE_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Small cycle-context effect."},
    {"lab_id": "LAB_FT4", "cluster_id": "CL_THYROID_SIGNALS", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 12, "delta_strength": 0, "note": "Free T4 adds thyroid-hormone context."},
    {"lab_id": "LAB_FT4", "cluster_id": "CL_THYROID_SIGNALS", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 15, "delta_strength": 3, "note": "Out-of-range Free T4 modestly strengthens thyroid-context clustering."},
    {"lab_id": "LAB_GLUCOSE_FAST", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 12, "delta_strength": 0, "note": "Fasting glucose adds objective glucose-context."},
    {"lab_id": "LAB_GLUCOSE_FAST", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 18, "delta_strength": 5, "note": "Out-of-range fasting glucose raises sugar-instability confidence."},
    {"lab_id": "LAB_GLUCOSE_FAST", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Metabolic context for energy variability."},
    {"lab_id": "LAB_HBA1C", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 15, "delta_strength": 0, "note": "HbA1c strengthens glucose-stability context."},
    {"lab_id": "LAB_HBA1C", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 20, "delta_strength": 5, "note": "Out-of-range HbA1c raises sugar-instability confidence."},
    {"lab_id": "LAB_HBA1C", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 6, "delta_strength": 0, "note": "Energy-context contribution."},
    {"lab_id": "LAB_INSULIN_FAST", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 18, "delta_strength": 0, "note": "Fasting insulin strongly supports sugar-instability context."},
    {"lab_id": "LAB_INSULIN_FAST", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 22, "delta_strength": 5, "note": "Out-of-range fasting insulin raises sugar-instability confidence."},
    {"lab_id": "LAB_INSULIN_FAST", "cluster_id": "CL_ENERGY_VAR", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 5, "delta_strength": 0, "note": "Energy variability context only."},
    {"lab_id": "LAB_TRIG", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 6, "delta_strength": 0, "note": "Cardiometabolic context for sugar-instability."},
    {"lab_id": "LAB_HDL", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Context only."},
    {"lab_id": "LAB_LDL", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Context only."},
    {"lab_id": "LAB_CRP", "cluster_id": "CL_INFLAM_LOAD", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 18, "delta_strength": 0, "note": "CRP adds objective inflammation-context."},
    {"lab_id": "LAB_CRP", "cluster_id": "CL_INFLAM_LOAD", "effect_target": "cluster_confidence", "value_state": "out_of_range", "delta_confidence": 22, "delta_strength": 5, "note": "Out-of-range CRP raises inflammatory-load confidence."},
    {"lab_id": "LAB_CRP", "cluster_id": "CL_GUT_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Mild GI context only."},
    {"lab_id": "LAB_CRP", "cluster_id": "CL_STRESS_ACCUM", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 2, "delta_strength": 0, "note": "Very minimal effect."},
    {"lab_id": "LAB_MAG", "cluster_id": "CL_SLEEP_DISRUPT", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 4, "delta_strength": 0, "note": "Sleep context only."},
    {"lab_id": "LAB_MAG", "cluster_id": "CL_STRESS_ACCUM", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 3, "delta_strength": 0, "note": "Stress context only."},
    {"lab_id": "LAB_MAG", "cluster_id": "CL_TRAIN_MISMATCH", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 3, "delta_strength": 0, "note": "Recovery context only."},
    {"lab_id": "LAB_ZINC", "cluster_id": "CL_IRON_PATTERN", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 2, "delta_strength": 0, "note": "Optional reserve-context marker."},
    {"lab_id": "LAB_OMEGA3", "cluster_id": "CL_SUGAR_INSTAB", "effect_target": "cluster_confidence", "value_state": "present_recent", "delta_confidence": 2, "delta_strength": 0, "note": "Optional cardiometabolic context."},
]

# Index: (lab_id, cluster_id, value_state) -> list of rules
RULES_BY_LAB_CLUSTER_STATE: Dict[Tuple[str, str, str], List[Dict]] = defaultdict(list)
for r in LAB_CLUSTER_RULES:
    key = (r["lab_id"], r["cluster_id"], r["value_state"])
    RULES_BY_LAB_CLUSTER_STATE[key].append(r)


def clamp_0_100(value: float) -> float:
    return max(0.0, min(100.0, float(value)))


def canonicalize_lab_rule_cluster_id(cluster_id: str) -> str:
    if cluster_id == "CL_METABOLIC_PROXY":
        return "CL_ENERGY_VAR"
    if cluster_id == "CL_MICRO_CONTEXT":
        return "CL_IRON_PATTERN"
    return cluster_id


def get_matching_lab_rules(lab_id: str, cluster_id: str, value_state: str) -> List[Dict]:
    cid = canonicalize_lab_rule_cluster_id(cluster_id)
    key = (lab_id, cid, value_state)
    return list(RULES_BY_LAB_CLUSTER_STATE.get(key, []))


def resolve_lab_rule_value_state(normalized_lab: Any) -> str:
    """Value state for rule lookup; fallback unknown -> present_recent when recency > 0.25."""
    vs = getattr(normalized_lab, "value_state", None) or "unknown"
    if vs in ("present_recent", "out_of_range"):
        return vs
    rec = getattr(normalized_lab, "recency_factor", 0.25)
    if rec and float(rec) > 0.25:
        return "present_recent"
    return "unknown"


def summarize_lab_relevance_note(note: str) -> str:
    """Shorten rule note for relevance summary; keep non-diagnostic wording."""
    if not note or not isinstance(note, str):
        return "Adds context."
    s = note.strip()
    if " adds " in s:
        return "Adds " + s.split(" adds ", 1)[1].strip()
    if " strongly increases " in s:
        part = s.split(" strongly increases ", 1)[1].strip()
        part = part.replace("confidence", "context").rstrip(".")
        return "Adds " + part + "." if part else "Adds context."
    if " increases " in s:
        part = s.split(" increases ", 1)[1].strip()
        part = part.replace("confidence", "context").rstrip(".")
        return "Adds " + part + "." if part else "Adds context."
    if s:
        return s
    return "Adds context."


def apply_cluster_lab_deltas(
    cluster: ClusterResult,
    matching_rules: List[Dict],
    normalized_lab: Any,
) -> Tuple[float, float, List[Dict]]:
    """Apply deltas from matching rules for one lab. Returns (conf_delta, str_delta, applied_rule_meta)."""
    rec = getattr(normalized_lab, "recency_factor", None)
    if rec is None:
        bucket = getattr(normalized_lab, "recency_bucket", "gt_24m_or_unknown")
        rec = RECENCY_FACTORS.get(bucket, 0.25)
    rec = float(rec)
    lab_id = getattr(normalized_lab, "lab_id", "")
    value_state = getattr(normalized_lab, "value_state", "unknown")
    conf_delta = 0.0
    str_delta = 0.0
    applied = []
    for rule in matching_rules:
        dc = rule.get("delta_confidence", 0) or 0
        ds = rule.get("delta_strength", 0) or 0
        scaled_dc = dc * rec
        scaled_ds = ds * rec
        conf_delta += scaled_dc
        str_delta += scaled_ds
        applied.append({
            "lab_id": lab_id,
            "value_state": value_state,
            "base_delta_confidence": dc,
            "scaled_delta_confidence": scaled_dc,
            "base_delta_strength": ds,
            "scaled_delta_strength": scaled_ds,
            "recency_factor": rec,
            "note": rule.get("note", ""),
        })
    return conf_delta, str_delta, applied


def build_lab_relevance_summary(cluster_lab_effects: Dict[str, Any]) -> Dict[str, List[Dict]]:
    """Build cluster_lab_relevance from applied effects; one short explanation per lab per cluster."""
    out: Dict[str, List[Dict]] = {}
    for cid, data in cluster_lab_effects.items():
        applied = data.get("applied_rules") or []
        if not applied:
            continue
        seen_lab: set = set()
        entries = []
        for rule in applied:
            lab_id = rule.get("lab_id", "")
            if lab_id in seen_lab:
                continue
            seen_lab.add(lab_id)
            note = rule.get("note", "")
            short = summarize_lab_relevance_note(note)
            entries.append({"lab_id": lab_id, "why_relevant_short": short})
        if entries:
            out[cid] = entries
    return out


def apply_lab_modifiers(
    clusters: List[ClusterResult],
    normalized_labs: Any,
    registry: Any,
    config: Any,
) -> Tuple[List[ClusterResult], Dict[str, Any]]:
    """Return (updated clusters with lab-modified confidence/strength, lab_meta)."""
    labs = list(normalized_labs) if normalized_labs else []
    lab_meta: Dict[str, Any] = {"cluster_lab_effects": {}}
    cluster_by_id = {c.cluster_id: c for c in clusters}
    cluster_order = [c.cluster_id for c in clusters]

    for cluster in clusters:
        cid = cluster.cluster_id
        canon_id = canonicalize_lab_rule_cluster_id(cid)
        total_conf_delta = 0.0
        total_str_delta = 0.0
        all_applied: List[Dict] = []

        for lab in labs:
            lab_id = getattr(lab, "lab_id", None)
            if not lab_id:
                continue
            value_state = resolve_lab_rule_value_state(lab)
            rules = get_matching_lab_rules(lab_id, canon_id, value_state)
            if not rules:
                continue
            conf_d, str_d, applied = apply_cluster_lab_deltas(cluster, rules, lab)
            total_conf_delta += conf_d
            total_str_delta += str_d
            all_applied.extend(applied)

        cap_applied = False
        if total_conf_delta > MAX_LAB_CONFIDENCE_DELTA_PER_CLUSTER:
            total_conf_delta = MAX_LAB_CONFIDENCE_DELTA_PER_CLUSTER
            cap_applied = True

        if all_applied:
            lab_meta["cluster_lab_effects"][cid] = {
                "applied_rules": all_applied,
                "total_confidence_delta": round(total_conf_delta, 1),
                "total_strength_delta": round(total_str_delta, 1),
                "cap_applied": cap_applied,
            }

        if not all_applied:
            continue

        new_conf = clamp_0_100(cluster.confidence + total_conf_delta)
        new_str = clamp_0_100(cluster.strength + total_str_delta)
        if cluster.strength == 0:
            new_conf = min(new_conf, 40.0)
        if cid == "CL_INFLAM_LOAD":
            new_conf = min(new_conf, 85.0)
        cluster_by_id[cid] = replace(
            cluster,
            confidence=new_conf,
            strength=new_str,
        )

    lab_meta["cluster_lab_relevance"] = build_lab_relevance_summary(lab_meta["cluster_lab_effects"])
    updated = [cluster_by_id[cid] for cid in cluster_order]
    return updated, lab_meta

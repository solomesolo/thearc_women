"""
System-related output templates. Systems map tiles and system detail inspector.
"""

from typing import Any, Dict, List, Optional

SYSTEM_LABEL_MAP: Dict[str, str] = {
    "SYS_HORMONAL": "Hormonal Rhythm",
    "SYS_METABOLIC": "Metabolic Health",
    "SYS_STRESS": "Stress Response",
    "SYS_SLEEP": "Sleep Architecture",
    "SYS_GUT": "Gut System",
    "SYS_MICRO": "Micronutrient Reserves",
    "SYS_CARDIO": "Cardiovascular Health",
    "SYS_BONE": "Bone Health",
    "SYS_RECOVERY": "Recovery Capacity",
    "SYS_BIOMARKERS_CTX": "Biomarker Context",
    "SYS_INFLAM_CTX": "Inflammation Context",
    "SYS_NUTRITION": "Nutrition Patterns",
}

DASHBOARD_SYSTEM_ORDER: List[str] = [
    "SYS_HORMONAL",
    "SYS_METABOLIC",
    "SYS_STRESS",
    "SYS_SLEEP",
    "SYS_GUT",
    "SYS_MICRO",
    "SYS_CARDIO",
    "SYS_BONE",
    "SYS_RECOVERY",
    "SYS_BIOMARKERS_CTX",
    "SYS_INFLAM_CTX",
    "SYS_NUTRITION",
]

CLUSTER_DRIVER_LABELS: Dict[str, str] = {
    "CL_ENERGY_VAR": "energy variability",
    "CL_STRESS_ACCUM": "stress load",
    "CL_SLEEP_DISRUPT": "sleep disruption",
    "CL_CYCLE_VAR": "cycle variability",
    "CL_SUGAR_INSTAB": "post-meal crashes / cravings",
    "CL_IRON_PATTERN": "reserve-related signals",
    "CL_THYROID_SIGNALS": "thyroid-context signals",
    "CL_TRAIN_MISMATCH": "recovery mismatch",
    "CL_GUT_PATTERN": "gut variability",
    "CL_INFLAM_LOAD": "multi-system overlap",
}

DEFAULT_DRIVER_TEXT = "multiple smaller signals"
MAX_DRIVERS_FOR_EXPLANATION = 2


def system_label(system_id: str) -> str:
    """Return human-readable label for system_id."""
    return SYSTEM_LABEL_MAP.get(system_id, system_id)


def driver_label(cluster_id: str) -> str:
    """Return human-readable label for a cluster driver."""
    return CLUSTER_DRIVER_LABELS.get(cluster_id, cluster_id)


def _driver_text(top_drivers: List[str]) -> str:
    """Build driver_text from first 2 top drivers for explanation templates."""
    if not top_drivers:
        return DEFAULT_DRIVER_TEXT
    labels = [driver_label(cid) for cid in top_drivers[:MAX_DRIVERS_FOR_EXPLANATION]]
    return ", ".join(labels)


def system_short_explanation(system_result: Any) -> str:
    """One-sentence explanation by status: stable, variable, needs_attention."""
    label = system_label(getattr(system_result, "system_id", "") or "")
    status = getattr(system_result, "status", "stable") or "stable"
    top_drivers = list(getattr(system_result, "top_drivers", None) or [])
    driver_text = _driver_text(top_drivers)

    if status == "stable":
        return f"{label} signals look relatively steady in this time window."
    if status == "variable":
        return f"{label} looks somewhat variable right now, with signals shaped by {driver_text}."
    return f"{label} signals look more elevated in this time window, mainly shaped by {driver_text}."


def choose_default_selected_system(systems: Any) -> Optional[str]:
    """First system in dashboard order whose status is not stable; else first in order."""
    system_by_id = {getattr(s, "system_id", ""): s for s in (systems or []) if getattr(s, "system_id", None)}
    for sid in DASHBOARD_SYSTEM_ORDER:
        s = system_by_id.get(sid)
        if s is None:
            continue
        if getattr(s, "status", "stable") != "stable":
            return sid
    for sid in DASHBOARD_SYSTEM_ORDER:
        if sid in system_by_id:
            return sid
    return None


def _system_map(systems: Any) -> Dict[str, Any]:
    """system_id -> system result."""
    out: Dict[str, Any] = {}
    for s in systems or []:
        sid = getattr(s, "system_id", None)
        if sid:
            out[sid] = s
    return out


def _build_system_item(system_result: Any) -> Dict[str, Any]:
    """Single tile for systems_map items."""
    system_id = getattr(system_result, "system_id", "") or ""
    score = float(getattr(system_result, "score", 0) or 0)
    status = getattr(system_result, "status", "stable") or "stable"
    top_drivers = list(getattr(system_result, "top_drivers", None) or [])
    reasoning_trace_id = getattr(system_result, "reasoning_trace_id", None)
    return {
        "system_id": system_id,
        "label": system_label(system_id),
        "score": score,
        "status": status,
        "top_drivers": top_drivers,
        "short_explanation": system_short_explanation(system_result),
        "reasoning_trace_id": reasoning_trace_id,
    }


def build_systems_map(
    systems: Any,
    registry: Any,
    config: Any,
) -> Dict[str, Any]:
    """Build systems_map with items in DASHBOARD_SYSTEM_ORDER and selected_system_id."""
    system_by_id = _system_map(systems)
    items: List[Dict[str, Any]] = []
    for sid in DASHBOARD_SYSTEM_ORDER:
        s = system_by_id.get(sid)
        if s is None:
            continue
        items.append(_build_system_item(s))
    selected_system_id = choose_default_selected_system(systems)
    return {
        "items": items,
        "selected_system_id": selected_system_id,
    }


def build_system_detail_inspector(
    systems: Any,
    selected_system_id: Optional[str],
    registry: Any,
    config: Any,
) -> Dict[str, Any]:
    """Build system_detail_inspector for the selected system; stable shape even when none selected."""
    system_by_id = _system_map(systems)
    if not selected_system_id or selected_system_id not in system_by_id:
        return {
            "system_id": selected_system_id or "",
            "label": system_label(selected_system_id) if selected_system_id else "",
            "status": "stable",
            "score": 0.0,
            "short_explanation": "",
            "top_drivers": [],
            "show_reasoning_trace_id": None,
        }
    s = system_by_id[selected_system_id]
    return {
        "system_id": selected_system_id,
        "label": system_label(selected_system_id),
        "status": getattr(s, "status", "stable") or "stable",
        "score": float(getattr(s, "score", 0) or 0),
        "short_explanation": system_short_explanation(s),
        "top_drivers": list(getattr(s, "top_drivers", None) or []),
        "show_reasoning_trace_id": getattr(s, "reasoning_trace_id", None),
    }

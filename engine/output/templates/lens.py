"""
Lens-related output templates. Build primary lens card with title, body, reason tags, template mode.
"""

from typing import Any, Dict, List, Optional

LENS_TITLE_MAP: Dict[str, str] = {
    "LENS_STRESS_RECOVERY": "Stress & Recovery Regulation",
    "LENS_ENERGY_METABOLIC": "Energy Regulation & Metabolic Stability",
    "LENS_HORMONAL_RHYTHM": "Hormonal Rhythm & Cycle Signals",
    "LENS_GUT_ABSORPTION": "Gut Comfort & Absorption Context",
    "LENS_NUTRIENT_RESERVES": "Nutrient Reserves & Vitality",
    "LENS_BASELINE": "Baseline view",
}

LENS_FOCUS_MAP: Dict[str, str] = {
    "LENS_STRESS_RECOVERY": "stress load and recovery",
    "LENS_ENERGY_METABOLIC": "energy regulation and metabolic stability",
    "LENS_HORMONAL_RHYTHM": "cycle-linked and hormonal rhythm signals",
    "LENS_GUT_ABSORPTION": "digestion and absorption-related variability",
    "LENS_NUTRIENT_RESERVES": "nutrient reserves and vitality",
    "LENS_BASELINE": "overall system steadiness",
}

# Fallback reason tags per lens when lens_reason_tags is empty (3–5 tags max)
LENS_FALLBACK_REASON_TAGS: Dict[str, List[str]] = {
    "LENS_STRESS_RECOVERY": ["stress load", "sleep disruption"],
    "LENS_ENERGY_METABOLIC": ["energy variability", "post-meal crashes"],
    "LENS_HORMONAL_RHYTHM": ["cycle variability", "PMS / phase-linked changes"],
    "LENS_GUT_ABSORPTION": ["gut variability", "bloating / digestion"],
    "LENS_NUTRIENT_RESERVES": ["fatigue", "reserve-related signals"],
    "LENS_BASELINE": [],
}

MAX_REASON_TAGS = 5


def lens_title(lens_id: str) -> str:
    """Return human-readable title for lens_id."""
    return LENS_TITLE_MAP.get(lens_id, lens_id)


def lens_focus(lens_id: str) -> str:
    """Return focus phrase for lens_id."""
    return LENS_FOCUS_MAP.get(lens_id, "system signals")


def template_mode_for_lens(lens: Any) -> str:
    """Return 'baseline' | 'blended' | 'strong_primary'."""
    if not lens:
        return "baseline"
    primary = getattr(lens, "primary_lens_id", None) or "LENS_BASELINE"
    if primary == "LENS_BASELINE":
        return "baseline"
    if getattr(lens, "is_blended", False):
        return "blended"
    return "strong_primary"


def fallback_reason_tags(lens_id: str) -> List[str]:
    """Return fallback reason tags for lens (up to 5)."""
    tags = LENS_FALLBACK_REASON_TAGS.get(lens_id, [])
    return tags[:MAX_REASON_TAGS]


def join_reason_tags(tags: List[str]) -> str:
    """Join tags with commas."""
    return ", ".join(tags) if tags else ""


def build_primary_lens_card(
    lens: Any,
    registry: Any,
    config: Any,
) -> Dict[str, Any]:
    """
    Build dashboard-ready primary_lens_card object with title, body, reason_tags,
    template_mode, and show_reasoning_trace_id.
    """
    if not lens:
        primary_id = "LENS_BASELINE"
        secondary_id: Optional[str] = None
        is_blended = False
        primary_score = 0.0
        lens_confidence: Optional[float] = getattr(lens, "lens_confidence", None) if lens else None
        reason_tags_raw: List[str] = []
        reasoning_trace_id: Optional[str] = None
    else:
        primary_id = getattr(lens, "primary_lens_id", None) or "LENS_BASELINE"
        secondary_id = getattr(lens, "secondary_lens_id", None)
        is_blended = getattr(lens, "is_blended", False)
        primary_score = float(getattr(lens, "primary_lens_score", 0) or 0)
        lens_confidence = getattr(lens, "lens_confidence", None)
        if lens_confidence is not None:
            lens_confidence = float(lens_confidence)
        reason_tags_raw = list(getattr(lens, "lens_reason_tags", None) or [])
        reasoning_trace_id = getattr(lens, "reasoning_trace_id", None)

    mode = template_mode_for_lens(lens)
    tags = reason_tags_raw[:MAX_REASON_TAGS] if reason_tags_raw else fallback_reason_tags(primary_id)
    tag_list_str = join_reason_tags(tags)

    if mode == "baseline":
        title = lens_title("LENS_BASELINE")
        body = "With the signals you've shared so far, your systems look mostly steady. Updating a few signals can sharpen this view."
    elif mode == "blended" and secondary_id:
        title1 = lens_title(primary_id)
        title2 = lens_title(secondary_id)
        title = f"{title1} + {title2}"
        focus1 = lens_focus(primary_id)
        focus2 = lens_focus(secondary_id)
        body = f"{title}. Your signals look like a blend of {focus1} and {focus2}. Strongest drivers: {tag_list_str}."
    else:
        title = lens_title(primary_id)
        focus = lens_focus(primary_id)
        if tag_list_str:
            body = f"{title}. Right now, your signals point most strongly to {focus}. Driven by: {tag_list_str}."
        else:
            body = f"{title}. Right now, your signals point most strongly to {focus}."

    return {
        "primary_lens_id": primary_id,
        "secondary_lens_id": secondary_id,
        "is_blended": is_blended,
        "title": title,
        "body": body,
        "reason_tags": tags,
        "lens_confidence": lens_confidence,
        "primary_lens_score": primary_score,
        "template_mode": mode,
        "show_reasoning_trace_id": reasoning_trace_id,
    }

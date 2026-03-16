"""
Lab Awareness: educational lab cards tied to surfaced root patterns.

No value interpretation; no diagnostic language. Explanations use phrases like
"markers commonly used by clinicians." Never "this test diagnoses," "confirms," or "rules out."
"""

from __future__ import annotations

from typing import Any, Dict, List

from client_output.contracts import LabAwarenessCardVM
from client_output.display_resolver import resolve_lab

EXPLANATION_MAX_LEN = 120
MAX_LAB_CARDS = 5


# ---------------------------------------------------------------------------
# Pattern -> labs: which labs to surface when a root pattern is supported
# ---------------------------------------------------------------------------

PATTERN_TO_LABS: Dict[str, List[str]] = {
    "RP_IRON_DEPLETION": ["LAB_FERRITIN"],
    "RP_MICRO_DEPLETION": ["LAB_FERRITIN", "LAB_B12", "LAB_FOLATE", "LAB_VITD", "LAB_MAG", "LAB_ZINC"],
    "RP_THYROID_SLOWING": ["LAB_TSH", "LAB_FT4"],
    "RP_BLOOD_SUGAR": ["LAB_GLUCOSE_FAST", "LAB_HBA1C", "LAB_INSULIN_FAST", "LAB_TRIG", "LAB_HDL"],
    "RP_INFLAM_CTX": ["LAB_LDL", "LAB_CRP", "LAB_OMEGA3"],
    "RP_STRESS_LOAD": ["LAB_MAG"],
    "RP_SLEEP_DEPRIVATION": ["LAB_MAG"],
}

# ---------------------------------------------------------------------------
# Lab -> educational explanation (<= 120 chars). No value interpretation;
# no "high," "low," "normal," "abnormal," "deficient," "elevated."
# ---------------------------------------------------------------------------

LAB_EXPLANATIONS: Dict[str, str] = {
    "LAB_FERRITIN": "A marker commonly used by clinicians to assess iron storage context.",
    "LAB_B12": "A marker commonly used by clinicians to assess B12 status and energy context.",
    "LAB_FOLATE": "A marker commonly used by clinicians to assess folate and cell health context.",
    "LAB_VITD": "A marker commonly used by clinicians to assess vitamin D and vitality context.",
    "LAB_TSH": "A marker commonly used by clinicians to assess thyroid regulation context.",
    "LAB_FT4": "A marker commonly used by clinicians to assess thyroid hormone context.",
    "LAB_GLUCOSE_FAST": "A marker commonly used by clinicians to assess blood sugar context.",
    "LAB_HBA1C": "A marker commonly used by clinicians to assess longer-term glucose context.",
    "LAB_INSULIN_FAST": "A marker commonly used by clinicians to assess insulin sensitivity context.",
    "LAB_TRIG": "A marker commonly used by clinicians for cardiometabolic context.",
    "LAB_HDL": "A marker commonly used by clinicians for cardiometabolic and lipid context.",
    "LAB_LDL": "A marker commonly used by clinicians for cardiometabolic and lipid context.",
    "LAB_CRP": "A marker commonly used by clinicians to assess inflammation context.",
    "LAB_OMEGA3": "A marker sometimes used by clinicians for fatty acid and inflammation context.",
    "LAB_MAG": "A marker sometimes used by clinicians for magnesium and stress/sleep context.",
    "LAB_ZINC": "A marker sometimes used by clinicians for nutrient reserve context.",
}


def _get_pattern_rank(p: Any) -> tuple:
    """Rank pattern by confidence then strength for selection order."""
    if isinstance(p, dict):
        conf = float(p.get("confidence") or p.get("support") or 0)
        strength = float(p.get("strength") or 0)
    else:
        conf = float(getattr(p, "confidence", 0) or getattr(p, "support", 0))
        strength = float(getattr(p, "strength", 0) or 0)
    return (conf, strength)


def _pattern_id(p: Any) -> str | None:
    """Extract pattern_id from raw pattern."""
    if isinstance(p, dict):
        out = p.get("pattern_id") or p.get("id")
    else:
        out = getattr(p, "pattern_id", None) or getattr(p, "id", None)
    return str(out).strip() if out else None


def build_lab_awareness_cards(patterns: List[Any]) -> List[LabAwarenessCardVM]:
    """
    Build up to MAX_LAB_CARDS lab awareness cards from top supported patterns.

    - Selects labs linked to the top supported surfaced patterns.
    - Prefer pattern relevance (order by pattern confidence/strength).
    - No value interpretation; descriptions from LAB_EXPLANATIONS only.
    - Uses dictionary title and short_label for display.
    """
    seen_labs: set[str] = set()
    result: List[LabAwarenessCardVM] = []
    # Sort patterns by relevance (confidence, strength) descending
    sorted_patterns = sorted(
        (p for p in (patterns or []) if _pattern_id(p) in PATTERN_TO_LABS),
        key=_get_pattern_rank,
        reverse=True,
    )
    for p in sorted_patterns:
        if len(result) >= MAX_LAB_CARDS:
            break
        pid = _pattern_id(p)
        if not pid:
            continue
        lab_ids = PATTERN_TO_LABS.get(pid) or []
        for lab_id in lab_ids:
            if len(result) >= MAX_LAB_CARDS:
                break
            if lab_id in seen_labs:
                continue
            explanation = LAB_EXPLANATIONS.get(lab_id)
            if not explanation:
                continue
            if len(explanation) > EXPLANATION_MAX_LEN:
                explanation = explanation[:EXPLANATION_MAX_LEN].rsplit(" ", 1)[0]
            try:
                resolved = resolve_lab(lab_id)
                title = resolved["display_title"]
                short_label = resolved["short_label"]
            except Exception:
                continue
            seen_labs.add(lab_id)
            result.append(
                LabAwarenessCardVM(
                    title=title,
                    short_label=short_label,
                    description=explanation,
                )
            )
    return result

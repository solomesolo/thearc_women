"""
Lens card translator: primary lens -> clean orientation statement (LensCardVM).

Uses approved lens explanation templates only. No freeform synthesis.
Missing config (unknown lens_id) hard-fails. No dominant lens -> LENS_BASELINE.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import LensCardVM
from client_output.display_resolver import resolve_lens, DisplayDictionaryError


# ---------------------------------------------------------------------------
# Length limits (enforced for headline and description)
# ---------------------------------------------------------------------------

HEADLINE_MAX_LEN = 90
DESCRIPTION_MAX_LEN = 150

# Canonical fallback when no dominant lens is selected
BASELINE_LENS_ID = "LENS_BASELINE"


# ---------------------------------------------------------------------------
# Approved lens explanation table (headline, description, focus_area)
# ---------------------------------------------------------------------------

LENS_EXPLANATIONS: dict[str, dict[str, str]] = {
    "LENS_STRESS_RECOVERY": {
        "headline": "Your signals suggest a focus on stress and recovery balance.",
        "description": "Several signals relate to stress load sleep and recovery capacity across recent responses.",
        "focus_area": "Stress & recovery",
    },
    "LENS_ENERGY_METABOLIC": {
        "headline": "Your signals suggest patterns related to energy regulation.",
        "description": "Signals linked to energy stability meal timing and metabolic balance appear most prominent.",
        "focus_area": "Energy & metabolic",
    },
    "LENS_HORMONAL_RHYTHM": {
        "headline": "Your signals suggest patterns related to hormonal rhythm.",
        "description": "Signals connected to menstrual timing cycle symptoms and hormonal variability appear most relevant.",
        "focus_area": "Hormonal rhythm",
    },
    "LENS_GUT_ABSORPTION": {
        "headline": "Your signals suggest a focus on digestion and gut comfort.",
        "description": "Several signals relate to digestion bowel patterns and nutrient absorption context.",
        "focus_area": "Gut & absorption",
    },
    "LENS_NUTRIENT_RESERVES": {
        "headline": "Your signals suggest a focus on nutrient reserves and vitality.",
        "description": "Signals related to nutrient support energy and physical resilience appear most relevant.",
        "focus_area": "Nutrient reserves",
    },
    "LENS_BASELINE": {
        "headline": "Your signals currently suggest a balanced baseline overview.",
        "description": "No single system strongly dominates your signals right now so the dashboard shows a general overview.",
        "focus_area": "Baseline",
    },
}


class LensConfigError(LookupError):
    """Raised when a lens_id has no approved explanation (missing configuration)."""

    def __init__(self, lens_id: str) -> None:
        self.lens_id = lens_id
        super().__init__(f"Lens card: no approved explanation for lens {lens_id!r}")


def _get_primary_lens_id(engine_output: dict[str, Any]) -> str:
    """Extract primary lens ID from engine output; return LENS_BASELINE if missing/null."""
    lens_id = None
    if "primary_lens" in engine_output:
        lens_id = engine_output.get("primary_lens")
    if lens_id is None and "lens_id" in engine_output:
        lens_id = engine_output.get("lens_id")
    if lens_id is None and "lens" in engine_output:
        lens = engine_output.get("lens")
        if isinstance(lens, dict):
            lens_id = lens.get("lens_id") or lens.get("id")
    if lens_id is None or (isinstance(lens_id, str) and not lens_id.strip()):
        return BASELINE_LENS_ID
    return str(lens_id).strip()


def build_lens_card(engine_output: dict[str, Any]) -> LensCardVM:
    """
    Build the primary lens card from engine output.

    - Uses display dictionary for title (resolve_lens).
    - Uses lens explanation table for headline, description, focus_area.
    - If no dominant lens is selected, uses LENS_BASELINE.
    - Raises DisplayDictionaryError if lens_id not in display dictionary.
    - Raises LensConfigError if lens_id not in approved explanation table.
    - Does not synthesize freeform copy.
    """
    lens_id = _get_primary_lens_id(engine_output)

    if lens_id not in LENS_EXPLANATIONS:
        raise LensConfigError(lens_id)

    title_resolved = resolve_lens(lens_id)
    title = title_resolved["display_title"]

    explanation = LENS_EXPLANATIONS[lens_id]
    headline = explanation["headline"]
    description = explanation["description"]
    focus_area = explanation.get("focus_area")

    if len(headline) > HEADLINE_MAX_LEN:
        raise ValueError(
            f"Lens card: headline for {lens_id} exceeds {HEADLINE_MAX_LEN} chars (got {len(headline)})"
        )
    if len(description) > DESCRIPTION_MAX_LEN:
        raise ValueError(
            f"Lens card: description for {lens_id} exceeds {DESCRIPTION_MAX_LEN} chars (got {len(description)})"
        )

    return LensCardVM(
        title=title,
        headline=headline,
        description=description,
        focus_area=focus_area,
    )

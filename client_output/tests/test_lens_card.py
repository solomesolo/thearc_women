"""
Tests for the lens card translator.

- Lens mapping: one test per supported lens.
- Baseline fallback: if lens missing/null, returns LENS_BASELINE wording.
- Length: headline <= 90, description <= 150.
- Snapshot: card output for each lens matches expected copy.
"""

from __future__ import annotations

import pytest

from client_output.lens_card import (
    build_lens_card,
    LensConfigError,
    LENS_EXPLANATIONS,
    BASELINE_LENS_ID,
    HEADLINE_MAX_LEN,
    DESCRIPTION_MAX_LEN,
)
from client_output.contracts import LensCardVM


SUPPORTED_LENS_IDS = [
    "LENS_STRESS_RECOVERY",
    "LENS_ENERGY_METABOLIC",
    "LENS_HORMONAL_RHYTHM",
    "LENS_GUT_ABSORPTION",
    "LENS_NUTRIENT_RESERVES",
    "LENS_BASELINE",
]


# ---------------------------------------------------------------------------
# Lens mapping: one test per supported lens
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("lens_id", SUPPORTED_LENS_IDS)
def test_lens_mapping_returns_lens_card_vm(lens_id: str):
    engine_output = {"primary_lens": lens_id}
    card = build_lens_card(engine_output)
    assert isinstance(card, LensCardVM)
    assert card.title
    assert card.headline
    assert card.description
    assert card.headline == LENS_EXPLANATIONS[lens_id]["headline"]
    assert card.description == LENS_EXPLANATIONS[lens_id]["description"]


# ---------------------------------------------------------------------------
# Baseline fallback: if lens missing/null, returns LENS_BASELINE wording
# ---------------------------------------------------------------------------

def test_baseline_fallback_when_primary_lens_missing():
    card = build_lens_card({})
    assert card.headline == LENS_EXPLANATIONS[BASELINE_LENS_ID]["headline"]
    assert card.description == LENS_EXPLANATIONS[BASELINE_LENS_ID]["description"]
    assert card.title == "Baseline Overview"


def test_baseline_fallback_when_primary_lens_none():
    card = build_lens_card({"primary_lens": None})
    assert card.headline == LENS_EXPLANATIONS[BASELINE_LENS_ID]["headline"]


def test_baseline_fallback_when_primary_lens_empty_string():
    card = build_lens_card({"primary_lens": "   "})
    assert card.headline == LENS_EXPLANATIONS[BASELINE_LENS_ID]["headline"]


def test_lens_id_key_also_used():
    card = build_lens_card({"lens_id": "LENS_BASELINE"})
    assert card.headline == LENS_EXPLANATIONS[BASELINE_LENS_ID]["headline"]


# ---------------------------------------------------------------------------
# Length tests: headline <= 90, description <= 150
# ---------------------------------------------------------------------------

def test_all_headlines_within_length():
    for lens_id, data in LENS_EXPLANATIONS.items():
        headline = data["headline"]
        assert len(headline) <= HEADLINE_MAX_LEN, (
            f"{lens_id}: headline length {len(headline)} > {HEADLINE_MAX_LEN}"
        )


def test_all_descriptions_within_length():
    for lens_id, data in LENS_EXPLANATIONS.items():
        description = data["description"]
        assert len(description) <= DESCRIPTION_MAX_LEN, (
            f"{lens_id}: description length {len(description)} > {DESCRIPTION_MAX_LEN}"
        )


# ---------------------------------------------------------------------------
# Snapshot tests: card output for each lens
# ---------------------------------------------------------------------------

def _snapshot_card(lens_id: str) -> dict:
    card = build_lens_card({"primary_lens": lens_id})
    return card.model_dump()


def test_snapshot_stress_recovery():
    out = _snapshot_card("LENS_STRESS_RECOVERY")
    assert out["title"] == "Stress & Recovery Regulation"
    assert out["headline"] == "Your signals suggest a focus on stress and recovery balance."
    assert out["description"] == "Several signals relate to stress load sleep and recovery capacity across recent responses."
    assert out.get("focus_area") == "Stress & recovery"


def test_snapshot_energy_metabolic():
    out = _snapshot_card("LENS_ENERGY_METABOLIC")
    assert out["title"] == "Energy & Metabolic Stability"
    assert out["headline"] == "Your signals suggest patterns related to energy regulation."
    assert out["description"] == "Signals linked to energy stability meal timing and metabolic balance appear most prominent."


def test_snapshot_hormonal_rhythm():
    out = _snapshot_card("LENS_HORMONAL_RHYTHM")
    assert out["title"] == "Hormonal Rhythm Signals"
    assert out["headline"] == "Your signals suggest patterns related to hormonal rhythm."
    assert out["description"] == "Signals connected to menstrual timing cycle symptoms and hormonal variability appear most relevant."


def test_snapshot_gut_absorption():
    out = _snapshot_card("LENS_GUT_ABSORPTION")
    assert out["title"] == "Gut Comfort & Absorption"
    assert out["headline"] == "Your signals suggest a focus on digestion and gut comfort."
    assert out["description"] == "Several signals relate to digestion bowel patterns and nutrient absorption context."


def test_snapshot_nutrient_reserves():
    out = _snapshot_card("LENS_NUTRIENT_RESERVES")
    assert out["title"] == "Nutrient Reserves & Vitality"
    assert out["headline"] == "Your signals suggest a focus on nutrient reserves and vitality."
    assert out["description"] == "Signals related to nutrient support energy and physical resilience appear most relevant."


def test_snapshot_baseline():
    out = _snapshot_card("LENS_BASELINE")
    assert out["title"] == "Baseline Overview"
    assert out["headline"] == "Your signals currently suggest a balanced baseline overview."
    assert out["description"] == "No single system strongly dominates your signals right now so the dashboard shows a general overview."


# ---------------------------------------------------------------------------
# Hard-fail on missing config (unknown lens_id)
# ---------------------------------------------------------------------------

def test_unknown_lens_raises_lens_config_error():
    with pytest.raises(LensConfigError) as exc_info:
        build_lens_card({"primary_lens": "LENS_UNKNOWN"})
    assert exc_info.value.lens_id == "LENS_UNKNOWN"

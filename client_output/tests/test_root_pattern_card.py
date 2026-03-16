"""
Tests for the root pattern card translator.

- Per-pattern lookup: every known root pattern resolves to all four required fields.
- Evidence-label presence: every card has non-empty evidence_label.
- Caution-note presence: every card has non-empty caution_note.
- Language safety: summary, expanded_explanation, caution_note pass validator.
- Snapshot: representative outputs for blood sugar, iron depletion, thyroid slowing, perimenopause transition.
"""

from __future__ import annotations

import pytest

from client_output.root_pattern_card import (
    build_root_pattern_card,
    ROOT_PATTERN_EXPLANATIONS,
    RootPatternConfigError,
)
from client_output.contracts import RootPatternCardVM
from client_output.language_safety import validate_text


# All known root pattern IDs (must match display dictionary and explanation library)
KNOWN_PATTERN_IDS = list(ROOT_PATTERN_EXPLANATIONS.keys())


# ---------------------------------------------------------------------------
# Per-pattern lookup: every known root pattern resolves to all four required fields
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("pattern_id", KNOWN_PATTERN_IDS)
def test_per_pattern_lookup_resolves_all_four_fields(pattern_id: str):
    pattern = {"pattern_id": pattern_id}
    card = build_root_pattern_card(pattern)
    assert isinstance(card, RootPatternCardVM)
    assert card.summary, f"{pattern_id}: missing summary"
    assert card.expanded_explanation, f"{pattern_id}: missing expanded_explanation"
    assert card.evidence_label, f"{pattern_id}: missing evidence_label"
    assert card.caution_note, f"{pattern_id}: missing caution_note"
    assert card.title
    assert card.short_label
    assert card.confidence_label
    assert card.confidence_text


# ---------------------------------------------------------------------------
# Evidence-label presence: every card has non-empty evidence_label
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("pattern_id", KNOWN_PATTERN_IDS)
def test_evidence_label_presence(pattern_id: str):
    card = build_root_pattern_card({"pattern_id": pattern_id})
    assert card.evidence_label and card.evidence_label.strip()


# ---------------------------------------------------------------------------
# Caution-note presence: every card has non-empty caution_note
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("pattern_id", KNOWN_PATTERN_IDS)
def test_caution_note_presence(pattern_id: str):
    card = build_root_pattern_card({"pattern_id": pattern_id})
    assert card.caution_note and card.caution_note.strip()


# ---------------------------------------------------------------------------
# Language safety: summary, expanded_explanation, caution_note pass validator
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("pattern_id", KNOWN_PATTERN_IDS)
def test_summary_passes_language_safety(pattern_id: str):
    """Summary must pass language safety (forbidden phrases only; short copy may lack qualifiers)."""
    card = build_root_pattern_card({"pattern_id": pattern_id})
    validate_text(card.summary, "dashboard")


@pytest.mark.parametrize("pattern_id", KNOWN_PATTERN_IDS)
def test_expanded_explanation_passes_language_safety(pattern_id: str):
    card = build_root_pattern_card({"pattern_id": pattern_id})
    validate_text(card.expanded_explanation, "interpretive")


@pytest.mark.parametrize("pattern_id", KNOWN_PATTERN_IDS)
def test_caution_note_passes_language_safety(pattern_id: str):
    card = build_root_pattern_card({"pattern_id": pattern_id})
    validate_text(card.caution_note, "dashboard")


# ---------------------------------------------------------------------------
# Snapshot tests: blood sugar, iron depletion, thyroid slowing, perimenopause transition
# ---------------------------------------------------------------------------

def test_snapshot_blood_sugar():
    card = build_root_pattern_card({"pattern_id": "RP_BLOOD_SUGAR"})
    out = card.model_dump()
    assert out["title"] == "Blood Sugar Regulation Pattern"
    assert out["short_label"] == "Blood sugar"
    assert out["summary"] == "Signals linked to blood sugar variability"
    assert "blood sugar" in out["expanded_explanation"].lower() or "variability" in out["expanded_explanation"].lower()
    assert out["evidence_label"] == "High evidence"
    assert "educational" in out["caution_note"].lower() or "clinical" in out["caution_note"].lower()


def test_snapshot_iron_depletion():
    card = build_root_pattern_card({"pattern_id": "RP_IRON_DEPLETION"})
    out = card.model_dump()
    assert out["title"] == "Iron Reserve Pattern"
    assert out["short_label"] == "Iron reserve"
    assert out["summary"] == "Signals consistent with reduced iron reserves"
    assert "laboratory testing" in out["caution_note"].lower() or "iron status" in out["caution_note"].lower()


def test_snapshot_thyroid_slowing():
    card = build_root_pattern_card({"pattern_id": "RP_THYROID_SLOWING"})
    out = card.model_dump()
    assert out["title"] == "Thyroid Regulation Pattern"
    assert out["short_label"] == "Thyroid"
    assert "do not diagnose" in out["caution_note"].lower() or "thyroid" in out["caution_note"].lower()
    assert "clinical" in out["caution_note"].lower() or "lab" in out["caution_note"].lower()


def test_snapshot_perimenopause_transition():
    card = build_root_pattern_card({"pattern_id": "RP_PERI_TRANSITION"})
    out = card.model_dump()
    assert out["title"] == "Perimenopause Transition Pattern"
    assert out["short_label"] == "Perimenopause"
    assert out["summary"] == "Signals consistent with perimenopause transition pattern"
    assert "life stage" in out["caution_note"].lower()
    assert "clinician" in out["caution_note"].lower() or "discussing" in out["caution_note"].lower()


# ---------------------------------------------------------------------------
# Unknown pattern raises
# ---------------------------------------------------------------------------

def test_unknown_pattern_raises_config_error():
    with pytest.raises(RootPatternConfigError) as exc_info:
        build_root_pattern_card({"pattern_id": "RP_UNKNOWN"})
    assert exc_info.value.pattern_id == "RP_UNKNOWN"


def test_missing_pattern_id_raises():
    with pytest.raises(RootPatternConfigError):
        build_root_pattern_card({"title": "Some pattern"})

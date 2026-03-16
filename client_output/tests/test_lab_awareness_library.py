"""
Tests for the lab awareness library and build_lab_awareness_cards.

- Pattern-to-lab mapping: RP_IRON_DEPLETION includes ferritin; RP_THYROID_SLOWING includes TSH/FT4; RP_BLOOD_SUGAR includes glucose markers.
- No value interpretation: output strings do not contain high, low, normal, abnormal, deficient, elevated.
- Forbidden phrases: no lab card contains diagnoses, confirms, rules out.
- Length: explanations <= 120 chars.
- Snapshot: thyroid and iron fixtures produce correct educational cards.
"""

from __future__ import annotations

import re

import pytest

from client_output.contracts import LabAwarenessCardVM
from client_output.lab_awareness_library import (
    PATTERN_TO_LABS,
    LAB_EXPLANATIONS,
    build_lab_awareness_cards,
    EXPLANATION_MAX_LEN,
    MAX_LAB_CARDS,
)


# ---------------------------------------------------------------------------
# Pattern-to-lab mapping tests
# ---------------------------------------------------------------------------

def test_rp_iron_depletion_includes_ferritin():
    """RP_IRON_DEPLETION surfaces ferritin."""
    patterns = [{"pattern_id": "RP_IRON_DEPLETION", "confidence": 70}]
    cards = build_lab_awareness_cards(patterns)
    titles = [c.title for c in cards]
    assert "Ferritin" in titles


def test_rp_thyroid_slowing_includes_tsh_and_ft4():
    """RP_THYROID_SLOWING surfaces TSH and Free T4."""
    patterns = [{"pattern_id": "RP_THYROID_SLOWING", "confidence": 70}]
    cards = build_lab_awareness_cards(patterns)
    titles = [c.title for c in cards]
    assert "TSH" in titles
    assert "Free T4" in titles


def test_rp_blood_sugar_includes_glucose_markers():
    """RP_BLOOD_SUGAR surfaces glucose-related markers."""
    patterns = [{"pattern_id": "RP_BLOOD_SUGAR", "confidence": 70}]
    cards = build_lab_awareness_cards(patterns)
    titles = [c.title for c in cards]
    assert any("Glucose" in t or "HbA1c" in t or "Insulin" in t for t in titles)
    assert "Fasting Glucose" in titles or "HbA1c" in titles


def test_rp_micro_depletion_includes_b12_folate_vitd():
    """RP_MICRO_DEPLETION surfaces B12, folate, vitamin D."""
    patterns = [{"pattern_id": "RP_MICRO_DEPLETION", "confidence": 70}]
    cards = build_lab_awareness_cards(patterns)
    titles = [c.title for c in cards]
    assert "Vitamin B12" in titles
    assert "Folate" in titles
    assert "Vitamin D" in titles


# ---------------------------------------------------------------------------
# No value interpretation test
# ---------------------------------------------------------------------------

VALUE_INTERPRETATION_WORDS = re.compile(
    r"\b(high|low|normal|abnormal|deficient|elevated)\b",
    re.IGNORECASE,
)


def test_no_value_interpretation_in_explanations():
    """Output strings do not contain high, low, normal, abnormal, deficient, elevated."""
    for lab_id, explanation in LAB_EXPLANATIONS.items():
        assert not VALUE_INTERPRETATION_WORDS.search(explanation), (
            f"{lab_id}: explanation contains value interpretation: {explanation!r}"
        )


def test_built_cards_no_value_interpretation():
    """Built lab cards do not contain value interpretation in title/short_label/description."""
    patterns = [
        {"pattern_id": "RP_IRON_DEPLETION", "confidence": 80},
        {"pattern_id": "RP_THYROID_SLOWING", "confidence": 75},
        {"pattern_id": "RP_BLOOD_SUGAR", "confidence": 70},
    ]
    cards = build_lab_awareness_cards(patterns)
    for c in cards:
        for field in (c.title, c.short_label, c.description):
            assert not VALUE_INTERPRETATION_WORDS.search(field), (
                f"Card {c.title}: value interpretation in {field!r}"
            )


# ---------------------------------------------------------------------------
# Forbidden-phrase test
# ---------------------------------------------------------------------------

FORBIDDEN_PHRASES = re.compile(
    r"\b(diagnoses?|confirms?|rules out)\b",
    re.IGNORECASE,
)


def test_no_forbidden_phrases_in_lab_explanations():
    """No lab explanation contains diagnoses, confirms, rules out."""
    for lab_id, explanation in LAB_EXPLANATIONS.items():
        assert not FORBIDDEN_PHRASES.search(explanation), (
            f"{lab_id}: forbidden phrase in explanation: {explanation!r}"
        )


def test_built_cards_no_forbidden_phrases():
    """No lab card contains diagnoses, confirms, rules out."""
    patterns = [
        {"pattern_id": "RP_IRON_DEPLETION", "confidence": 80},
        {"pattern_id": "RP_THYROID_SLOWING", "confidence": 80},
    ]
    cards = build_lab_awareness_cards(patterns)
    for c in cards:
        for field in (c.title, c.short_label, c.description):
            assert not FORBIDDEN_PHRASES.search(field), (
                f"Card {c.title}: forbidden phrase in {field!r}"
            )


# ---------------------------------------------------------------------------
# Length test
# ---------------------------------------------------------------------------

def test_all_explanations_within_length():
    """All LAB_EXPLANATIONS entries <= 120 chars."""
    for lab_id, explanation in LAB_EXPLANATIONS.items():
        assert len(explanation) <= EXPLANATION_MAX_LEN, (
            f"{lab_id}: explanation length {len(explanation)} > {EXPLANATION_MAX_LEN}"
        )


def test_built_cards_description_length():
    """Built cards have description <= 120 chars."""
    patterns = [
        {"pattern_id": "RP_MICRO_DEPLETION", "confidence": 70},
    ]
    cards = build_lab_awareness_cards(patterns)
    for c in cards:
        assert len(c.description) <= EXPLANATION_MAX_LEN, (
            f"{c.title}: description length {len(c.description)} > {EXPLANATION_MAX_LEN}"
        )


# ---------------------------------------------------------------------------
# Snapshot: thyroid and iron fixtures
# ---------------------------------------------------------------------------

def test_snapshot_thyroid_produces_educational_cards():
    """Thyroid pattern produces TSH and Free T4 educational cards."""
    patterns = [{"pattern_id": "RP_THYROID_SLOWING", "confidence": 75}]
    cards = build_lab_awareness_cards(patterns)
    assert len(cards) == 2
    titles = {c.title for c in cards}
    assert "TSH" in titles
    assert "Free T4" in titles
    for c in cards:
        assert isinstance(c, LabAwarenessCardVM)
        assert c.title and c.short_label and c.description
        assert "markers commonly used by clinicians" in c.description or "clinician" in c.description.lower()


def test_snapshot_iron_produces_educational_cards():
    """Iron pattern produces Ferritin educational card."""
    patterns = [{"pattern_id": "RP_IRON_DEPLETION", "confidence": 70}]
    cards = build_lab_awareness_cards(patterns)
    assert len(cards) == 1
    assert cards[0].title == "Ferritin"
    assert cards[0].short_label == "Ferritin"
    assert "markers commonly used" in cards[0].description or "clinician" in cards[0].description.lower()
    assert "iron" in cards[0].description.lower()


def test_snapshot_thyroid_and_iron_together():
    """Thyroid and iron patterns together produce correct set of cards."""
    patterns = [
        {"pattern_id": "RP_THYROID_SLOWING", "confidence": 80},
        {"pattern_id": "RP_IRON_DEPLETION", "confidence": 75},
    ]
    cards = build_lab_awareness_cards(patterns)
    titles = [c.title for c in cards]
    assert "TSH" in titles
    assert "Free T4" in titles
    assert "Ferritin" in titles
    assert len(cards) == 3


# ---------------------------------------------------------------------------
# Cap and ordering
# ---------------------------------------------------------------------------

def test_max_lab_cards_cap():
    """At most MAX_LAB_CARDS (5) cards returned."""
    patterns = [
        {"pattern_id": "RP_MICRO_DEPLETION", "confidence": 90},
        {"pattern_id": "RP_BLOOD_SUGAR", "confidence": 85},
        {"pattern_id": "RP_THYROID_SLOWING", "confidence": 80},
    ]
    cards = build_lab_awareness_cards(patterns)
    assert len(cards) <= MAX_LAB_CARDS


def test_pattern_relevance_ordering():
    """Higher-confidence pattern's labs appear first."""
    patterns = [
        {"pattern_id": "RP_IRON_DEPLETION", "confidence": 50},
        {"pattern_id": "RP_THYROID_SLOWING", "confidence": 90},
    ]
    cards = build_lab_awareness_cards(patterns)
    # Thyroid (90) before iron (50): first cards should be TSH, Free T4
    assert len(cards) >= 2
    assert cards[0].title in ("TSH", "Free T4")
    assert cards[1].title in ("TSH", "Free T4")


def test_serialized_no_raw_lab_id():
    """Serialized cards do not expose raw lab_id."""
    patterns = [{"pattern_id": "RP_THYROID_SLOWING", "confidence": 70}]
    cards = build_lab_awareness_cards(patterns)
    for c in cards:
        dumped = c.model_dump()
        assert "lab_id" not in dumped

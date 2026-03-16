"""
Tests for confidence-band translation.

- Boundary tests: 0, 39 -> Low; 40, 64 -> Moderate; 65, 84 -> Strong; 85, 100 -> Very strong.
- Message text: exact user text for all four bands.
- No raw float in serialized dashboard output.
- Diagnostic-language: confidence text must not contain forbidden words.
"""

from __future__ import annotations

import json
import re
import pytest

from client_output.confidence import (
    ConfidenceBand,
    map_confidence,
    map_confidence_optional,
    LOW_SIGNAL_TEXT,
    MODERATE_SUPPORT_TEXT,
    STRONG_SUPPORT_TEXT,
    VERY_STRONG_SUPPORT_TEXT,
)
from client_output.translator import build_dashboard_view


# Forbidden words that must not appear in confidence text (diagnostic language)
FORBIDDEN_WORDS = ("confirmed", "proven", "indicates", "definitely")

# Patterns that would indicate raw numeric confidence in output
RAW_CONFIDENCE_PATTERNS = [
    re.compile(r"\d+\.\d+%"),   # e.g. 35.7%
    re.compile(r"\b\d+\.\d{2,}\b"),  # e.g. 82.33 (raw decimal)
]


# ---------------------------------------------------------------------------
# Boundary tests
# ---------------------------------------------------------------------------

def test_0_low_signal():
    band = map_confidence(0)
    assert band.confidence_label == "Low signal"


def test_39_low_signal():
    band = map_confidence(39)
    assert band.confidence_label == "Low signal"


def test_40_moderate_support():
    band = map_confidence(40)
    assert band.confidence_label == "Moderate support"


def test_64_moderate_support():
    band = map_confidence(64)
    assert band.confidence_label == "Moderate support"


def test_65_strong_support():
    band = map_confidence(65)
    assert band.confidence_label == "Strong support"


def test_84_strong_support():
    band = map_confidence(84)
    assert band.confidence_label == "Strong support"


def test_85_very_strong_support():
    band = map_confidence(85)
    assert band.confidence_label == "Very strong support"


def test_100_very_strong_support():
    band = map_confidence(100)
    assert band.confidence_label == "Very strong support"


def test_clamp_above_100_very_strong():
    band = map_confidence(150)
    assert band.confidence_label == "Very strong support"


def test_clamp_below_0_low_signal():
    band = map_confidence(-10)
    assert band.confidence_label == "Low signal"


def test_0_to_1_scale_normalized():
    band = map_confidence(0.65)
    assert band.confidence_label == "Strong support"


# ---------------------------------------------------------------------------
# Message text tests: exact user text for all four bands
# ---------------------------------------------------------------------------

def test_low_signal_exact_text():
    band = map_confidence(0)
    assert band.confidence_text == LOW_SIGNAL_TEXT
    assert band.confidence_text == (
        "A small number of signals suggest this pattern, but the evidence is limited."
    )


def test_moderate_support_exact_text():
    band = map_confidence(50)
    assert band.confidence_text == MODERATE_SUPPORT_TEXT
    assert band.confidence_text == (
        "Several signals align with this pattern, though additional context may help clarify it."
    )


def test_strong_support_exact_text():
    band = map_confidence(70)
    assert band.confidence_text == STRONG_SUPPORT_TEXT
    assert band.confidence_text == (
        "Multiple signals consistently align with this pattern across your responses."
    )


def test_very_strong_support_exact_text():
    band = map_confidence(90)
    assert band.confidence_text == VERY_STRONG_SUPPORT_TEXT
    assert band.confidence_text == (
        "Signals strongly align with this pattern, suggesting a consistent signal pattern in your data."
    )


# ---------------------------------------------------------------------------
# No raw float display: serialized dashboard output must not contain raw numbers
# ---------------------------------------------------------------------------

def test_serialized_dashboard_contains_no_raw_confidence():
    raw_engine_output = {
        "lenses": [],
        "systems": [],
        "root_patterns": [
            {
                "title": "P",
                "summary": "S",
                "expanded_explanation": "E",
                "evidence_label": "Ev",
                "caution_note": "N",
                "confidence": 0.357202,
            },
        ],
        "clusters": [
            {
                "title": "C",
                "summary": "S",
                "typical_signals": [],
                "confidence": 82.33,
            },
        ],
        "watch_items": [],
        "lab_awareness": [],
        "recommendations": [],
        "preventive_strategies": [],
        "weekly_insights": [],
    }
    result = build_dashboard_view(raw_engine_output)
    output_str = json.dumps(result)
    for pattern in RAW_CONFIDENCE_PATTERNS:
        matches = pattern.findall(output_str)
        assert matches == [], (
            f"Serialized dashboard must not contain raw confidence; {pattern.pattern} matched: {matches}"
        )


# ---------------------------------------------------------------------------
# Diagnostic-language test: confidence text must not contain forbidden words
# ---------------------------------------------------------------------------

def test_confidence_text_no_forbidden_words():
    for score in [0, 39, 50, 65, 85, 100]:
        band = map_confidence(score)
        text_lower = band.confidence_text.lower()
        for word in FORBIDDEN_WORDS:
            assert word not in text_lower, (
                f"Confidence text must not contain diagnostic language {word!r}; got: {band.confidence_text}"
            )


def test_all_four_band_texts_no_forbidden_words():
    texts = [LOW_SIGNAL_TEXT, MODERATE_SUPPORT_TEXT, STRONG_SUPPORT_TEXT, VERY_STRONG_SUPPORT_TEXT]
    for text in texts:
        text_lower = text.lower()
        for word in FORBIDDEN_WORDS:
            assert word not in text_lower, f"Band text must not contain {word!r}: {text}"

"""
Tests for the canonical display dictionary resolver.

- Coverage: all known canonical IDs resolve successfully.
- Missing entry: resolve_pattern("RP_UNKNOWN") raises deterministic exception.
- Length constraints: every display_title <= 40, every short_label <= 20.
- No raw ID leakage: full dashboard output contains no raw engine ID substrings.
"""

from __future__ import annotations

import json
import re
import pytest

from client_output.display_resolver import (
    DisplayDictionaryError,
    resolve_cluster,
    resolve_system,
    resolve_pattern,
    resolve_lab,
    resolve_lens,
    resolve_message_type,
    get_all_ids,
    get_all_entries,
    DISPLAY_TITLE_MAX_LEN,
    SHORT_LABEL_MAX_LEN,
)
from client_output.translator import build_dashboard_view


# ---------------------------------------------------------------------------
# Canonical IDs from CMO docs (fixtures for coverage test)
# ---------------------------------------------------------------------------

CLUSTER_IDS = [
    "CL_ENERGY_VAR",
    "CL_STRESS_ACCUM",
    "CL_SLEEP_DISRUPT",
    "CL_CYCLE_VAR",
    "CL_SUGAR_INSTAB",
    "CL_IRON_PATTERN",
    "CL_THYROID_SIGNALS",
    "CL_TRAIN_MISMATCH",
    "CL_GUT_PATTERN",
    "CL_INFLAM_LOAD",
]

SYSTEM_IDS = [
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

ROOT_PATTERN_IDS = [
    "RP_STRESS_LOAD",
    "RP_BLOOD_SUGAR",
    "RP_IRON_DEPLETION",
    "RP_THYROID_SLOWING",
    "RP_PROG_LOW",
    "RP_ESTRO_DOM",
    "RP_ANDRO_EXCESS",
    "RP_MICRO_DEPLETION",
    "RP_OVERTRAIN",
    "RP_SLEEP_DEPRIVATION",
    "RP_GUT_DYSBIOSIS",
    "RP_NERVOUS_DYS",
    "RP_INFLAM_CTX",
    "RP_VASOMOTOR_CTX",
    "RP_PERI_TRANSITION",
]

LENS_IDS = [
    "LENS_STRESS_RECOVERY",
    "LENS_ENERGY_METABOLIC",
    "LENS_HORMONAL_RHYTHM",
    "LENS_GUT_ABSORPTION",
    "LENS_NUTRIENT_RESERVES",
    "LENS_BASELINE",
]

MESSAGE_TYPE_IDS = [
    "MSG_INFO",
    "MSG_AWARENESS",
    "MSG_CLINICIAN",
    "MSG_URGENT",
]

# Regexes that must not appear in dashboard output (no raw ID leakage)
RAW_ID_PATTERNS = [
    re.compile(r"\bCL_[A-Z0-9_]+\b"),
    re.compile(r"\bRP_[A-Z0-9_]+\b"),
    re.compile(r"\bSYS_[A-Z0-9_]+\b"),
    re.compile(r"\bLENS_[A-Z0-9_]+\b"),
    re.compile(r"\bLAB_[A-Z0-9_]+\b"),
]


# ---------------------------------------------------------------------------
# Coverage test: all known canonical IDs resolve successfully
# ---------------------------------------------------------------------------

def test_all_cluster_ids_resolve():
    for entity_id in CLUSTER_IDS:
        entry = resolve_cluster(entity_id)
        assert "display_title" in entry
        assert "short_label" in entry
        assert isinstance(entry["display_title"], str)
        assert isinstance(entry["short_label"], str)


def test_all_system_ids_resolve():
    for entity_id in SYSTEM_IDS:
        entry = resolve_system(entity_id)
        assert "display_title" in entry
        assert "short_label" in entry


def test_all_root_pattern_ids_resolve():
    for entity_id in ROOT_PATTERN_IDS:
        entry = resolve_pattern(entity_id)
        assert "display_title" in entry
        assert "short_label" in entry


def test_all_lens_ids_resolve():
    for entity_id in LENS_IDS:
        entry = resolve_lens(entity_id)
        assert "display_title" in entry
        assert "short_label" in entry


def test_all_message_type_ids_resolve():
    for entity_id in MESSAGE_TYPE_IDS:
        entry = resolve_message_type(entity_id)
        assert "display_title" in entry
        assert "short_label" in entry


# ---------------------------------------------------------------------------
# Missing entry: resolve_pattern("RP_UNKNOWN") raises deterministic exception
# ---------------------------------------------------------------------------

def test_missing_pattern_raises_display_dictionary_error():
    with pytest.raises(DisplayDictionaryError) as exc_info:
        resolve_pattern("RP_UNKNOWN")
    assert exc_info.value.category == "root_patterns"
    assert exc_info.value.entity_id == "RP_UNKNOWN"


def test_missing_cluster_raises():
    with pytest.raises(DisplayDictionaryError) as exc_info:
        resolve_cluster("CL_UNKNOWN")
    assert exc_info.value.entity_id == "CL_UNKNOWN"


def test_missing_system_raises():
    with pytest.raises(DisplayDictionaryError):
        resolve_system("SYS_UNKNOWN")


def test_missing_lens_raises():
    with pytest.raises(DisplayDictionaryError):
        resolve_lens("LENS_UNKNOWN")


def test_missing_lab_raises():
    with pytest.raises(DisplayDictionaryError):
        resolve_lab("LAB_ANY")


# ---------------------------------------------------------------------------
# Length-constraint tests: every display_title <= 40, every short_label <= 20
# ---------------------------------------------------------------------------

def test_all_display_titles_within_length():
    for category in ("clusters", "systems", "root_patterns", "lenses", "safety_message_types"):
        for entity_id, entry in get_all_entries(category).items():
            title = entry.get("display_title", "")
            assert len(title) <= DISPLAY_TITLE_MAX_LEN, (
                f"{category}/{entity_id}: display_title length {len(title)} > {DISPLAY_TITLE_MAX_LEN}"
            )


def test_all_short_labels_within_length():
    for category in ("clusters", "systems", "root_patterns", "lenses", "safety_message_types"):
        for entity_id, entry in get_all_entries(category).items():
            label = entry.get("short_label", "")
            assert len(label) <= SHORT_LABEL_MAX_LEN, (
                f"{category}/{entity_id}: short_label length {len(label)} > {SHORT_LABEL_MAX_LEN}"
            )


# ---------------------------------------------------------------------------
# No raw ID leakage: traverse full dashboard output, assert no regex matches
# ---------------------------------------------------------------------------

def test_no_raw_id_leakage_in_dashboard_output():
    """Dashboard output must not contain raw engine ID substrings (CL_, RP_, SYS_, LENS_, LAB_)."""
    raw_engine_output = {
        "lenses": [{"lens_id": "LENS_BASELINE", "description": "Overview"}],
        "systems": [{"system_id": "SYS_HORMONAL", "summary": "Ok", "status_label": "Stable"}],
        "root_patterns": [
            {"pattern_id": "RP_STRESS_LOAD", "summary": "S", "expanded_explanation": "E", "evidence_label": "Ev", "caution_note": "N"},
        ],
        "clusters": [
            {"cluster_id": "CL_ENERGY_VAR", "summary": "Energy varies", "typical_signals": []},
        ],
        "watch_items": [],
        "lab_awareness": [],
        "recommendations": [],
        "preventive_strategies": [],
        "weekly_insights": [],
    }
    result = build_dashboard_view(raw_engine_output)
    # Serialize to string and assert no raw IDs appear
    output_str = json.dumps(result)
    for pattern in RAW_ID_PATTERNS:
        matches = pattern.findall(output_str)
        assert matches == [], f"Raw ID leakage: {pattern.pattern} matched {matches} in dashboard output"

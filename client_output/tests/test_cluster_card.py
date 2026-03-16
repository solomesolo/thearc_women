"""
Tests for the cluster card translator.

- All cluster mappings: every known cluster has title, summary, typical_signals.
- Length: summary <= 120 chars.
- Tags normalization: split into trimmed list; no empty tags.
- No raw cluster IDs: serialized cards must not contain CL_.
- Snapshot: sleep, energy, sugar, gut.
"""

from __future__ import annotations

import json
import pytest

from client_output.cluster_card import (
    build_cluster_card,
    CLUSTER_EXPLANATIONS,
    SUMMARY_MAX_LEN,
    _normalize_typical_signals,
    ClusterConfigError,
)
from client_output.contracts import ClusterCardVM


KNOWN_CLUSTER_IDS = list(CLUSTER_EXPLANATIONS.keys())


# ---------------------------------------------------------------------------
# All cluster mappings: every known cluster has title, summary, typical_signals
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("cluster_id", KNOWN_CLUSTER_IDS)
def test_cluster_mapping_has_title_summary_and_typical_signals(cluster_id: str):
    card = build_cluster_card({"cluster_id": cluster_id})
    assert isinstance(card, ClusterCardVM)
    assert card.title
    assert card.summary
    assert isinstance(card.typical_signals, list)
    assert card.confidence_label
    assert card.confidence_text


# ---------------------------------------------------------------------------
# Length: summary <= 120 chars
# ---------------------------------------------------------------------------

def test_all_summaries_within_length():
    for cluster_id, entry in CLUSTER_EXPLANATIONS.items():
        explanation = entry["explanation"]
        assert len(explanation) <= SUMMARY_MAX_LEN, (
            f"{cluster_id}: explanation length {len(explanation)} > {SUMMARY_MAX_LEN}"
        )


# ---------------------------------------------------------------------------
# Tags normalization: split into trimmed list; no empty tags
# ---------------------------------------------------------------------------

def test_normalize_typical_signals_trimmed_no_empty():
    assert _normalize_typical_signals([" a ", " b ", "  "]) == ["a", "b"]
    assert _normalize_typical_signals("x, y , z") == ["x", "y", "z"]
    assert _normalize_typical_signals([]) == []
    assert _normalize_typical_signals([""]) == []


def test_energy_var_has_expected_signal_tags():
    card = build_cluster_card({"cluster_id": "CL_ENERGY_VAR"})
    assert "fatigue" in card.typical_signals
    assert "morning exhaustion" in card.typical_signals
    assert "afternoon crash" in card.typical_signals
    assert "brain fog" in card.typical_signals


# ---------------------------------------------------------------------------
# No raw cluster IDs: serialized cards must not contain CL_
# ---------------------------------------------------------------------------

def test_serialized_cluster_cards_contain_no_raw_cluster_id():
    cards = [
        build_cluster_card({"cluster_id": cid})
        for cid in ["CL_ENERGY_VAR", "CL_SLEEP_DISRUPT", "CL_SUGAR_INSTAB", "CL_GUT_PATTERN"]
    ]
    for card in cards:
        dumped = card.model_dump()
        out_str = json.dumps(dumped)
        assert "CL_" not in out_str, f"Serialized card must not contain CL_: {out_str}"


# ---------------------------------------------------------------------------
# Snapshot: sleep, energy, sugar, gut
# ---------------------------------------------------------------------------

def test_snapshot_sleep():
    card = build_cluster_card({"cluster_id": "CL_SLEEP_DISRUPT"})
    out = card.model_dump()
    assert out["title"] == "Sleep Disruption"
    assert "sleep" in out["summary"].lower()
    assert "lighter" in out["summary"] or "shorter" in out["summary"] or "restorative" in out["summary"]
    assert "cluster_id" not in out


def test_snapshot_energy():
    card = build_cluster_card({"cluster_id": "CL_ENERGY_VAR"})
    out = card.model_dump()
    assert out["title"] == "Energy Variability"
    assert "energy" in out["summary"].lower() or "stamina" in out["summary"].lower()
    assert out["typical_signals"] == ["fatigue", "morning exhaustion", "afternoon crash", "brain fog"]


def test_snapshot_sugar():
    card = build_cluster_card({"cluster_id": "CL_SUGAR_INSTAB"})
    out = card.model_dump()
    assert out["title"] == "Blood Sugar Variability"
    assert "energy" in out["summary"].lower() or "hunger" in out["summary"].lower() or "meals" in out["summary"].lower()


def test_snapshot_gut():
    card = build_cluster_card({"cluster_id": "CL_GUT_PATTERN"})
    out = card.model_dump()
    assert out["title"] == "Gut Pattern Signals"
    assert "digestion" in out["summary"].lower() or "bowel" in out["summary"].lower()


# ---------------------------------------------------------------------------
# Unknown / missing cluster_id raises
# ---------------------------------------------------------------------------

def test_unknown_cluster_raises_config_error():
    with pytest.raises(ClusterConfigError) as exc_info:
        build_cluster_card({"cluster_id": "CL_UNKNOWN"})
    assert exc_info.value.cluster_id == "CL_UNKNOWN"


def test_missing_cluster_id_raises():
    with pytest.raises(ClusterConfigError):
        build_cluster_card({"title": "Some cluster"})

"""
Tests for recommendation selection from hierarchy.

- Hierarchy: lens recommendation is always first when present.
- Root pattern threshold: confidence 39 excluded, 40 included.
- Max 3: output never exceeds 3 recommendations.
- Fallback: if no strong signals, lens-only (or empty when baseline).
- Safety suppression: suppressed root pattern does not produce a recommendation.
- Language: reasons do not include fix, cure, treat, reverse.
- Snapshot: stress lens + stress root pattern + sleep cluster yields 3 ordered recommendations.
"""

from __future__ import annotations

import re

import pytest

from client_output.contracts import RecommendationVM
from client_output.recommendation_library import (
    build_recommendations,
    RECOMMENDATION_CONTENT,
    MAX_RECOMMENDATIONS,
    PATTERN_CONFIDENCE_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Hierarchy: lens first when present
# ---------------------------------------------------------------------------

def test_lens_recommendation_is_first_when_present():
    """Lens recommendation is always first when a non-baseline lens exists."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY", "primary_lens_score": 60},
        "root_patterns": [{"pattern_id": "RP_IRON_DEPLETION", "confidence": 80}],
        "clusters": [{"cluster_id": "CL_SLEEP_DISRUPT", "strength": 70, "confidence": 65}],
    }
    recs = build_recommendations(engine)
    assert len(recs) >= 1
    assert recs[0].content_tag == "stress_regulation"
    assert recs[0].priority == "high"


def test_baseline_lens_only_yields_no_lens_rec():
    """When only LENS_BASELINE is present, no lens recommendation is added."""
    engine = {
        "lens": {"primary_lens_id": "LENS_BASELINE", "primary_lens_score": 0},
        "root_patterns": [],
        "clusters": [],
    }
    recs = build_recommendations(engine)
    lens_tags = {"stress_regulation", "energy_stability", "cycle_health", "gut_health", "nutrient_support"}
    assert not any(r.content_tag in lens_tags for r in recs)


# ---------------------------------------------------------------------------
# Root pattern threshold: 39 excluded, 40 included
# ---------------------------------------------------------------------------

def test_pattern_confidence_39_excluded():
    """Root pattern with confidence 39 is excluded."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 39}],
        "clusters": [],
    }
    recs = build_recommendations(engine)
    assert len(recs) == 1  # only lens
    assert recs[0].content_tag == "stress_regulation"
    assert not any(r.content_tag == "stress_load_management" for r in recs)


def test_pattern_confidence_40_included():
    """Root pattern with confidence 40 is included."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 40}],
        "clusters": [],
    }
    recs = build_recommendations(engine)
    assert len(recs) >= 2
    tags = [r.content_tag for r in recs]
    assert "stress_regulation" in tags
    assert "stress_load_management" in tags


# ---------------------------------------------------------------------------
# Max 3 test
# ---------------------------------------------------------------------------

def test_max_three_recommendations():
    """Output never exceeds 3 recommendations."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [
            {"pattern_id": "RP_STRESS_LOAD", "confidence": 90},
            {"pattern_id": "RP_IRON_DEPLETION", "confidence": 85},
        ],
        "clusters": [
            {"cluster_id": "CL_SLEEP_DISRUPT", "strength": 80, "confidence": 75},
            {"cluster_id": "CL_ENERGY_VAR", "strength": 70, "confidence": 70},
        ],
        "systems": [{"system_id": "SYS_SLEEP", "score": 65}],
        "life_stage": "LS_PERI",
    }
    recs = build_recommendations(engine)
    assert len(recs) <= MAX_RECOMMENDATIONS
    assert len(recs) == 3


# ---------------------------------------------------------------------------
# Fallback: lens-only when signals sparse
# ---------------------------------------------------------------------------

def test_fallback_lens_only_when_no_strong_signals():
    """If no strong root pattern or cluster, output is lens-only (when lens is non-baseline)."""
    engine = {
        "lens": {"primary_lens_id": "LENS_ENERGY_METABOLIC"},
        "root_patterns": [],  # or below threshold
        "clusters": [],
    }
    recs = build_recommendations(engine)
    assert len(recs) == 1
    assert recs[0].content_tag == "energy_stability"


def test_fallback_empty_when_baseline_only():
    """When only baseline lens and no qualifying signals, output can be empty."""
    engine = {
        "lens": {"primary_lens_id": "LENS_BASELINE"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 30}],
        "clusters": [],
    }
    recs = build_recommendations(engine)
    assert len(recs) <= 1
    # Pattern below 40 so not included; no lens rec for baseline
    assert not any(r.content_tag == "stress_load_management" for r in recs)


# ---------------------------------------------------------------------------
# Safety suppression
# ---------------------------------------------------------------------------

def test_suppressed_root_pattern_excluded():
    """Suppressed root pattern does not produce a recommendation."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [
            {"pattern_id": "RP_STRESS_LOAD", "confidence": 80, "suppressed": True},
        ],
        "clusters": [],
    }
    recs = build_recommendations(engine)
    assert not any(r.content_tag == "stress_load_management" for r in recs)
    assert len(recs) == 1  # only lens


def test_suppressed_pattern_ids_list_excluded():
    """Patterns in suppressed_pattern_ids are excluded."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 80}],
        "suppressed_pattern_ids": ["RP_STRESS_LOAD"],
        "clusters": [],
    }
    recs = build_recommendations(engine)
    assert not any(r.content_tag == "stress_load_management" for r in recs)


def test_global_safety_override_suppresses_recommendations():
    """Global safety override suppresses non-essential recommendations."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 80}],
        "clusters": [{"cluster_id": "CL_SLEEP_DISRUPT", "strength": 70, "confidence": 65}],
        "safety_state": {"safety_override": True},
    }
    recs = build_recommendations(engine)
    assert recs == []


# ---------------------------------------------------------------------------
# Language: no fix, cure, treat, reverse
# ---------------------------------------------------------------------------

FORBIDDEN_VERBS = re.compile(
    r"\b(fix|cure|treat|reverse)\b",
    re.IGNORECASE,
)


def test_recommendation_reasons_no_fix_cure_treat_reverse():
    """Recommendation reasons do not include fix, cure, treat, reverse."""
    for content_tag, (title, reason) in RECOMMENDATION_CONTENT.items():
        assert not FORBIDDEN_VERBS.search(title), f"{content_tag}: title has forbidden verb"
        assert not FORBIDDEN_VERBS.search(reason), f"{content_tag}: reason has forbidden verb"


def test_built_recommendations_language_safe():
    """Built list has no fix/cure/treat/reverse in title or reason."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 70}],
        "clusters": [{"cluster_id": "CL_SLEEP_DISRUPT", "strength": 60, "confidence": 55}],
    }
    recs = build_recommendations(engine)
    for r in recs:
        assert not FORBIDDEN_VERBS.search(r.title)
        assert not FORBIDDEN_VERBS.search(r.reason)


# ---------------------------------------------------------------------------
# Snapshot: stress lens + stress root + sleep cluster
# ---------------------------------------------------------------------------

def test_snapshot_stress_lens_stress_pattern_sleep_cluster():
    """Stress lens + stress root pattern + sleep cluster yields 3 ordered recommendations."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY", "primary_lens_score": 65},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 70}],
        "clusters": [{"cluster_id": "CL_SLEEP_DISRUPT", "strength": 65, "confidence": 60}],
    }
    recs = build_recommendations(engine)
    assert len(recs) == 3
    assert recs[0].content_tag == "stress_regulation"
    assert recs[1].content_tag == "stress_load_management"
    assert recs[2].content_tag == "sleep_hygiene"
    for r in recs:
        assert isinstance(r, RecommendationVM)
        assert r.title and r.reason and r.content_tag
        assert r.priority in ("high", "medium", "low")


def test_snapshot_serialized_no_internal_ids():
    """Serialized recommendations do not expose pattern_id, cluster_id, lens_id."""
    engine = {
        "lens": {"primary_lens_id": "LENS_STRESS_RECOVERY"},
        "root_patterns": [{"pattern_id": "RP_STRESS_LOAD", "confidence": 50}],
    }
    recs = build_recommendations(engine)
    for r in recs:
        dumped = r.model_dump()
        assert "pattern_id" not in dumped
        assert "cluster_id" not in dumped
        assert "lens_id" not in dumped
    raw_str = str(recs)
    assert "RP_STRESS_LOAD" not in raw_str
    assert "LENS_STRESS_RECOVERY" not in raw_str

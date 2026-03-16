"""
Tests for rules-based Weekly Biological Insights.

- Eligibility threshold: no insight from single-day event.
- Persistence: 2 observations in 7 days passes.
- Confidence suppression: 39 suppresses; 40 allows.
- Safety suppression: safety override suppresses insights.
- Max insights: output length <= 3.
- Bullet count: each insight has <= 3 bullets.
- Observational bullets: no diagnostic phrases.
- Snapshots: sleep-change, stress-accumulation, cycle-rhythm fixtures.
"""

from __future__ import annotations

import re

from client_output.contracts import WeeklyInsightVM
from client_output.weekly_insight_rules import (
    MAX_WEEKLY_INSIGHTS,
    CONFIDENCE_THRESHOLD,
    build_weekly_insights,
)


def _sleep_temporal(strength_change: float, observations: int, single_day: bool = False, confidence: float = 60.0):
    return {
        "clusters": {
            "CL_SLEEP_DISRUPT": {
                "strength_change": strength_change,
                "observations_7d": observations,
                "single_day": single_day,
                "confidence": confidence,
            }
        }
    }


# ---------------------------------------------------------------------------
# Eligibility and persistence
# ---------------------------------------------------------------------------


def test_no_insight_from_single_day_event() -> None:
    """Single-day sleep change does not generate an insight."""
    temporal = _sleep_temporal(strength_change=30.0, observations=1, single_day=True, confidence=60.0)
    insights = build_weekly_insights(temporal, safety_state={})
    assert insights == []


def test_persistence_two_observations_in_seven_days_passes() -> None:
    """Two or more observations in 7 days qualify when above threshold."""
    temporal = _sleep_temporal(strength_change=30.0, observations=2, single_day=False, confidence=60.0)
    insights = build_weekly_insights(temporal, safety_state={})
    assert len(insights) == 1
    insight = insights[0]
    assert isinstance(insight, WeeklyInsightVM)
    assert "Sleep" in insight.headline


# ---------------------------------------------------------------------------
# Confidence and safety suppression
# ---------------------------------------------------------------------------


def test_confidence_39_suppresses_insight() -> None:
    """Confidence 39 suppresses weekly insight."""
    temporal = _sleep_temporal(strength_change=30.0, observations=3, single_day=False, confidence=CONFIDENCE_THRESHOLD - 1)
    insights = build_weekly_insights(temporal, safety_state={})
    assert insights == []


def test_confidence_40_allows_insight() -> None:
    """Confidence 40 allows weekly insight."""
    temporal = _sleep_temporal(strength_change=30.0, observations=3, single_day=False, confidence=CONFIDENCE_THRESHOLD)
    insights = build_weekly_insights(temporal, safety_state={})
    assert len(insights) == 1


def test_safety_override_suppresses_all_insights() -> None:
    """Safety override suppresses weekly insights regardless of temporal signals."""
    temporal = _sleep_temporal(strength_change=30.0, observations=3, single_day=False, confidence=60.0)
    insights = build_weekly_insights(temporal, safety_state={"safety_override": True})
    assert insights == []


# ---------------------------------------------------------------------------
# Max insights and bullet count
# ---------------------------------------------------------------------------


def test_max_insights_not_exceeded() -> None:
    """Output length never exceeds MAX_WEEKLY_INSIGHTS."""
    temporal = {
        "clusters": {
            "CL_SLEEP_DISRUPT": {"strength_change": 30.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
            "CL_STRESS_ACCUM": {"strength_change": 25.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
            "CL_ENERGY_VAR": {"strength_change": 22.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
        },
        "systems": {
            "SYS_HORMONAL": {"score_change": 25.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
        },
    }
    insights = build_weekly_insights(temporal, safety_state={})
    assert len(insights) <= MAX_WEEKLY_INSIGHTS


def test_each_insight_has_at_most_three_bullets() -> None:
    """Each insight contains at most 3 bullets."""
    temporal = _sleep_temporal(strength_change=30.0, observations=3, single_day=False, confidence=60.0)
    insights = build_weekly_insights(temporal, safety_state={})
    for ins in insights:
        assert len(ins.bullets) <= 3


# ---------------------------------------------------------------------------
# Observational bullet language
# ---------------------------------------------------------------------------


DIAGNOSTIC_PHRASES = re.compile(r"\\b(indicates|means|you have|is caused by)\\b", re.IGNORECASE)


def test_bullets_do_not_contain_diagnostic_phrases() -> None:
    """Bullets are observational, not diagnostic."""
    temporal = {
        "clusters": {
            "CL_SLEEP_DISRUPT": {"strength_change": 30.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
            "CL_STRESS_ACCUM": {"strength_change": 25.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
        },
        "systems": {
            "SYS_HORMONAL": {"score_change": 25.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
        },
    }
    insights = build_weekly_insights(temporal, safety_state={})
    for ins in insights:
        for bullet in ins.bullets:
            assert not DIAGNOSTIC_PHRASES.search(bullet)
        assert not DIAGNOSTIC_PHRASES.search(ins.interpretation)


# ---------------------------------------------------------------------------
# Snapshot fixtures
# ---------------------------------------------------------------------------


def test_snapshot_sleep_change_fixture() -> None:
    """Sleep-change fixture produces a clear sleep-variability insight."""
    temporal = _sleep_temporal(strength_change=30.0, observations=3, single_day=False, confidence=60.0)
    insights = build_weekly_insights(temporal, safety_state={})
    assert len(insights) == 1
    ins = insights[0]
    assert "Sleep" in ins.headline
    assert any("Sleep timing" in b or "sleep" in b.lower() for b in ins.bullets)


def test_snapshot_stress_accumulation_fixture() -> None:
    """Stress-accumulation fixture produces a stress-related insight."""
    temporal = {
        "clusters": {
            "CL_STRESS_ACCUM": {"strength_change": 30.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
        }
    }
    insights = build_weekly_insights(temporal, safety_state={})
    assert len(insights) == 1
    ins = insights[0]
    assert "Stress" in ins.headline
    assert any("stress" in b.lower() for b in ins.bullets)


def test_snapshot_cycle_rhythm_fixture() -> None:
    """Cycle-rhythm fixture produces a cycle-context insight."""
    temporal = {
        "systems": {
            "SYS_HORMONAL": {"score_change": 30.0, "observations_7d": 3, "single_day": False, "confidence": 60.0},
        }
    }
    insights = build_weekly_insights(temporal, safety_state={})
    assert len(insights) == 1
    ins = insights[0]
    assert "Cycle" in ins.headline
    assert any("cycle" in b.lower() for b in ins.bullets)


"""
Tests for preventive strategy selection from strategy library.

- Pattern threshold: confidence 40 includes strategy; 39 excludes it.
- Max strategies: output length <= 3.
- Selection order: strongest pattern strategy before supporting pattern strategy.
- Language safety: focus descriptions do not contain fix, treat, correct, resolve.
- Snapshot: blood sugar + sleep + stress pattern fixture produces ordered strategies.
"""

from __future__ import annotations

import re

from client_output.contracts import PreventiveStrategyVM
from client_output.preventive_strategy_library import (
    MAX_STRATEGIES,
    PATTERN_CONFIDENCE_THRESHOLD,
    STRATEGY_CONTENT,
    build_preventive_strategies,
)


# ---------------------------------------------------------------------------
# Pattern threshold tests
# ---------------------------------------------------------------------------


def test_pattern_confidence_39_excludes_strategy() -> None:
    """Pattern confidence 39 excludes its strategy."""
    patterns = [{"pattern_id": "RP_BLOOD_SUGAR", "confidence": PATTERN_CONFIDENCE_THRESHOLD - 1}]
    strategies = build_preventive_strategies(patterns, systems=[])
    titles = [s.title for s in strategies]
    assert "Meal Timing Stability" not in titles


def test_pattern_confidence_40_includes_strategy() -> None:
    """Pattern confidence 40 includes its strategy."""
    patterns = [{"pattern_id": "RP_BLOOD_SUGAR", "confidence": PATTERN_CONFIDENCE_THRESHOLD}]
    strategies = build_preventive_strategies(patterns, systems=[])
    titles = [s.title for s in strategies]
    assert "Meal Timing Stability" in titles


# ---------------------------------------------------------------------------
# Max strategies test
# ---------------------------------------------------------------------------


def test_max_three_strategies() -> None:
    """Output length never exceeds 3 strategies."""
    patterns = [
        {"pattern_id": "RP_BLOOD_SUGAR", "confidence": 90},
        {"pattern_id": "RP_SLEEP_DEPRIVATION", "confidence": 80},
        {"pattern_id": "RP_STRESS_LOAD", "confidence": 70},
        {"pattern_id": "RP_MICRO_DEPLETION", "confidence": 65},
    ]
    systems = [
        {"system_id": "SYS_SLEEP", "score": 65},
        {"system_id": "SYS_STRESS", "score": 70},
    ]
    strategies = build_preventive_strategies(patterns, systems)
    assert len(strategies) <= MAX_STRATEGIES


# ---------------------------------------------------------------------------
# Selection-order test
# ---------------------------------------------------------------------------


def test_selection_order_primary_then_supporting() -> None:
    """Strongest pattern strategy appears before supporting pattern strategy."""
    patterns = [
        {"pattern_id": "RP_BLOOD_SUGAR", "confidence": 80},
        {"pattern_id": "RP_SLEEP_DEPRIVATION", "confidence": 60},
    ]
    systems: list[dict] = []
    strategies = build_preventive_strategies(patterns, systems)
    assert len(strategies) >= 2
    assert strategies[0].title == "Meal Timing Stability"
    assert strategies[1].title == "Consistent Sleep Rhythm"


# ---------------------------------------------------------------------------
# Language safety test
# ---------------------------------------------------------------------------


FORBIDDEN_WORDS = re.compile(r"\\b(fix|treat|correct|resolve)\\b", re.IGNORECASE)


def test_focus_descriptions_have_no_fix_treat_correct_resolve() -> None:
    """Strategy focus descriptions avoid treatment language."""
    for sid, (_, focus, _) in STRATEGY_CONTENT.items():
        assert not FORBIDDEN_WORDS.search(focus), f"{sid}: forbidden word in focus_description"


def test_built_strategies_language_safe() -> None:
    """Built strategies also avoid treatment language."""
    patterns = [
        {"pattern_id": "RP_BLOOD_SUGAR", "confidence": 80},
        {"pattern_id": "RP_SLEEP_DEPRIVATION", "confidence": 70},
    ]
    systems = [{"system_id": "SYS_STRESS", "score": 60}]
    strategies = build_preventive_strategies(patterns, systems)
    for s in strategies:
        assert not FORBIDDEN_WORDS.search(s.title)
        assert not FORBIDDEN_WORDS.search(s.focus_description)


# ---------------------------------------------------------------------------
# Snapshot test
# ---------------------------------------------------------------------------


def test_snapshot_blood_sugar_sleep_stress_patterns() -> None:
    """
    Blood sugar + sleep + stress pattern fixture produces ordered strategies:
    Meal Timing Stability -> Consistent Sleep Rhythm -> Nervous System Regulation.
    """
    patterns = [
        {"pattern_id": "RP_BLOOD_SUGAR", "confidence": 85},
        {"pattern_id": "RP_SLEEP_DEPRIVATION", "confidence": 75},
        {"pattern_id": "RP_STRESS_LOAD", "confidence": 65},
    ]
    systems = [{"system_id": "SYS_STRESS", "score": 70}]
    strategies = build_preventive_strategies(patterns, systems)
    assert len(strategies) == 3
    titles = [s.title for s in strategies]
    assert titles[0] == "Meal Timing Stability"
    assert titles[1] == "Consistent Sleep Rhythm"
    assert titles[2] == "Nervous System Regulation"
    for s in strategies:
        assert isinstance(s, PreventiveStrategyVM)
        assert s.title and s.focus_description and s.priority_area


# ---------------------------------------------------------------------------
# No internal IDs in serialized output
# ---------------------------------------------------------------------------


def test_serialized_strategies_have_no_internal_ids() -> None:
    """Serialized strategies must not expose pattern or system IDs."""
    patterns = [{"pattern_id": "RP_BLOOD_SUGAR", "confidence": 80}]
    systems = [{"system_id": "SYS_SLEEP", "score": 60}]
    strategies = build_preventive_strategies(patterns, systems)
    for s in strategies:
        dumped = s.model_dump()
        assert "pattern_id" not in dumped
        assert "system_id" not in dumped


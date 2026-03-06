"""
Task 12.1 — Golden Test Fixtures and Expected Outputs.
End-to-end engine run per fixture; compare actual output subset to expected.
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.run import run_engine

from tests.golden.helpers import (
    engine_input_from_fixture,
    extract_output_subset,
    load_expected_golden,
    load_golden_fixture,
)

GOLDEN_FIXTURE_NAMES = [
    "iron_pattern",
    "stress_sleep",
    "sugar_instability",
    "thyroid_context",
    "gut_pattern",
    "perimenopause_sleep",
    "training_mismatch",
    "baseline_low_signal",
    "safety_heavy_bleeding_dizziness",
    "safety_persistent_diarrhea",
    "postpartum_info",
    "cycle_acne_hairloss",
]


def _assert_subset_match(actual: dict, expected: dict, fixture_name: str) -> None:
    """Assert actual output subset matches expected (prefix for lists, exact for scalars)."""
    # Top clusters: prefix match
    exp_top = expected.get("top_clusters") or []
    act_top = actual.get("top_clusters") or []
    assert act_top[: len(exp_top)] == exp_top, (
        f"[{fixture_name}] top_clusters: expected prefix {exp_top}, got {act_top}"
    )
    # System status: expected keys must match
    exp_status = expected.get("system_status") or {}
    act_status = actual.get("system_status") or {}
    for sid, exp_val in exp_status.items():
        assert act_status.get(sid) == exp_val, (
            f"[{fixture_name}] system_status[{sid}]: expected {exp_val}, got {act_status.get(sid)}"
        )
    # Top root patterns: prefix match
    exp_rp = expected.get("top_root_patterns") or []
    act_rp = actual.get("top_root_patterns") or []
    assert act_rp[: len(exp_rp)] == exp_rp, (
        f"[{fixture_name}] top_root_patterns: expected prefix {exp_rp}, got {act_rp}"
    )
    # Lens
    assert actual.get("primary_lens_id") == expected.get("primary_lens_id"), (
        f"[{fixture_name}] primary_lens_id: expected {expected.get('primary_lens_id')}, got {actual.get('primary_lens_id')}"
    )
    assert actual.get("secondary_lens_id") == expected.get("secondary_lens_id"), (
        f"[{fixture_name}] secondary_lens_id: expected {expected.get('secondary_lens_id')}, got {actual.get('secondary_lens_id')}"
    )
    # Safety rule IDs: unordered set match
    exp_safe = sorted(expected.get("safety_rule_ids") or [])
    act_safe = sorted(actual.get("safety_rule_ids") or [])
    assert act_safe == exp_safe, (
        f"[{fixture_name}] safety_rule_ids: expected {exp_safe}, got {act_safe}"
    )


class GoldenTestBase(unittest.TestCase):
    """Base for parameterized golden tests."""

    def _run_golden(self, name: str) -> None:
        fixture = load_golden_fixture(name)
        engine_input = engine_input_from_fixture(fixture)
        output = run_engine(engine_input, DEFAULT_CONFIG)
        actual = extract_output_subset(output)
        expected = load_expected_golden(name)
        _assert_subset_match(actual, expected, name)


def _make_test(name: str):
    def test(self):
        self._run_golden(name)
    return test


for _name in GOLDEN_FIXTURE_NAMES:
    _method = _make_test(_name)
    _method.__name__ = f"test_golden_{_name}"
    setattr(GoldenTestBase, _method.__name__, _method)

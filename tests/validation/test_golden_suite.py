"""
Task 12.2 — Golden suite in validation harness with mismatch reporting and release gate.
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.run import run_engine

from tests.golden.helpers import (
    engine_input_from_fixture,
    extract_output_subset,
    load_expected_golden,
    load_golden_fixture,
)
from tests.test_golden import GOLDEN_FIXTURE_NAMES, _assert_subset_match
from tests.validation.helpers import (
    assert_engine_invariants,
    format_golden_mismatch,
)


def _run_golden_one(name: str) -> None:
    """Run one golden fixture; on mismatch raise AssertionError with formatted message."""
    fixture = load_golden_fixture(name)
    engine_input = engine_input_from_fixture(fixture)
    output = run_engine(engine_input, DEFAULT_CONFIG)
    actual = extract_output_subset(output)
    expected = load_expected_golden(name)
    try:
        _assert_subset_match(actual, expected, name)
    except AssertionError as e:
        msg = format_golden_mismatch(actual, expected, name)
        raise AssertionError(f"{msg}\n\nOriginal: {e}") from e


class TestGoldenSuiteValidation(unittest.TestCase):
    """Run golden suite through validation harness; mismatch report on failure."""

    def test_golden_baseline_low_signal(self):
        _run_golden_one("baseline_low_signal")

    def test_golden_iron_pattern(self):
        _run_golden_one("iron_pattern")

    def test_golden_stress_sleep(self):
        _run_golden_one("stress_sleep")

    def test_golden_sugar_instability(self):
        _run_golden_one("sugar_instability")

    def test_golden_thyroid_context(self):
        _run_golden_one("thyroid_context")

    def test_golden_gut_pattern(self):
        _run_golden_one("gut_pattern")

    def test_golden_perimenopause_sleep(self):
        _run_golden_one("perimenopause_sleep")

    def test_golden_training_mismatch(self):
        _run_golden_one("training_mismatch")

    def test_golden_safety_heavy_bleeding_dizziness(self):
        _run_golden_one("safety_heavy_bleeding_dizziness")

    def test_golden_safety_persistent_diarrhea(self):
        _run_golden_one("safety_persistent_diarrhea")

    def test_golden_postpartum_info(self):
        _run_golden_one("postpartum_info")

    def test_golden_cycle_acne_hairloss(self):
        _run_golden_one("cycle_acne_hairloss")


class TestReleaseGate(unittest.TestCase):
    """Release gate: run golden suite + invariants on every fixture; compact summary on failure."""

    def test_release_gate_golden_and_invariants(self):
        registry = get_default_registry()
        config = DEFAULT_CONFIG
        run_count = 0
        passed = 0
        failed: list = []
        first_mismatch: str | None = None

        for name in GOLDEN_FIXTURE_NAMES:
            run_count += 1
            output = None
            try:
                fixture = load_golden_fixture(name)
                engine_input = engine_input_from_fixture(fixture)
                output = run_engine(engine_input, config)
                assert_engine_invariants(output, registry, config)
                actual = extract_output_subset(output)
                expected = load_expected_golden(name)
                _assert_subset_match(actual, expected, name)
                passed += 1
            except Exception as e:
                failed.append(name)
                if first_mismatch is None:
                    if output is not None:
                        try:
                            actual = extract_output_subset(output)
                            expected = load_expected_golden(name)
                            first_mismatch = format_golden_mismatch(actual, expected, name)
                        except Exception:
                            first_mismatch = str(e)
                    else:
                        first_mismatch = str(e)

        if failed:
            summary = [
                "Release gate failed.",
                f"  fixtures run: {run_count}",
                f"  passed: {passed}",
                f"  failed: {len(failed)}",
                f"  failed fixtures: {failed}",
            ]
            if first_mismatch:
                summary.append("  first mismatch:")
                for line in first_mismatch.splitlines():
                    summary.append(f"    {line}")
            self.fail("\n".join(summary))

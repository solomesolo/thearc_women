"""
Tests for Task 8.1 — Lens Scoring, Eligibility Gates, and Baseline Fallback.
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.lens.selector import lens_eligible, select_lens, system_lookup, system_score
from engine.types import SystemResult


def _sys(system_id: str, score: float, confidence: float = 70.0) -> SystemResult:
    return SystemResult(system_id=system_id, score=score, confidence=confidence)


class TestStressRecoveryLensSelected(unittest.TestCase):
    """Test 8.1.1 — stress/recovery lens selected when systems support it."""

    def test_stress_recovery_lens_selected(self):
        systems = [
            _sys("SYS_STRESS", 75),
            _sys("SYS_SLEEP", 65),
            _sys("SYS_RECOVERY", 60),
        ]
        derived_flags = {}
        registry = get_default_registry()
        result = select_lens(systems, derived_flags, registry, DEFAULT_CONFIG)
        self.assertEqual(result.primary_lens_id, "LENS_STRESS_RECOVERY")
        self.assertGreater(result.primary_lens_score, 0)


class TestHormonalLensBlockedWhenCycleNotApplicable(unittest.TestCase):
    """Test 8.1.2 — hormonal lens blocked when cycle not applicable."""

    def test_hormonal_ineligible_when_cycle_not_applicable(self):
        systems = [_sys("SYS_HORMONAL", 80), _sys("SYS_SLEEP", 50)]
        derived_flags = {"cycle_applicable": False}
        system_map = system_lookup(systems)
        self.assertFalse(lens_eligible("LENS_HORMONAL_RHYTHM", system_map, derived_flags))

    def test_hormonal_not_selected_returns_baseline_or_other(self):
        systems = [_sys("SYS_HORMONAL", 80), _sys("SYS_SLEEP", 50)]
        derived_flags = {"cycle_applicable": False}
        registry = get_default_registry()
        result = select_lens(systems, derived_flags, registry, DEFAULT_CONFIG)
        self.assertNotEqual(result.primary_lens_id, "LENS_HORMONAL_RHYTHM")


class TestGutLensEligibleFromFlag(unittest.TestCase):
    """Test 8.1.3 — gut lens eligible from gut flag even if system score modest."""

    def test_gut_eligible_with_flag_modest_score(self):
        systems = [_sys("SYS_GUT", 25), _sys("SYS_MICRO", 20)]
        derived_flags = {"gut_data_present": True}
        system_map = system_lookup(systems)
        self.assertTrue(lens_eligible("LENS_GUT_ABSORPTION", system_map, derived_flags))

    def test_gut_lens_selected_when_only_eligible(self):
        # Gut eligible via flag; scores high enough so lens score >= 35
        systems = [
            _sys("SYS_STRESS", 20),
            _sys("SYS_SLEEP", 20),
            _sys("SYS_METABOLIC", 20),
            _sys("SYS_HORMONAL", 20),
            _sys("SYS_GUT", 40),
            _sys("SYS_MICRO", 40),
        ]
        derived_flags = {"gut_data_present": True, "cycle_applicable": False}
        registry = get_default_registry()
        result = select_lens(systems, derived_flags, registry, DEFAULT_CONFIG)
        self.assertEqual(result.primary_lens_id, "LENS_GUT_ABSORPTION")
        self.assertGreaterEqual(result.primary_lens_score, 35.0)


class TestBaselineWhenNoEligibleLenses(unittest.TestCase):
    """Test 8.1.4 — baseline when no eligible lenses."""

    def test_baseline_when_all_below_thresholds(self):
        systems = [
            _sys("SYS_STRESS", 20),
            _sys("SYS_SLEEP", 20),
            _sys("SYS_METABOLIC", 20),
            _sys("SYS_HORMONAL", 20),
            _sys("SYS_GUT", 20),
            _sys("SYS_MICRO", 20),
        ]
        derived_flags = {"cycle_applicable": False, "post_meal_crash": False, "gut_data_present": False, "micro_data_present": False}
        registry = get_default_registry()
        result = select_lens(systems, derived_flags, registry, DEFAULT_CONFIG)
        self.assertEqual(result.primary_lens_id, "LENS_BASELINE")
        self.assertEqual(result.primary_lens_score, 0.0)
        self.assertIn("baseline_reason", result.explain_meta)


class TestBaselineWhenTopScoreBelow35(unittest.TestCase):
    """Test 8.1.5 — baseline when top eligible lens score below 35."""

    def test_baseline_when_top_score_below_35(self):
        # One eligible lens with score ~30: e.g. ENERGY_METABOLIC with low metabolic/sleep
        systems = [
            _sys("SYS_STRESS", 15),
            _sys("SYS_SLEEP", 15),
            _sys("SYS_METABOLIC", 40),
            _sys("SYS_SLEEP", 35),
        ]
        # Avoid duplicate SYS_SLEEP - use single sleep
        systems = [
            _sys("SYS_STRESS", 10),
            _sys("SYS_SLEEP", 40),
            _sys("SYS_METABOLIC", 40),
            _sys("SYS_HORMONAL", 10),
            _sys("SYS_GUT", 10),
            _sys("SYS_MICRO", 10),
        ]
        derived_flags = {"post_meal_crash": True, "cycle_applicable": False}
        registry = get_default_registry()
        result = select_lens(systems, derived_flags, registry, DEFAULT_CONFIG)
        # Either ENERGY_METABOLIC or STRESS_RECOVERY could win; we need a scenario where the top score is < 35
        # Lens score = weighted sum of adjusted scores. Adjusted = score * (0.7 + 0.3*0.7) = score * 0.91 for conf 70.
        # So with SYS_METABOLIC=40, SYS_SLEEP=40: energy_metabolic = 0.7*40*0.91 + 0.3*40*0.91 = 40*0.91 = 36.4. So we need lower.
        systems_low = [
            _sys("SYS_STRESS", 30),
            _sys("SYS_SLEEP", 30),
            _sys("SYS_RECOVERY", 30),
            _sys("SYS_METABOLIC", 30),
            _sys("SYS_HORMONAL", 10),
            _sys("SYS_GUT", 10),
            _sys("SYS_MICRO", 10),
        ]
        result2 = select_lens(systems_low, {"post_meal_crash": False, "cycle_applicable": False}, registry, DEFAULT_CONFIG)
        # STRESS_RECOVERY eligible (all 3 >= 30 so 2 of 3 >= 30; and one of stress/sleep/recovery >= 40? No - 30,30,30. So we need at least one >= 40 for STRESS_RECOVERY. So STRESS_RECOVERY ineligible. ENERGY_METABOLIC needs SYS_METABOLIC >= 40 or post_meal_crash - we have 30 and False. So ineligible. So we get baseline. So that's test 4 again.
        # To get "one eligible lens with score 30": have one lens eligible but its computed score < 35.
        # LENS_GUT_ABSORPTION: SYS_GUT 35+ or gut_data_present. If SYS_GUT=35, SYS_MICRO=0, adjusted gut=35*0.91=31.85, micro=0. Score = 0.75*31.85 + 0.25*0 = 23.9. So we get baseline because 23.9 < 35.
        systems_one_low = [
            _sys("SYS_STRESS", 10),
            _sys("SYS_SLEEP", 10),
            _sys("SYS_METABOLIC", 10),
            _sys("SYS_HORMONAL", 10),
            _sys("SYS_GUT", 35),
            _sys("SYS_MICRO", 0),
        ]
        derived = {"gut_data_present": False, "cycle_applicable": False}
        result3 = select_lens(systems_one_low, derived, registry, DEFAULT_CONFIG)
        self.assertEqual(result3.primary_lens_id, "LENS_BASELINE", "top eligible lens score should be below 35")
        self.assertEqual(result3.explain_meta.get("baseline_reason"), "top_score_below_35")
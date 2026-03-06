"""
Tests for cluster strength (Task 3.1) and base cluster confidence (Task 3.2).
"""

import unittest
from dataclasses import replace
from types import SimpleNamespace

from engine.clusters.confidence import compute_cluster_confidence
from engine.clusters.engine import compute_clusters
from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.types import ClusterResult, SignalScore


def _scores(*pairs):
    return [SignalScore(symptom_id=sid, score=float(s), missing_fields=[]) for sid, s in pairs]


def _find_cluster(results, cluster_id):
    for r in results:
        if r.cluster_id == cluster_id:
            return r
    return None


def _run(signal_scores, derived_flags=None, normalized_survey=None):
    flags = derived_flags or {}
    survey = normalized_survey or SimpleNamespace(cycle_regular=None, missed_period_3mo=None)
    registry = get_default_registry()
    return compute_clusters(signal_scores, flags, survey, registry, DEFAULT_CONFIG)


class TestEnergyVariabilityTriggers(unittest.TestCase):
    """Test 1 — energy variability triggers."""

    def test_cl_energy_var_strength_gt_0(self):
        scores = _scores(("SYM_FATIGUE", 70), ("SYM_AFTERNOON_CRASH", 60), ("SYM_BRAIN_FOG", 45))
        results = _run(scores)
        c = _find_cluster(results, "CL_ENERGY_VAR")
        self.assertIsNotNone(c)
        self.assertGreater(c.strength, 0)


class TestStressAccumulationTriggers(unittest.TestCase):
    """Test 2 — stress accumulation triggers."""

    def test_cl_stress_accum_strength_gt_0(self):
        scores = _scores(("SYM_ANXIETY", 60), ("SYM_WAKE_3AM", 55))
        flags = {"stress_level": 4}
        results = _run(scores, flags)
        c = _find_cluster(results, "CL_STRESS_ACCUM")
        self.assertIsNotNone(c)
        self.assertGreater(c.strength, 0)


class TestSleepDisruptionNeedsTwoSignals(unittest.TestCase):
    """Test 3 — sleep disruption needs 2 signals."""

    def test_two_signals_triggers(self):
        scores = _scores(("SYM_INSOMNIA", 60), ("SYM_UNREFRESHED", 65))
        results = _run(scores)
        c = _find_cluster(results, "CL_SLEEP_DISRUPT")
        self.assertIsNotNone(c)
        self.assertGreater(c.strength, 0)

    def test_one_signal_zero_strength(self):
        scores = _scores(("SYM_INSOMNIA", 60))
        results = _run(scores)
        c = _find_cluster(results, "CL_SLEEP_DISRUPT")
        self.assertIsNotNone(c)
        self.assertEqual(c.strength, 0)


class TestCycleVariabilityTriggers(unittest.TestCase):
    """Test 4 — cycle variability triggers."""

    def test_cl_cycle_var_strength_gt_0(self):
        scores = _scores(("SYM_IRREG_CYCLE", 70), ("SYM_PMS", 50))
        results = _run(scores)
        c = _find_cluster(results, "CL_CYCLE_VAR")
        self.assertIsNotNone(c)
        self.assertGreater(c.strength, 0)


class TestSugarInstabilityNeedsPostMealOrCrashCravings(unittest.TestCase):
    """Test 5 — sugar instability needs post-meal or crash+cravings."""

    def test_post_meal_crash_triggers(self):
        scores = _scores(("SYM_AFTERNOON_CRASH", 30), ("SYM_SUGAR_CRAVE", 20))
        flags = {"post_meal_crash": True}
        results = _run(scores, flags)
        c = _find_cluster(results, "CL_SUGAR_INSTAB")
        self.assertIsNotNone(c)
        self.assertGreater(c.strength, 0)


class TestInflammatoryLoadRequiresMultiDomain(unittest.TestCase):
    """Test 6 — inflammatory load requires multi-domain overlap."""

    def test_three_domains_plus_fatigue_triggers(self):
        scores = _scores(("SYM_FATIGUE", 60))
        flags = {
            "sleep_problem_present": True,
            "gut_data_present": True,
            "stress_level": 4,
            "micro_data_present": True,
        }
        results = _run(scores, flags)
        c = _find_cluster(results, "CL_INFLAM_LOAD")
        self.assertIsNotNone(c)
        self.assertGreater(c.strength, 0)

    def test_only_fatigue_zero_strength(self):
        scores = _scores(("SYM_FATIGUE", 60))
        flags = {}
        results = _run(scores, flags)
        c = _find_cluster(results, "CL_INFLAM_LOAD")
        self.assertIsNotNone(c)
        self.assertEqual(c.strength, 0)


# --- Task 3.2: Base cluster confidence ---


def _run_confidence(clusters, signal_scores=None):
    registry = get_default_registry()
    return compute_cluster_confidence(
        clusters, signal_scores or [], {}, None, registry, DEFAULT_CONFIG
    )


class TestZeroStrengthZeroConfidence(unittest.TestCase):
    """Test 1 — zero strength gives zero confidence."""

    def test_zero_strength_confidence_zero(self):
        clusters = [
            ClusterResult(
                cluster_id="CL_ENERGY_VAR",
                strength=0.0,
                confidence=0.0,
                supporting_signals=[],
                confounders_applied=[],
            )
        ]
        result = _run_confidence(clusters)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].confidence, 0)


class TestStrongerBetterSupportedHigherConfidence(unittest.TestCase):
    """Test 2 — stronger, better-supported cluster gets higher confidence."""

    def test_confidence_a_gt_b(self):
        cluster_a = ClusterResult(
            cluster_id="CL_ENERGY_VAR",
            strength=75.0,
            confidence=0.0,
            supporting_signals=[
                "SYM_FATIGUE", "SYM_AFTERNOON_CRASH", "SYM_BRAIN_FOG",
                "SYM_EX_INTOL", "SYM_SUGAR_CRAVE",
            ],
            confounders_applied=[],
        )
        cluster_b = ClusterResult(
            cluster_id="CL_ENERGY_VAR",
            strength=55.0,
            confidence=0.0,
            supporting_signals=["SYM_FATIGUE", "SYM_AFTERNOON_CRASH"],
            confounders_applied=["stress_overlap", "sleep_overlap"],
        )
        scores = _scores(
            ("SYM_FATIGUE", 70), ("SYM_AFTERNOON_CRASH", 60), ("SYM_BRAIN_FOG", 50),
            ("SYM_EX_INTOL", 40), ("SYM_SUGAR_CRAVE", 35),
        )
        result = _run_confidence([cluster_a, cluster_b], scores)
        self.assertEqual(len(result), 2)
        self.assertGreater(result[0].confidence, result[1].confidence)


class TestConfoundersReduceConfidence(unittest.TestCase):
    """Test 3 — confounders reduce confidence."""

    def test_confounders_lower_confidence(self):
        base = ClusterResult(
            cluster_id="CL_ENERGY_VAR",
            strength=60.0,
            confidence=0.0,
            supporting_signals=["SYM_FATIGUE", "SYM_AFTERNOON_CRASH", "SYM_BRAIN_FOG"],
            confounders_applied=[],
        )
        with_conf = replace(
            base, confounders_applied=["stress_overlap", "sleep_overlap"]
        )
        scores = _scores(("SYM_FATIGUE", 65), ("SYM_AFTERNOON_CRASH", 50), ("SYM_BRAIN_FOG", 45))
        out_no = _run_confidence([base], scores)
        out_yes = _run_confidence([with_conf], scores)
        self.assertGreater(out_no[0].confidence, out_yes[0].confidence)


class TestInflammatoryLoadCapped(unittest.TestCase):
    """Test 4 — inflammatory load capped conservatively."""

    def test_inflam_load_confidence_cap_70(self):
        cluster = ClusterResult(
            cluster_id="CL_INFLAM_LOAD",
            strength=80.0,
            confidence=0.0,
            supporting_signals=["SYM_FATIGUE", "SYM_UNREFRESHED", "sleep_problem_present", "gut_data_present", "micro_data_present"],
            confounders_applied=["low_specificity_cluster"],
        )
        scores = _scores(("SYM_FATIGUE", 70), ("SYM_UNREFRESHED", 60))
        result = _run_confidence([cluster], scores)
        self.assertEqual(len(result), 1)
        self.assertLessEqual(result[0].confidence, 70)


class TestLowStrengthConfidenceCapped(unittest.TestCase):
    """Test 5 — low-strength cluster confidence capped at 60."""

    def test_strength_20_confidence_cap_60(self):
        cluster = ClusterResult(
            cluster_id="CL_ENERGY_VAR",
            strength=20.0,
            confidence=0.0,
            supporting_signals=["SYM_FATIGUE", "SYM_AFTERNOON_CRASH", "SYM_BRAIN_FOG", "SYM_EX_INTOL", "SYM_SUGAR_CRAVE"],
            confounders_applied=[],
        )
        scores = _scores(("SYM_FATIGUE", 35), ("SYM_AFTERNOON_CRASH", 30), ("SYM_BRAIN_FOG", 32), ("SYM_EX_INTOL", 31), ("SYM_SUGAR_CRAVE", 30))
        result = _run_confidence([cluster], scores)
        self.assertEqual(len(result), 1)
        self.assertLessEqual(result[0].confidence, 60)

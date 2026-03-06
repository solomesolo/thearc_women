"""
Tests for Task 7.1 — Root Pattern Mapping from Clusters and Task 7.2 — Scoring and finalization.
"""

import unittest
from types import SimpleNamespace

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.patterns.mapper import (
    choose_pattern_evidence,
    clamp_0_100,
    contributor_bonus,
    evidence_precedence,
    map_root_patterns,
    _finalize_pattern_results,
)
from engine.types import ClusterResult, SignalScore


def _find_pattern(root_patterns, pattern_id: str):
    for r in root_patterns:
        if r.pattern_id == pattern_id:
            return r
    return None


def _scores(*pairs):
    return [SignalScore(symptom_id=sid, score=float(s), missing_fields=[]) for sid, s in pairs]


class TestEnergyMapsToBloodSugar(unittest.TestCase):
    """Test 1 — energy variability maps to blood sugar when post-meal crash exists."""

    def test_energy_var_maps_to_blood_sugar(self):
        clusters = [ClusterResult(cluster_id="CL_ENERGY_VAR", strength=60.0)]
        derived_flags = {"post_meal_crash": True}
        survey = SimpleNamespace(life_stage=None, lifestyle_fields={}, modifier_flags={}, raw_fields={})
        registry = get_default_registry()
        root_patterns, _ = map_root_patterns(
            clusters,
            [],
            derived_flags,
            survey,
            registry,
            DEFAULT_CONFIG,
            signal_scores=[],
            normalized_labs=[],
        )
        rp = _find_pattern(root_patterns, "RP_BLOOD_SUGAR")
        self.assertIsNotNone(rp, "RP_BLOOD_SUGAR should be present")
        self.assertAlmostEqual(rp.score, 21.0, places=2, msg="contribution 60 * 0.35 = 21")


class TestStressMapsToStressLoad(unittest.TestCase):
    """Test 2 — stress accumulation maps to stress load."""

    def test_stress_accum_maps_to_stress_load(self):
        clusters = [ClusterResult(cluster_id="CL_STRESS_ACCUM", strength=70.0)]
        derived_flags = {"stress_level": 4}
        signal_scores = _scores(("SYM_ANXIETY", 60))
        survey = SimpleNamespace(life_stage=None, lifestyle_fields={}, modifier_flags={}, raw_fields={})
        registry = get_default_registry()
        root_patterns, _ = map_root_patterns(
            clusters,
            [],
            derived_flags,
            survey,
            registry,
            DEFAULT_CONFIG,
            signal_scores=signal_scores,
            normalized_labs=[],
        )
        rp = _find_pattern(root_patterns, "RP_STRESS_LOAD")
        self.assertIsNotNone(rp, "RP_STRESS_LOAD should be present")
        self.assertAlmostEqual(rp.score, 38.5, places=2, msg="contribution 70 * 0.55 = 38.5")


class TestCycleMapsToAndrogenExcess(unittest.TestCase):
    """Test 3 — cycle variability maps to androgen excess when acne + irregular cycle high."""

    def test_cycle_var_maps_to_andro_excess(self):
        clusters = [ClusterResult(cluster_id="CL_CYCLE_VAR", strength=80.0)]
        derived_flags = {}
        signal_scores = _scores(("SYM_ACNE", 65), ("SYM_IRREG_CYCLE", 70))
        survey = SimpleNamespace(life_stage=None, lifestyle_fields={}, modifier_flags={}, raw_fields={})
        registry = get_default_registry()
        root_patterns, _ = map_root_patterns(
            clusters,
            [],
            derived_flags,
            survey,
            registry,
            DEFAULT_CONFIG,
            signal_scores=signal_scores,
            normalized_labs=[],
        )
        rp = _find_pattern(root_patterns, "RP_ANDRO_EXCESS")
        self.assertIsNotNone(rp, "RP_ANDRO_EXCESS should be present")
        self.assertAlmostEqual(rp.score, 20.0, places=2, msg="contribution 80 * 0.25 = 20")


class TestGutFallback(unittest.TestCase):
    """Test 4 — fallback activates when no gates pass for gut cluster."""

    def test_gut_fallback_used(self):
        clusters = [ClusterResult(cluster_id="CL_GUT_PATTERN", strength=50.0)]
        derived_flags = {}
        # No bloating/constipation/diarrhea/food_sensitivity evidence
        signal_scores = _scores(("SYM_BLOATING", 20), ("SYM_CONSTIP", 20), ("SYM_DIARRHEA", 20))
        survey = SimpleNamespace(
            life_stage=None,
            lifestyle_fields={"food_sensitivity": False},
            modifier_flags={},
            raw_fields={},
        )
        registry = get_default_registry()
        root_patterns, mapping_meta = map_root_patterns(
            clusters,
            [],
            derived_flags,
            survey,
            registry,
            DEFAULT_CONFIG,
            signal_scores=signal_scores,
            normalized_labs=[],
        )
        cm = mapping_meta.get("cluster_mapping", {}).get("CL_GUT_PATTERN")
        self.assertIsNotNone(cm, "cluster_mapping should have CL_GUT_PATTERN")
        self.assertTrue(cm.get("fallback_used"), "fallback_used should be True")
        passed = cm.get("passed_rows", [])
        self.assertEqual(len(passed), 1)
        self.assertEqual(passed[0]["root_pattern_id"], "RP_GUT_DYSBIOSIS")
        rp = _find_pattern(root_patterns, "RP_GUT_DYSBIOSIS")
        self.assertIsNotNone(rp)
        self.assertAlmostEqual(rp.score, 37.5, places=2, msg="fallback 50 * 0.75 = 37.5")


class TestSleepMapsToVasomotor(unittest.TestCase):
    """Test 5 — sleep disruption maps to vasomotor context in peri + night sweats."""

    def test_sleep_disrupt_maps_to_vasomotor(self):
        clusters = [ClusterResult(cluster_id="CL_SLEEP_DISRUPT", strength=70.0)]
        derived_flags = {}
        signal_scores = _scores(("SYM_NIGHT_SWEATS", 60))
        survey = SimpleNamespace(
            life_stage="LS_PERI",
            lifestyle_fields={},
            modifier_flags={},
            raw_fields={},
        )
        registry = get_default_registry()
        root_patterns, _ = map_root_patterns(
            clusters,
            [],
            derived_flags,
            survey,
            registry,
            DEFAULT_CONFIG,
            signal_scores=signal_scores,
            normalized_labs=[],
        )
        rp = _find_pattern(root_patterns, "RP_VASOMOTOR_CTX")
        self.assertIsNotNone(rp, "RP_VASOMOTOR_CTX should be present")
        self.assertAlmostEqual(rp.score, 7.0, places=2, msg="contribution 70 * 0.10 = 7")


# --- Task 7.2 tests ---


class TestMultipleClustersRaiseConfidence(unittest.TestCase):
    """Test 7.2.1 — multiple contributing clusters raise confidence."""

    def test_three_clusters_contributor_bonus(self):
        pattern_score_raw = {"RP_STRESS_LOAD": 53.0}
        pattern_contributing = {
            "RP_STRESS_LOAD": [
                {"cluster_id": "CL_STRESS_ACCUM", "weight": 0.55, "contribution": 35.0, "evidence_level": "High", "fallback_used": False},
                {"cluster_id": "CL_SLEEP_DISRUPT", "weight": 0.15, "contribution": 10.0, "evidence_level": "High", "fallback_used": False},
                {"cluster_id": "CL_CYCLE_VAR", "weight": 0.10, "contribution": 8.0, "evidence_level": "Moderate", "fallback_used": False},
            ],
        }
        registry = get_default_registry()
        results = _finalize_pattern_results(pattern_score_raw, pattern_contributing, registry)
        rp = _find_pattern(results, "RP_STRESS_LOAD")
        self.assertIsNotNone(rp)
        self.assertAlmostEqual(rp.score, 53.0, places=2)
        self.assertGreater(rp.confidence, 0.75 * 53, msg="confidence should exceed 0.75 * score due to contributor bonus")
        self.assertIn("contributing_clusters", rp.explain_meta)
        self.assertEqual(len(rp.explain_meta["contributing_clusters"]), 3)


class TestEvidencePrecedence(unittest.TestCase):
    """Test 7.2.2 — evidence precedence chooses High over Moderate."""

    def test_choose_high_over_moderate(self):
        self.assertEqual(choose_pattern_evidence(["Moderate", "High"]), "High")
        self.assertEqual(choose_pattern_evidence(["High", "Moderate"]), "High")

    def test_precedence_order(self):
        self.assertGreater(evidence_precedence("High"), evidence_precedence("Moderate"))
        self.assertGreater(evidence_precedence("Clinical_Practice"), evidence_precedence("Emerging"))


class TestEmergingEvidenceConfidenceCap(unittest.TestCase):
    """Test 7.2.3 — emerging evidence confidence cap."""

    def test_emerging_cap_75(self):
        pattern_score_raw = {"RP_GUT_DYSBIOSIS": 80.0}
        pattern_contributing = {
            "RP_GUT_DYSBIOSIS": [
                {"cluster_id": "CL_GUT_PATTERN", "weight": 0.75, "contribution": 80.0, "evidence_level": "Emerging", "fallback_used": False},
            ],
        }
        registry = get_default_registry()
        results = _finalize_pattern_results(pattern_score_raw, pattern_contributing, registry)
        rp = _find_pattern(results, "RP_GUT_DYSBIOSIS")
        self.assertIsNotNone(rp)
        self.assertAlmostEqual(rp.score, 80.0, places=2)
        self.assertLessEqual(rp.confidence, 75.0, msg="Emerging evidence must cap confidence at 75")


class TestFallbackOnlyConfidenceCap(unittest.TestCase):
    """Test 7.2.4 — fallback-only confidence cap."""

    def test_fallback_only_cap_60(self):
        # Raw confidence would be ~72 (0.75*70 + 0 + 6 for Clinical_Practice)
        pattern_score_raw = {"RP_IRON_DEPLETION": 70.0}
        pattern_contributing = {
            "RP_IRON_DEPLETION": [
                {"cluster_id": "CL_IRON_PATTERN", "weight": 0.80, "contribution": 70.0, "evidence_level": "High", "fallback_used": True},
            ],
        }
        registry = get_default_registry()
        results = _finalize_pattern_results(pattern_score_raw, pattern_contributing, registry)
        rp = _find_pattern(results, "RP_IRON_DEPLETION")
        self.assertIsNotNone(rp)
        self.assertLessEqual(rp.confidence, 60.0, msg="Fallback-only pattern must have confidence <= 60")
        self.assertTrue(rp.explain_meta.get("fallback_only"))


class TestInflamContextCap(unittest.TestCase):
    """Test 7.2.5 — RP_INFLAM_CTX confidence cap."""

    def test_inflam_ctx_cap_70(self):
        pattern_score_raw = {"RP_INFLAM_CTX": 85.0}
        pattern_contributing = {
            "RP_INFLAM_CTX": [
                {"cluster_id": "CL_INFLAM_LOAD", "weight": 0.15, "contribution": 85.0, "evidence_level": "High", "fallback_used": False},
            ],
        }
        registry = get_default_registry()
        results = _finalize_pattern_results(pattern_score_raw, pattern_contributing, registry)
        rp = _find_pattern(results, "RP_INFLAM_CTX")
        self.assertIsNotNone(rp)
        self.assertLessEqual(rp.confidence, 70.0, msg="RP_INFLAM_CTX confidence must be capped at 70")

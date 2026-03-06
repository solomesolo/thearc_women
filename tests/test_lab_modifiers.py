"""
Tests for lab modifiers application to cluster confidence (Task 5.1).
"""

import unittest
from types import SimpleNamespace

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.labs.modifiers import apply_lab_modifiers
from engine.types import ClusterResult


def _lab(lab_id, value_state="present_recent", recency_factor=1.0, recency_bucket="le_12m"):
    return SimpleNamespace(
        lab_id=lab_id,
        value=None,
        date=None,
        value_state=value_state,
        recency_bucket=recency_bucket,
        recency_factor=recency_factor,
        raw_record={},
    )


def _find(clusters, cluster_id):
    for c in clusters:
        if c.cluster_id == cluster_id:
            return c
    return None


def _run(clusters, normalized_labs):
    registry = get_default_registry()
    updated, meta = apply_lab_modifiers(clusters, normalized_labs, registry, DEFAULT_CONFIG)
    return updated, meta


class TestFerritinBoostsIronPatternConfidence(unittest.TestCase):
    """Test 1 — ferritin boosts iron-pattern confidence."""

    def test_ferritin_50_to_70(self):
        clusters = [
            ClusterResult(cluster_id="CL_IRON_PATTERN", strength=50.0, confidence=50.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [_lab("LAB_FERRITIN", value_state="present_recent", recency_factor=1.0)]
        updated, _ = _run(clusters, labs)
        c = _find(updated, "CL_IRON_PATTERN")
        self.assertIsNotNone(c)
        self.assertEqual(c.confidence, 70.0)


class TestOldLabScalesEffectDown(unittest.TestCase):
    """Test 2 — old lab scales effect down."""

    def test_ferritin_recency_half(self):
        clusters = [
            ClusterResult(cluster_id="CL_IRON_PATTERN", strength=50.0, confidence=50.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [_lab("LAB_FERRITIN", value_state="present_recent", recency_factor=0.5)]
        updated, _ = _run(clusters, labs)
        c = _find(updated, "CL_IRON_PATTERN")
        self.assertIsNotNone(c)
        self.assertEqual(c.confidence, 60.0)


class TestOutOfRangeTSHAffectsThyroidStrengthAndConfidence(unittest.TestCase):
    """Test 3 — out-of-range TSH affects thyroid cluster strength and confidence."""

    def test_tsh_out_of_range(self):
        clusters = [
            ClusterResult(cluster_id="CL_THYROID_SIGNALS", strength=60.0, confidence=50.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [_lab("LAB_TSH", value_state="out_of_range", recency_factor=1.0)]
        updated, _ = _run(clusters, labs)
        c = _find(updated, "CL_THYROID_SIGNALS")
        self.assertIsNotNone(c)
        self.assertEqual(c.confidence, 75.0)
        self.assertEqual(c.strength, 65.0)


class TestConfidenceCapAt30(unittest.TestCase):
    """Test 4 — confidence cap at +30 per cluster."""

    def test_sugar_instab_cap(self):
        clusters = [
            ClusterResult(cluster_id="CL_SUGAR_INSTAB", strength=50.0, confidence=40.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [
            _lab("LAB_GLUCOSE_FAST", value_state="present_recent", recency_factor=1.0),
            _lab("LAB_HBA1C", value_state="present_recent", recency_factor=1.0),
            _lab("LAB_INSULIN_FAST", value_state="present_recent", recency_factor=1.0),
        ]
        updated, meta = _run(clusters, labs)
        c = _find(updated, "CL_SUGAR_INSTAB")
        self.assertIsNotNone(c)
        self.assertEqual(c.confidence, 70.0)
        self.assertTrue(meta["cluster_lab_effects"]["CL_SUGAR_INSTAB"]["cap_applied"])


class TestZeroStrengthClusterConfidenceCapped(unittest.TestCase):
    """Test 5 — zero-strength cluster confidence capped at 40."""

    def test_gut_zero_strength(self):
        clusters = [
            ClusterResult(cluster_id="CL_GUT_PATTERN", strength=0.0, confidence=0.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [
            _lab("LAB_B12", value_state="present_recent", recency_factor=1.0),
            _lab("LAB_FERRITIN", value_state="present_recent", recency_factor=1.0),
        ]
        updated, _ = _run(clusters, labs)
        c = _find(updated, "CL_GUT_PATTERN")
        self.assertIsNotNone(c)
        self.assertGreater(c.confidence, 0)
        self.assertLessEqual(c.confidence, 40)


class TestInflamConfidenceCapped(unittest.TestCase):
    """Test 6 — inflam confidence capped at 85."""

    def test_inflam_cap_85(self):
        clusters = [
            ClusterResult(cluster_id="CL_INFLAM_LOAD", strength=60.0, confidence=75.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [_lab("LAB_CRP", value_state="out_of_range", recency_factor=1.0)]
        updated, _ = _run(clusters, labs)
        c = _find(updated, "CL_INFLAM_LOAD")
        self.assertIsNotNone(c)
        self.assertLessEqual(c.confidence, 85)


# --- Task 5.2: Lab effect tracing + relevance metadata ---


class TestMetadataIncludesAppliedRule(unittest.TestCase):
    """Test 1 — metadata includes applied rule."""

    def test_ferritin_iron_applied_rule(self):
        clusters = [
            ClusterResult(cluster_id="CL_IRON_PATTERN", strength=50.0, confidence=50.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [_lab("LAB_FERRITIN", value_state="present_recent", recency_factor=1.0)]
        _, meta = _run(clusters, labs)
        self.assertIn("CL_IRON_PATTERN", meta["cluster_lab_effects"])
        applied = meta["cluster_lab_effects"]["CL_IRON_PATTERN"]["applied_rules"]
        self.assertEqual(len(applied), 1)
        self.assertEqual(applied[0]["lab_id"], "LAB_FERRITIN")
        self.assertIn("base_delta_strength", applied[0])
        self.assertIn("scaled_delta_strength", applied[0])


class TestCapAppliedTrueWhenCapped(unittest.TestCase):
    """Test 2 — cap_applied true when capped."""

    def test_sugar_instab_cap_applied(self):
        clusters = [
            ClusterResult(cluster_id="CL_SUGAR_INSTAB", strength=50.0, confidence=40.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [
            _lab("LAB_GLUCOSE_FAST", value_state="present_recent", recency_factor=1.0),
            _lab("LAB_HBA1C", value_state="present_recent", recency_factor=1.0),
            _lab("LAB_INSULIN_FAST", value_state="present_recent", recency_factor=1.0),
        ]
        _, meta = _run(clusters, labs)
        self.assertTrue(meta["cluster_lab_effects"]["CL_SUGAR_INSTAB"]["cap_applied"])


class TestRelevanceSummaryProduced(unittest.TestCase):
    """Test 3 — relevance summary produced."""

    def test_tsh_thyroid_relevance(self):
        clusters = [
            ClusterResult(cluster_id="CL_THYROID_SIGNALS", strength=60.0, confidence=50.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        labs = [_lab("LAB_TSH", value_state="out_of_range", recency_factor=1.0)]
        _, meta = _run(clusters, labs)
        self.assertIn("cluster_lab_relevance", meta)
        self.assertIn("CL_THYROID_SIGNALS", meta["cluster_lab_relevance"])
        relevance = meta["cluster_lab_relevance"]["CL_THYROID_SIGNALS"]
        self.assertGreaterEqual(len(relevance), 1)
        self.assertTrue(
            any(r["lab_id"] == "LAB_TSH" and r.get("why_relevant_short") for r in relevance)
        )

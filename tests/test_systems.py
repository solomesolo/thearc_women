"""
Tests for system scoring (Task 6.1).
"""

import unittest
from types import SimpleNamespace

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.systems.scorer import (
    compute_system_confidence,
    compute_systems,
    system_status_from_score,
)
from engine.types import ClusterResult


def _cluster(cid, strength, confidence=50.0):
    return ClusterResult(
        cluster_id=cid,
        strength=float(strength),
        confidence=float(confidence),
        supporting_signals=[],
        confounders_applied=[],
    )


def _all_zero_clusters():
    ids = [
        "CL_ENERGY_VAR", "CL_STRESS_ACCUM", "CL_SLEEP_DISRUPT", "CL_CYCLE_VAR",
        "CL_SUGAR_INSTAB", "CL_IRON_PATTERN", "CL_THYROID_SIGNALS", "CL_TRAIN_MISMATCH",
        "CL_GUT_PATTERN", "CL_INFLAM_LOAD",
    ]
    return [_cluster(cid, 0, 0) for cid in ids]


def _find_system(systems, system_id):
    for s in systems:
        if s.system_id == system_id:
            return s
    return None


def _run(clusters=None, normalized_labs=None, history=None):
    registry = get_default_registry()
    return compute_systems(
        clusters or _all_zero_clusters(),
        registry,
        DEFAULT_CONFIG,
        normalized_labs=normalized_labs,
        history=history,
    )


class TestMetabolicScoreDrivenBySugarCluster(unittest.TestCase):
    """Test 1 — metabolic score driven by sugar cluster."""

    def test_metabolic_gt_bone(self):
        clusters = _all_zero_clusters()
        for c in clusters:
            if c.cluster_id == "CL_SUGAR_INSTAB":
                c.strength = 70.0
                c.confidence = 80.0
            elif c.cluster_id == "CL_ENERGY_VAR":
                c.strength = 60.0
                c.confidence = 70.0
        systems = _run(clusters)
        metabolic = _find_system(systems, "SYS_METABOLIC")
        bone = _find_system(systems, "SYS_BONE")
        self.assertIsNotNone(metabolic)
        self.assertIsNotNone(bone)
        self.assertGreater(metabolic.score, bone.score)


class TestStressSystemDrivenByStressCluster(unittest.TestCase):
    """Test 2 — stress system driven by stress cluster."""

    def test_stress_high_gt_gut(self):
        clusters = _all_zero_clusters()
        for c in clusters:
            if c.cluster_id == "CL_STRESS_ACCUM":
                c.strength = 80.0
                c.confidence = 80.0
            elif c.cluster_id == "CL_SLEEP_DISRUPT":
                c.strength = 55.0
                c.confidence = 60.0
        systems = _run(clusters)
        stress = _find_system(systems, "SYS_STRESS")
        gut = _find_system(systems, "SYS_GUT")
        self.assertIsNotNone(stress)
        self.assertIsNotNone(gut)
        self.assertGreater(stress.score, 50)
        self.assertGreater(stress.score, gut.score)


class TestBiomarkersContextFromLabCount(unittest.TestCase):
    """Test 3 — biomarkers context from lab count."""

    def test_zero_labs_score_10(self):
        systems = _run(_all_zero_clusters(), normalized_labs=[])
        bio = _find_system(systems, "SYS_BIOMARKERS_CTX")
        self.assertIsNotNone(bio)
        self.assertEqual(bio.score, 10.0)

    def test_two_labs_score_35(self):
        labs = [SimpleNamespace(lab_id="A"), SimpleNamespace(lab_id="B")]
        systems = _run(_all_zero_clusters(), normalized_labs=labs)
        bio = _find_system(systems, "SYS_BIOMARKERS_CTX")
        self.assertIsNotNone(bio)
        self.assertEqual(bio.score, 35.0)

    def test_five_labs_score_75(self):
        labs = [SimpleNamespace(lab_id=x) for x in "ABCDE"]
        systems = _run(_all_zero_clusters(), normalized_labs=labs)
        bio = _find_system(systems, "SYS_BIOMARKERS_CTX")
        self.assertIsNotNone(bio)
        self.assertEqual(bio.score, 75.0)


class TestBoneSystemCap(unittest.TestCase):
    """Test 4 — bone system cap at 65."""

    def test_bone_cap_65(self):
        clusters = [
            _cluster("CL_IRON_PATTERN", 90, 90),
            _cluster("CL_GUT_PATTERN", 90, 90),
            _cluster("CL_INFLAM_LOAD", 90, 90),
            _cluster("CL_THYROID_SIGNALS", 90, 90),
            _cluster("CL_CYCLE_VAR", 90, 90),
            _cluster("CL_ENERGY_VAR", 0, 0),
            _cluster("CL_STRESS_ACCUM", 0, 0),
            _cluster("CL_SLEEP_DISRUPT", 0, 0),
            _cluster("CL_SUGAR_INSTAB", 0, 0),
            _cluster("CL_TRAIN_MISMATCH", 0, 0),
        ]
        systems = _run(clusters)
        bone = _find_system(systems, "SYS_BONE")
        self.assertIsNotNone(bone)
        self.assertLessEqual(bone.score, 65)


class TestInflammatoryContextCap(unittest.TestCase):
    """Test 5 — inflammatory context cap at 80."""

    def test_inflam_ctx_cap_80(self):
        clusters = _all_zero_clusters()
        for c in clusters:
            if c.cluster_id == "CL_INFLAM_LOAD":
                c.strength = 95.0
                c.confidence = 90.0
            elif c.cluster_id in ("CL_GUT_PATTERN", "CL_SLEEP_DISRUPT"):
                c.strength = 90.0
                c.confidence = 85.0
        systems = _run(clusters)
        inflam = _find_system(systems, "SYS_INFLAM_CTX")
        self.assertIsNotNone(inflam)
        self.assertLessEqual(inflam.score, 80)


# --- Task 6.2: Status, drivers, confidence, smoothing metadata ---


class TestStatusThresholds(unittest.TestCase):
    """Test 1 — status thresholds."""

    def test_stable_variable_needs_attention(self):
        self.assertEqual(system_status_from_score(20), "stable")
        self.assertEqual(system_status_from_score(45), "variable")
        self.assertEqual(system_status_from_score(70), "needs_attention")


class TestTopDriversExtracted(unittest.TestCase):
    """Test 2 — top drivers extracted correctly."""

    def test_stress_top_driver(self):
        clusters = _all_zero_clusters()
        for c in clusters:
            if c.cluster_id == "CL_STRESS_ACCUM":
                c.strength = 80.0
                c.confidence = 80.0
            elif c.cluster_id == "CL_SLEEP_DISRUPT":
                c.strength = 40.0
                c.confidence = 50.0
        systems = _run(clusters)
        stress = _find_system(systems, "SYS_STRESS")
        self.assertIsNotNone(stress)
        self.assertGreaterEqual(len(stress.top_drivers), 1)
        self.assertEqual(stress.top_drivers[0], "CL_STRESS_ACCUM")


class TestSystemConfidenceWeighted(unittest.TestCase):
    """Test 3 — system confidence weighted correctly."""

    def test_confidence_72(self):
        clusters = [
            _cluster("CL_STRESS_ACCUM", 50, 80),
            _cluster("CL_SLEEP_DISRUPT", 50, 60),
        ]
        weights = [("CL_STRESS_ACCUM", 0.6), ("CL_SLEEP_DISRUPT", 0.4)]
        conf = compute_system_confidence("SYS_STRESS", clusters, weights, default_confidence=70.0)
        self.assertAlmostEqual(conf, 72.0, delta=0.1)


class TestDefaultConfidenceFallback(unittest.TestCase):
    """Test 4 — default confidence when no contributors."""

    def test_no_contributors_default_70(self):
        clusters = _all_zero_clusters()
        systems = _run(clusters)
        gut = _find_system(systems, "SYS_GUT")
        self.assertIsNotNone(gut)
        self.assertEqual(gut.confidence, 70.0)


class TestSmoothingMetadataComputed(unittest.TestCase):
    """Test 5 — smoothing metadata computed."""

    def test_would_flip_and_delta(self):
        clusters = _all_zero_clusters()
        for c in clusters:
            if c.cluster_id == "CL_SLEEP_DISRUPT":
                c.strength = 95.0
                c.confidence = 95.0
            elif c.cluster_id == "CL_STRESS_ACCUM":
                c.strength = 30.0
                c.confidence = 30.0
        history = {
            "system_snapshots": [
                {
                    "timestamp": "2026-03-01T10:00:00Z",
                    "systems": [
                        {"system_id": "SYS_SLEEP", "score": 58, "status": "variable"},
                    ],
                },
            ],
        }
        systems = _run(clusters, history=history)
        sleep = _find_system(systems, "SYS_SLEEP")
        self.assertIsNotNone(sleep)
        self.assertEqual(sleep.status, "needs_attention")
        self.assertIn("explain_meta", dir(sleep))
        meta = getattr(sleep, "explain_meta", {}) or {}
        self.assertTrue(meta.get("would_flip_status"))
        self.assertAlmostEqual(meta.get("score_delta"), 6.0, delta=5.0)
        self.assertFalse(meta.get("flip_large_enough"))

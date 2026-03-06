"""
Tests for temporal persistence adjustment (Task 4.1).
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.temporal.persistence import (
    apply_temporal_logic,
    get_cluster_history_points,
    recency_weighted_mean,
    summarize_cluster_history,
)
from engine.types import ClusterResult


def _find(clusters, cluster_id):
    for c in clusters:
        if c.cluster_id == cluster_id:
            return c
    return None


def _run(clusters, history=None, time_window="7d", reference_timestamp="2026-03-06T10:00:00Z"):
    registry = get_default_registry()
    return apply_temporal_logic(
        clusters, history or {}, registry, DEFAULT_CONFIG,
        time_window=time_window, reference_timestamp=reference_timestamp,
    )


class TestPersistentClusterGetsUplift(unittest.TestCase):
    """Test 1 — persistent cluster gets uplift."""

    def test_persistent_uplift(self):
        clusters = [
            ClusterResult(cluster_id="CL_ENERGY_VAR", strength=60.0, confidence=0.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        history = {
            "cluster_snapshots": [
                {"timestamp": "2026-03-04T10:00:00Z", "clusters": [{"cluster_id": "CL_ENERGY_VAR", "strength": 55}]},
                {"timestamp": "2026-03-02T10:00:00Z", "clusters": [{"cluster_id": "CL_ENERGY_VAR", "strength": 62}]},
            ],
        }
        updated, meta = _run(clusters, history)
        c = _find(updated, "CL_ENERGY_VAR")
        self.assertIsNotNone(c)
        self.assertEqual(meta["cluster_temporal"]["CL_ENERGY_VAR"]["persistence_label"], "persistent")
        self.assertGreater(c.strength, 60)


class TestEmergingClusterMildReduction(unittest.TestCase):
    """Test 2 — emerging cluster gets mild reduction."""

    def test_emerging_reduction(self):
        clusters = [
            ClusterResult(cluster_id="CL_SLEEP_DISRUPT", strength=55.0, confidence=0.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        history = {
            "cluster_snapshots": [
                {"timestamp": "2026-03-05T10:00:00Z", "clusters": [{"cluster_id": "CL_SLEEP_DISRUPT", "strength": 40}]},
            ],
        }
        updated, meta = _run(clusters, history)
        c = _find(updated, "CL_SLEEP_DISRUPT")
        self.assertIsNotNone(c)
        self.assertEqual(meta["cluster_temporal"]["CL_SLEEP_DISRUPT"]["persistence_label"], "emerging")
        self.assertAlmostEqual(c.strength, 55 * 0.90, delta=1.0)


class TestTransientClusterStrongerReduction(unittest.TestCase):
    """Test 3 — transient cluster gets stronger reduction."""

    def test_transient_reduction(self):
        clusters = [
            ClusterResult(cluster_id="CL_CYCLE_VAR", strength=50.0, confidence=0.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        updated, meta = _run(clusters, {})
        c = _find(updated, "CL_CYCLE_VAR")
        self.assertIsNotNone(c)
        self.assertEqual(meta["cluster_temporal"]["CL_CYCLE_VAR"]["persistence_label"], "transient")
        self.assertAlmostEqual(c.strength, 50 * 0.70, delta=0.1)


class TestZeroStrengthStaysZero(unittest.TestCase):
    """Test 4 — zero strength stays zero."""

    def test_zero_unchanged(self):
        clusters = [
            ClusterResult(cluster_id="CL_GUT_PATTERN", strength=0.0, confidence=0.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        updated, meta = _run(clusters, {})
        c = _find(updated, "CL_GUT_PATTERN")
        self.assertIsNotNone(c)
        self.assertEqual(c.strength, 0)
        self.assertEqual(meta["cluster_temporal"]["CL_GUT_PATTERN"]["persistence_label"], "transient")


class TestInflamClusterCapped(unittest.TestCase):
    """Test 5 — inflam cluster capped at 80."""

    def test_inflam_cap(self):
        clusters = [
            ClusterResult(cluster_id="CL_INFLAM_LOAD", strength=78.0, confidence=0.0,
                         supporting_signals=[], confounders_applied=[]),
        ]
        history = {
            "cluster_snapshots": [
                {"timestamp": "2026-03-04T10:00:00Z", "clusters": [{"cluster_id": "CL_INFLAM_LOAD", "strength": 50}]},
                {"timestamp": "2026-03-02T10:00:00Z", "clusters": [{"cluster_id": "CL_INFLAM_LOAD", "strength": 55}]},
            ],
        }
        updated, meta = _run(clusters, history)
        c = _find(updated, "CL_INFLAM_LOAD")
        self.assertIsNotNone(c)
        self.assertLessEqual(c.strength, 80)


# --- Task 4.2: History aggregation + recency decay ---

class TestRecencyWeightingPrefersRecent(unittest.TestCase):
    """Test 1 — recency weighting prefers recent points."""

    def test_weighted_mean_closer_to_recent(self):
        # 70 at 3 days old -> weight 1.0; 40 at 20 days old -> weight 0.60
        points = [(70.0, 1.0), (40.0, 0.60)]
        mean = recency_weighted_mean(points)
        simple_avg = (70 + 40) / 2  # 55
        self.assertGreater(mean, simple_avg)
        self.assertGreater(mean, 55)
        self.assertLess(mean, 70)


class TestOutOfWindowPointsIgnored(unittest.TestCase):
    """Test 2 — out-of-window points ignored."""

    def test_30_days_old_ignored_with_14_day_lookback(self):
        ref = "2026-03-15T10:00:00Z"
        history = {
            "cluster_snapshots": [
                {"timestamp": "2026-02-13T10:00:00Z", "clusters": [{"cluster_id": "CL_ENERGY_VAR", "strength": 50}]},
            ],
        }
        points = get_cluster_history_points(history, "CL_ENERGY_VAR", ref, 14.0)
        self.assertEqual(len(points), 0)


class TestEmptyHistorySafe(unittest.TestCase):
    """Test 3 — empty history safe."""

    def test_no_snapshots(self):
        summary = summarize_cluster_history({}, "CL_ENERGY_VAR", "2026-03-06T10:00:00Z", 14.0)
        self.assertEqual(summary["strengths"], [])
        self.assertEqual(summary["weights"], [])
        self.assertEqual(summary["weighted_mean"], 0.0)
        self.assertEqual(summary["history_points_used"], 0)

    def test_points_empty_mean_zero(self):
        self.assertEqual(recency_weighted_mean([]), 0.0)


class TestInvalidTimestampIgnored(unittest.TestCase):
    """Test 4 — invalid timestamp ignored without crash."""

    def test_malformed_timestamp_ignored(self):
        history = {
            "cluster_snapshots": [
                {"timestamp": "not-a-date", "clusters": [{"cluster_id": "CL_ENERGY_VAR", "strength": 60}]},
                {"timestamp": "2026-03-05T10:00:00Z", "clusters": [{"cluster_id": "CL_ENERGY_VAR", "strength": 55}]},
            ],
        }
        points = get_cluster_history_points(history, "CL_ENERGY_VAR", "2026-03-06T10:00:00Z", 14.0)
        self.assertEqual(len(points), 1)
        self.assertEqual(points[0][0], 55.0)

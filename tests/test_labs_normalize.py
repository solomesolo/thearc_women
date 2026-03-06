"""
Tests for lab input normalization (Task 1.2).
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.ingest.labs_normalize import (
    NormalizedLab,
    normalize_lab_inputs,
)
from engine.ids.registry import get_default_registry


def _norm(labs_input, reference_timestamp=None):
    registry = get_default_registry()
    return normalize_lab_inputs(labs_input, registry, DEFAULT_CONFIG, reference_timestamp)


class TestCanonicalLabIdPasses(unittest.TestCase):
    """Test 1 — canonical lab ID passes."""

    def test_canonical_lab_id(self):
        result = _norm([{"lab_id": "LAB_FERRITIN", "value": 40, "date": "2025-09-02"}])
        self.assertEqual(len(result), 1)
        self.assertIsInstance(result[0], NormalizedLab)
        self.assertEqual(result[0].lab_id, "LAB_FERRITIN")
        self.assertEqual(result[0].value, 40.0)
        self.assertEqual(result[0].date, "2025-09-02")


class TestLabelMapsToCanonicalId(unittest.TestCase):
    """Test 2 — label maps to canonical ID."""

    def test_lab_name_ferritin(self):
        result = _norm([{"lab_name": "Ferritin", "value": 40}])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].lab_id, "LAB_FERRITIN")


class TestOutOfRangePreserved(unittest.TestCase):
    """Test 3 — out_of_range preserved."""

    def test_value_state_out_of_range(self):
        result = _norm([{"lab_id": "LAB_TSH", "value_state": "out_of_range"}])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].value_state, "out_of_range")


class TestInvalidValueStateBecomesUnknown(unittest.TestCase):
    """Test 4 — invalid value_state becomes unknown."""

    def test_weird_value_state(self):
        result = _norm([{"lab_id": "LAB_TSH", "value_state": "weird_value"}])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].value_state, "unknown")


class TestRecencyFactorLe12m(unittest.TestCase):
    """Test 5 — recency factor ≤12m."""

    def test_recency_le_12m(self):
        ref_ts = "2026-03-06T10:00:00Z"
        result = _norm(
            [{"lab_id": "LAB_FERRITIN", "value": 40, "date": "2025-09-02"}],
            reference_timestamp=ref_ts,
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].recency_bucket, "le_12m")
        self.assertEqual(result[0].recency_factor, 1.0)


class TestUnknownDateGetsLowFactor(unittest.TestCase):
    """Test 6 — unknown date gets low factor."""

    def test_no_date_gt_24m_or_unknown(self):
        result = _norm([{"lab_id": "LAB_CRP"}])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].recency_bucket, "gt_24m_or_unknown")
        self.assertEqual(result[0].recency_factor, 0.25)

"""
Tests for symptom signal scoring (Task 2.1).
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.ingest.survey_normalize import NormalizedSurvey
from engine.signals.scorer import compute_signal_scores
from engine.types import SymptomInput


def _scores_for_symptoms(symptom_inputs):
    """Build a minimal NormalizedSurvey with given symptom_inputs and run scorer."""
    survey = NormalizedSurvey(symptom_inputs=symptom_inputs)
    registry = get_default_registry()
    return compute_signal_scores(survey, registry, DEFAULT_CONFIG)


class TestFatigueScoringBasic(unittest.TestCase):
    """Test 1 — fatigue scoring basic."""

    def test_fatigue_score_in_range(self):
        inputs = [
            SymptomInput(
                symptom_id="SYM_FATIGUE",
                severity=4,
                frequency=3,
                duration_days=30,
                timing="afternoon",
            )
        ]
        result = _scores_for_symptoms(inputs)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].symptom_id, "SYM_FATIGUE")
        self.assertGreater(result[0].score, 0)
        self.assertLessEqual(result[0].score, 100)
        self.assertEqual(result[0].missing_fields, [])


class TestModifierCapEnforced(unittest.TestCase):
    """Test 2 — modifier cap enforced."""

    def test_modifier_cap(self):
        inputs = [
            SymptomInput(
                symptom_id="SYM_AFTERNOON_CRASH",
                severity=4,
                frequency=2,
                duration_days=60,
                timing="all_day",
                phase_link="luteal",
                post_meal=True,
            )
        ]
        result = _scores_for_symptoms(inputs)
        self.assertEqual(len(result), 1)
        self.assertLessEqual(result[0].score, 100)


class TestMissingFieldsPreserved(unittest.TestCase):
    """Test 3 — missing fields preserved."""

    def test_missing_frequency_and_duration(self):
        inputs = [
            SymptomInput(
                symptom_id="SYM_PMS",
                severity=4,
                frequency=None,
                duration_days=None,
                phase_link="premenstrual",
            )
        ]
        result = _scores_for_symptoms(inputs)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].symptom_id, "SYM_PMS")
        missing = set(result[0].missing_fields)
        self.assertIn("frequency", missing)
        self.assertIn("duration_days", missing)


class TestUnknownSymptomIgnored(unittest.TestCase):
    """Test 4 — unknown symptom ignored in non-strict mode."""

    def test_unknown_symptom_skipped(self):
        inputs = [SymptomInput(symptom_id="SYM_NOT_REAL", severity=4)]
        result = _scores_for_symptoms(inputs)
        self.assertEqual(len(result), 0)

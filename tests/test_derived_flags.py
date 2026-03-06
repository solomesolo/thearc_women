"""
Tests for derived flags (Task 2.2).
"""

import unittest
from types import SimpleNamespace

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.signals.flags import compute_derived_flags
from engine.types import SignalScore


def _survey(**kwargs):
    """Minimal normalized survey object with defaults."""
    o = SimpleNamespace(
        life_stage=None,
        has_periods=None,
        is_menopause_stage=False,
        modifier_flags={},
        lifestyle_fields={},
        raw_fields={},
        symptom_inputs=[],
    )
    for k, v in kwargs.items():
        setattr(o, k, v)
    return o


def _scores(*pairs):
    """List of SignalScore from (symptom_id, score) pairs."""
    return [SignalScore(symptom_id=sid, score=float(score), missing_fields=[]) for sid, score in pairs]


def _flags(survey, signal_scores):
    registry = get_default_registry()
    return compute_derived_flags(survey, signal_scores, registry, DEFAULT_CONFIG)


class TestCycleApplicableFalseInMenopause(unittest.TestCase):
    """Test 1 — cycle_applicable false in menopause."""

    def test_cycle_applicable_false_when_ls_meno(self):
        survey = _survey(life_stage="LS_MENO")
        result = _flags(survey, [])
        self.assertFalse(result["cycle_applicable"])


class TestGutDataPresentTwoGI(unittest.TestCase):
    """Test 2 — gut_data_present true with 2 GI signals."""

    def test_gut_data_present_two_gi(self):
        scores = _scores(("SYM_BLOATING", 50), ("SYM_CONSTIP", 35))
        result = _flags(_survey(), scores)
        self.assertTrue(result["gut_data_present"])


class TestMicroDataPresentHairLoss(unittest.TestCase):
    """Test 3 — micro_data_present true with hair loss."""

    def test_micro_data_present_hair_loss(self):
        scores = _scores(("SYM_HAIR_LOSS", 55))
        result = _flags(_survey(), scores)
        self.assertTrue(result["micro_data_present"])


class TestSleepProblemPresent(unittest.TestCase):
    """Test 4 — sleep_problem_present true."""

    def test_sleep_problem_unrefreshed(self):
        scores = _scores(("SYM_UNREFRESHED", 60))
        result = _flags(_survey(), scores)
        self.assertTrue(result["sleep_problem_present"])


class TestPostMealCrashFromRaw(unittest.TestCase):
    """Test 5 — post_meal_crash true from raw field."""

    def test_post_meal_crash_raw_one(self):
        survey = _survey(raw_fields={"crash_post_meal": 1})
        result = _flags(survey, [])
        self.assertTrue(result["post_meal_crash"])


class TestEnergyVariabilityPresent(unittest.TestCase):
    """Test 6 — energy_variability_present true."""

    def test_energy_variability_fatigue_afternoon_crash(self):
        scores = _scores(("SYM_FATIGUE", 60), ("SYM_AFTERNOON_CRASH", 50))
        result = _flags(_survey(), scores)
        self.assertTrue(result["energy_variability_present"])

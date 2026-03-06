"""
Tests for survey input normalization (Task 1.1).
"""

import unittest

from engine.ingest.survey_normalize import normalize_survey_input, NormalizedSurvey
from engine.ids.registry import get_default_registry
from engine.config import DEFAULT_CONFIG


def _norm(payload: dict) -> NormalizedSurvey:
    registry = get_default_registry()
    return normalize_survey_input(payload, registry, DEFAULT_CONFIG)


class TestLifeStageNormalization(unittest.TestCase):
    def test_life_stage_repro(self):
        normalized = _norm({"life_stage": "Reproductive (26–35)"})
        self.assertEqual(normalized.life_stage, "LS_REPRO")
        self.assertFalse(normalized.is_menopause_stage)

    def test_menopause_stage_detection(self):
        normalized = _norm({"life_stage": "Menopause"})
        self.assertEqual(normalized.life_stage, "LS_MENO")
        self.assertTrue(normalized.is_menopause_stage)


class TestHasPeriods(unittest.TestCase):
    def test_has_periods_false(self):
        normalized = _norm({"cycle_regular": "I do not currently have periods"})
        self.assertFalse(normalized.has_periods)


class TestFatigueSymptom(unittest.TestCase):
    def test_fatigue_symptom_created(self):
        normalized = _norm({
            "fatigue_freq": "Most days",
            "fatigue_sev": 4,
            "fatigue_timing": "Afternoon",
        })
        fatigue = [s for s in normalized.symptom_inputs if s.symptom_id == "SYM_FATIGUE"]
        self.assertEqual(len(fatigue), 1)
        self.assertEqual(fatigue[0].frequency, 3)
        self.assertEqual(fatigue[0].severity, 4)
        self.assertEqual(fatigue[0].timing, "afternoon")
        afternoon = [s for s in normalized.symptom_inputs if s.symptom_id == "SYM_AFTERNOON_CRASH"]
        self.assertGreaterEqual(len(afternoon), 1)


class TestHeavyBleedPmsPainful(unittest.TestCase):
    def test_heavy_bleed_pms_painful_period(self):
        normalized = _norm({
            "period_heaviness": "Very heavy",
            "pms_sev": 5,
            "period_pain_sev": 3,
        })
        ids = [s.symptom_id for s in normalized.symptom_inputs]
        self.assertIn("SYM_HEAVY_BLEED", ids)
        self.assertIn("SYM_PMS", ids)
        self.assertIn("SYM_PAINFUL_PERIOD", ids)
        pms = next(s for s in normalized.symptom_inputs if s.symptom_id == "SYM_PMS")
        self.assertEqual(pms.severity, 5)
        pain = next(s for s in normalized.symptom_inputs if s.symptom_id == "SYM_PAINFUL_PERIOD")
        self.assertEqual(pain.severity, 3)


class TestEmptyInput(unittest.TestCase):
    def test_empty_returns_defaults(self):
        normalized = _norm({})
        self.assertIsNone(normalized.life_stage)
        self.assertFalse(normalized.is_menopause_stage)
        self.assertEqual(normalized.symptom_inputs, [])


class TestUnknownAndMissing(unittest.TestCase):
    def test_unknown_life_stage_preserved_in_raw(self):
        normalized = _norm({"life_stage": "Unknown Frontend Label"})
        self.assertIsNone(normalized.life_stage)
        self.assertIn("life_stage", normalized.raw_fields)
        self.assertEqual(normalized.raw_fields["life_stage"], "Unknown Frontend Label")

    def test_missing_values_are_none(self):
        normalized = _norm({"life_stage": "Menopause"})
        self.assertIsNone(normalized.age_years)
        self.assertIsNone(normalized.cycle_regular)
        self.assertIsNone(normalized.period_heaviness)

"""
Tests for Task 9.1 — Safety Rules Evaluation and Task 9.2 — Safety Overrides.
"""

import unittest
from types import SimpleNamespace

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.safety.evaluator import evaluate_safety
from engine.types import SignalScore


def _scores(*pairs):
    return [SignalScore(symptom_id=sid, score=float(s), missing_fields=[]) for sid, s in pairs]


def _find_prompt(prompts, rule_id: str):
    for p in prompts:
        if p.safety_rule_id == rule_id:
            return p
    return None


class TestMissedPeriodRuleTriggers(unittest.TestCase):
    """Test 9.1.1 — missed period rule triggers."""

    def test_safe01_triggered_missed_period_yes(self):
        survey = SimpleNamespace(missed_period_3mo="yes", raw_fields={}, modifier_flags={})
        prompts, _ = evaluate_safety(
            survey, [], [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        p = _find_prompt(prompts, "SAFE01")
        self.assertIsNotNone(p, "SAFE01 should be triggered")
        self.assertEqual(p.message_type, "clinical awareness")
        self.assertEqual(p.priority, "medium")


class TestHeavyBleedingDizzinessUrgentTriggers(unittest.TestCase):
    """Test 9.1.2 — heavy bleeding + dizziness urgent rule triggers."""

    def test_safe02_triggered_priority_high(self):
        survey = SimpleNamespace(raw_fields={}, modifier_flags={})
        signal_scores = _scores(("SYM_HEAVY_BLEED", 70), ("SYM_DIZZINESS", 60))
        prompts, _ = evaluate_safety(
            survey, signal_scores, [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        p = _find_prompt(prompts, "SAFE02")
        self.assertIsNotNone(p, "SAFE02 should be triggered")
        self.assertEqual(p.priority, "high")
        self.assertEqual(p.message_type, "urgent attention")


class TestFatiguePersistenceRuleTriggers(unittest.TestCase):
    """Test 9.1.3 — fatigue persistence rule triggers."""

    def test_safe08_triggered_fatigue_duration(self):
        survey = SimpleNamespace(
            raw_fields={},
            modifier_flags={},
            symptom_inputs=[SimpleNamespace(symptom_id="SYM_FATIGUE", duration_days=60)],
        )
        signal_scores = _scores(("SYM_FATIGUE", 70))
        prompts, _ = evaluate_safety(
            survey, signal_scores, [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        p = _find_prompt(prompts, "SAFE08")
        self.assertIsNotNone(p, "SAFE08 should be triggered")


class TestInformationalMedicationRulesTrigger(unittest.TestCase):
    """Test 9.1.4 — informational medication rules trigger."""

    def test_safe20_safe21_triggered_both_low(self):
        survey = SimpleNamespace(
            raw_fields={},
            modifier_flags={"glp1_medication_use": True, "thyroid_medication_use": True},
        )
        prompts, _ = evaluate_safety(
            survey, [], [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        p20 = _find_prompt(prompts, "SAFE20")
        p21 = _find_prompt(prompts, "SAFE21")
        self.assertIsNotNone(p20, "SAFE20 should be triggered")
        self.assertIsNotNone(p21, "SAFE21 should be triggered")
        self.assertEqual(p20.priority, "low")
        self.assertEqual(p21.priority, "low")


class TestEscalationMetadataDetectsUrgent(unittest.TestCase):
    """Test 9.1.5 — escalation metadata detects urgent attention."""

    def test_urgent_attention_triggered_and_highest_priority(self):
        survey = SimpleNamespace(raw_fields={}, modifier_flags={})
        signal_scores = _scores(("SYM_HEAVY_BLEED", 70), ("SYM_DIZZINESS", 60))
        _, safety_meta = evaluate_safety(
            survey, signal_scores, [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        self.assertTrue(safety_meta.get("urgent_attention_triggered"))
        self.assertEqual(safety_meta.get("highest_priority"), "high")


# --- Task 9.2 tests ---


class TestAnySafetyRuleSetsPatternCap(unittest.TestCase):
    """Test 9.2.1 — any safety rule sets pattern cap."""

    def test_medium_priority_sets_cap(self):
        survey = SimpleNamespace(missed_period_3mo="yes", raw_fields={}, modifier_flags={})
        _, safety_meta = evaluate_safety(
            survey, [], [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        self.assertEqual(safety_meta.get("pattern_confidence_cap"), 60)


class TestUrgentAttentionSetsOverrideFlag(unittest.TestCase):
    """Test 9.2.2 — urgent attention sets override flag."""

    def test_override_normal_pattern_explanation_true(self):
        survey = SimpleNamespace(raw_fields={}, modifier_flags={})
        signal_scores = _scores(("SYM_HEAVY_BLEED", 70), ("SYM_DIZZINESS", 60))
        _, safety_meta = evaluate_safety(
            survey, signal_scores, [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        self.assertTrue(safety_meta.get("override_normal_pattern_explanation"))


class TestClusterOverridesUnioned(unittest.TestCase):
    """Test 9.2.3 — cluster overrides unioned."""

    def test_safe02_and_safe12_cluster_overrides(self):
        survey = SimpleNamespace(
            raw_fields={},
            modifier_flags={},
            symptom_inputs=[SimpleNamespace(symptom_id="SYM_DIARRHEA", duration_days=7)],
        )
        signal_scores = _scores(
            ("SYM_HEAVY_BLEED", 70),
            ("SYM_DIZZINESS", 60),
            ("SYM_DIARRHEA", 50),
        )
        _, safety_meta = evaluate_safety(
            survey, signal_scores, [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        overrides = safety_meta.get("cluster_overrides", [])
        self.assertIn("CL_IRON_PATTERN", overrides)
        self.assertIn("CL_GUT_PATTERN", overrides)
        self.assertEqual(len(overrides), 2)


class TestLensRemainsActiveButSoftened(unittest.TestCase):
    """Test 9.2.4 — lens remains active but softened."""

    def test_lens_softened_true_no_removal_flag(self):
        survey = SimpleNamespace(missed_period_3mo="yes", raw_fields={}, modifier_flags={})
        _, safety_meta = evaluate_safety(
            survey, [], [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        self.assertTrue(safety_meta.get("lens_softened"))
        self.assertNotIn("lens_removed", safety_meta)
        self.assertIsNone(safety_meta.get("lens_removed"))


class TestNoPromptsLeavesOverridesOff(unittest.TestCase):
    """Test 9.2.5 — no safety prompts leaves overrides off."""

    def test_zero_prompts_no_cap_soften_overrides(self):
        survey = SimpleNamespace(raw_fields={}, modifier_flags={})
        signal_scores = _scores(("SYM_FATIGUE", 20))
        _, safety_meta = evaluate_safety(
            survey, signal_scores, [], [], get_default_registry(), DEFAULT_CONFIG, derived_flags={}
        )
        self.assertIsNone(safety_meta.get("pattern_confidence_cap"))
        self.assertFalse(safety_meta.get("soften_explanations"))
        self.assertFalse(safety_meta.get("lens_softened"))
        self.assertEqual(safety_meta.get("cluster_overrides"), [])

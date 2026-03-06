"""
Tests for Task 10.2 — Lens Card Output Object + Template Selection.
"""

import unittest
from types import SimpleNamespace

from engine.output.templates.lens import (
    build_primary_lens_card,
    fallback_reason_tags,
    join_reason_tags,
    lens_focus,
    lens_title,
    template_mode_for_lens,
)


def _lens(primary_id="LENS_BASELINE", secondary_id=None, is_blended=False, primary_lens_score=0.0, lens_reason_tags=None, reasoning_trace_id=None):
    return SimpleNamespace(
        primary_lens_id=primary_id,
        secondary_lens_id=secondary_id,
        is_blended=is_blended,
        primary_lens_score=primary_lens_score,
        lens_reason_tags=lens_reason_tags or [],
        lens_confidence=None,
        reasoning_trace_id=reasoning_trace_id,
    )


class TestBaselineCard(unittest.TestCase):
    """Test 10.2.1 — baseline card."""

    def test_baseline_template_mode_and_title(self):
        lens = _lens(primary_id="LENS_BASELINE")
        card = build_primary_lens_card(lens, None, None)
        self.assertEqual(card["template_mode"], "baseline")
        self.assertEqual(card["title"], "Baseline view")

    def test_no_lens_baseline(self):
        card = build_primary_lens_card(None, None, None)
        self.assertEqual(card["template_mode"], "baseline")
        self.assertEqual(card["title"], "Baseline view")
        self.assertEqual(card["primary_lens_id"], "LENS_BASELINE")


class TestBlendedCard(unittest.TestCase):
    """Test 10.2.2 — blended card."""

    def test_blended_template_mode_title_and_body(self):
        lens = _lens(
            primary_id="LENS_STRESS_RECOVERY",
            secondary_id="LENS_ENERGY_METABOLIC",
            is_blended=True,
            primary_lens_score=55.0,
            lens_reason_tags=["stress load", "sleep disruption", "energy variability"],
        )
        card = build_primary_lens_card(lens, None, None)
        self.assertEqual(card["template_mode"], "blended")
        self.assertIn("Stress & Recovery Regulation", card["title"])
        self.assertIn("Energy Regulation & Metabolic Stability", card["title"])
        self.assertIn("stress load and recovery", card["body"])
        self.assertIn("energy regulation and metabolic stability", card["body"])
        self.assertIn("blend", card["body"].lower())


class TestStrongPrimaryCard(unittest.TestCase):
    """Test 10.2.3 — strong primary card."""

    def test_strong_primary_with_reason_tags(self):
        lens = _lens(
            primary_id="LENS_STRESS_RECOVERY",
            primary_lens_score=72.0,
            lens_reason_tags=["stress load", "sleep disruption", "recovery mismatch"],
        )
        card = build_primary_lens_card(lens, None, None)
        self.assertEqual(card["template_mode"], "strong_primary")
        self.assertIn("Driven by:", card["body"])
        self.assertIn("stress load", card["body"])
        self.assertIn("sleep disruption", card["body"])
        self.assertIn("recovery mismatch", card["body"])
        self.assertEqual(card["reason_tags"], ["stress load", "sleep disruption", "recovery mismatch"])


class TestFallbackReasonTags(unittest.TestCase):
    """Test 10.2.4 — fallback reason tags when empty."""

    def test_gut_lens_no_tags_uses_fallback(self):
        lens = _lens(primary_id="LENS_GUT_ABSORPTION", lens_reason_tags=[])
        card = build_primary_lens_card(lens, None, None)
        self.assertEqual(card["template_mode"], "strong_primary")
        expected_fallback = fallback_reason_tags("LENS_GUT_ABSORPTION")
        self.assertEqual(card["reason_tags"], expected_fallback)
        self.assertIn("gut variability", card["reason_tags"])
        self.assertIn("bloating / digestion", card["reason_tags"])

    def test_join_reason_tags(self):
        self.assertEqual(join_reason_tags(["a", "b", "c"]), "a, b, c")
        self.assertEqual(join_reason_tags([]), "")

    def test_lens_title_and_focus(self):
        self.assertEqual(lens_title("LENS_GUT_ABSORPTION"), "Gut Comfort & Absorption Context")
        self.assertEqual(lens_focus("LENS_GUT_ABSORPTION"), "digestion and absorption-related variability")

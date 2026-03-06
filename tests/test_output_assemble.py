"""
Tests for Task 10.1 — Final Engine Output Assembly.
"""

import unittest
from types import SimpleNamespace

from engine.output.assemble import (
    assemble_engine_output,
    build_dashboard_sections,
    compute_cycle_status,
    compute_last_updated_days,
)
from engine.types import EngineInput, EngineOutput, LensResult


def _minimal_input():
    return EngineInput(user_id="u1", timestamp="2025-01-01T00:00:00Z", time_window="7d")


def _minimal_survey(life_stage=None):
    s = SimpleNamespace(raw_fields={}, modifier_flags={}, has_periods=True, contraception_type=None)
    s.life_stage = life_stage
    return s


class TestOutputObjectCreated(unittest.TestCase):
    """Test 10.1.1 — output object created."""

    def test_returns_engine_output(self):
        engine_input = _minimal_input()
        survey = _minimal_survey()
        output = assemble_engine_output(
            engine_input,
            survey,
            [],
            [],
            [],
            [],
            LensResult(),
            [],
            {},
            None,
            None,
            None,
        )
        self.assertIsInstance(output, EngineOutput)
        self.assertEqual(output.user_id, "u1")
        self.assertEqual(output.timestamp, "2025-01-01T00:00:00Z")
        self.assertIsNotNone(output.debug_meta)


class TestCycleStatusAssignedCorrectly(unittest.TestCase):
    """Test 10.1.2 — cycle status assigned correctly."""

    def test_ls_peri_gives_perimenopause(self):
        survey = _minimal_survey(life_stage="LS_PERI")
        output = assemble_engine_output(
            _minimal_input(),
            survey,
            [], [], [], [], LensResult(), [], {}, None, None, None,
        )
        self.assertEqual(output.cycle_status, "perimenopause")

    def test_compute_cycle_status_helper(self):
        self.assertEqual(compute_cycle_status(_minimal_survey("LS_PERI")), "perimenopause")
        self.assertEqual(compute_cycle_status(_minimal_survey("LS_MENO")), "menopause")
        self.assertEqual(compute_cycle_status(_minimal_survey("LS_POSTPARTUM")), "postpartum")
        self.assertEqual(compute_cycle_status(_minimal_survey("LS_BREASTFEED")), "breastfeeding")
        self.assertEqual(compute_cycle_status(_minimal_survey("LS_REPRO")), "cycling")


class TestPlaceholderArraysExist(unittest.TestCase):
    """Test 10.1.3 — placeholder arrays exist."""

    def test_all_placeholder_lists_exist(self):
        output = assemble_engine_output(
            _minimal_input(),
            _minimal_survey(),
            [], [], [], [], LensResult(), [], {}, None, None, None,
        )
        self.assertIsInstance(output.watch_items, list)
        self.assertIsInstance(output.lab_awareness, list)
        self.assertIsInstance(output.biological_priorities, list)
        self.assertIsInstance(output.weekly_insights, list)


class TestDashboardSectionKeysExist(unittest.TestCase):
    """Test 10.1.4 — dashboard section keys exist."""

    def test_required_section_keys_present(self):
        output = assemble_engine_output(
            _minimal_input(),
            _minimal_survey(),
            [], [], [], [], LensResult(), [], {}, None, None, None,
        )
        sections = output.dashboard_sections
        self.assertIn("primary_lens_card", sections)
        self.assertIn("systems_map", sections)
        self.assertIn("system_detail_inspector", sections)
        self.assertIn("clusters_panel", sections)
        self.assertIn("root_patterns_panel", sections)
        self.assertIn("safety_panel", sections)

    def test_primary_lens_card_has_template_shape(self):
        output = assemble_engine_output(
            _minimal_input(),
            _minimal_survey(),
            [], [], [], [], LensResult(), [], {}, None, None, None,
        )
        card = output.dashboard_sections["primary_lens_card"]
        self.assertIn("title", card)
        self.assertIn("body", card)
        self.assertIn("template_mode", card)
        self.assertIn("reason_tags", card)
        self.assertIn("show_reasoning_trace_id", card)
        self.assertEqual(card["template_mode"], "baseline")
        self.assertEqual(card["title"], "Baseline view")

    def test_compute_last_updated_days_mvp(self):
        self.assertEqual(compute_last_updated_days(_minimal_input()), 0)

"""
Tests for Task 10.3 — Systems Map / Inspector Output Objects.
"""

import unittest
from types import SimpleNamespace

from engine.output.templates.systems import (
    DASHBOARD_SYSTEM_ORDER,
    build_system_detail_inspector,
    build_systems_map,
    choose_default_selected_system,
    driver_label,
    system_label,
    system_short_explanation,
)


def _sys(system_id: str, score: float = 0.0, status: str = "stable", top_drivers=None):
    return SimpleNamespace(
        system_id=system_id,
        score=score,
        status=status,
        top_drivers=top_drivers or [],
        reasoning_trace_id=None,
    )


class TestSystemsOrderedCorrectly(unittest.TestCase):
    """Test 10.3.1 — systems ordered correctly."""

    def test_output_items_follow_dashboard_order(self):
        systems = [
            _sys("SYS_NUTRITION", 30.0),
            _sys("SYS_STRESS", 50.0),
            _sys("SYS_HORMONAL", 40.0),
        ]
        result = build_systems_map(systems, None, None)
        order = [item["system_id"] for item in result["items"]]
        expected_order = [sid for sid in DASHBOARD_SYSTEM_ORDER if sid in {s.system_id for s in systems}]
        self.assertEqual(order, expected_order)


class TestSelectedSystemPrefersNonStable(unittest.TestCase):
    """Test 10.3.2 — selected system prefers non-stable."""

    def test_variable_system_selected_over_stable(self):
        systems = [
            _sys("SYS_HORMONAL", 30.0, "stable"),
            _sys("SYS_METABOLIC", 45.0, "variable"),
            _sys("SYS_STRESS", 25.0, "stable"),
        ]
        result = build_systems_map(systems, None, None)
        self.assertEqual(result["selected_system_id"], "SYS_METABOLIC")

    def test_choose_default_selected_system_helper(self):
        systems = [
            _sys("SYS_STRESS", 60.0, "needs_attention"),
            _sys("SYS_HORMONAL", 20.0, "stable"),
        ]
        self.assertEqual(choose_default_selected_system(systems), "SYS_STRESS")


class TestExplanationUsesDrivers(unittest.TestCase):
    """Test 10.3.3 — explanation uses drivers."""

    def test_needs_attention_mentions_driver_labels(self):
        system = _sys(
            "SYS_STRESS",
            score=68.0,
            status="needs_attention",
            top_drivers=["CL_STRESS_ACCUM", "CL_SLEEP_DISRUPT"],
        )
        explanation = system_short_explanation(system)
        self.assertIn("stress load", explanation)
        self.assertIn("sleep disruption", explanation)


class TestStableExplanationTemplate(unittest.TestCase):
    """Test 10.3.4 — stable explanation template works."""

    def test_stable_metabolic_says_steady(self):
        system = _sys("SYS_METABOLIC", 25.0, "stable", [])
        explanation = system_short_explanation(system)
        self.assertIn("relatively steady", explanation)
        self.assertIn("Metabolic Health", explanation)


class TestInspectorMirrorsSelectedSystem(unittest.TestCase):
    """Test 10.3.5 — inspector mirrors selected system."""

    def test_inspector_uses_same_selected_system_id_as_map(self):
        systems = [
            _sys("SYS_HORMONAL", 20.0, "stable"),
            _sys("SYS_STRESS", 65.0, "needs_attention", ["CL_STRESS_ACCUM"]),
        ]
        map_result = build_systems_map(systems, None, None)
        selected = map_result["selected_system_id"]
        inspector = build_system_detail_inspector(systems, selected, None, None)
        self.assertEqual(inspector["system_id"], selected)
        self.assertEqual(inspector["system_id"], "SYS_STRESS")
        self.assertEqual(inspector["score"], 65.0)
        self.assertEqual(inspector["status"], "needs_attention")

    def test_system_label_and_driver_label(self):
        self.assertEqual(system_label("SYS_STRESS"), "Stress Response")
        self.assertEqual(driver_label("CL_STRESS_ACCUM"), "stress load")

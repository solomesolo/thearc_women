"""
Task 12.2 — Engine invariant tests.
Tests that invariant checks catch invalid output and pass on real fixture outputs.
"""

import unittest

from engine.config import DEFAULT_CONFIG
from engine.ids.registry import get_default_registry
from engine.run import run_engine
from engine.types import (
    ClusterResult,
    EngineOutput,
    LensResult,
    RootPatternResult,
    SystemResult,
)

from tests.golden.helpers import engine_input_from_fixture, load_golden_fixture
from tests.validation.helpers import (
    assert_blended_lens_consistency,
    assert_engine_invariants,
    assert_no_duplicate_ids,
    assert_scores_in_bounds,
)


def _minimal_valid_output(registry) -> EngineOutput:
    """Minimal EngineOutput that passes invariants (for building bad variants)."""
    return EngineOutput(
        user_id="v",
        timestamp="2026-03-06T10:00:00Z",
        time_window="7d",
        clusters=[
            ClusterResult("CL_ENERGY_VAR", strength=50.0, confidence=60.0, reasoning_trace_id="cluster:CL_ENERGY_VAR:abc"),
        ],
        systems=[
            SystemResult("SYS_STRESS", score=50.0, status="stable", reasoning_trace_id="system:SYS_STRESS:abc"),
        ],
        root_patterns=[
            RootPatternResult("RP_STRESS_LOAD", score=50.0, confidence=50.0, reasoning_trace_id="pattern:RP_STRESS_LOAD:abc"),
        ],
        lens=LensResult(
            primary_lens_id="LENS_BASELINE",
            primary_lens_score=0.0,
            is_blended=False,
            secondary_lens_id=None,
            reasoning_trace_id="lens:LENS_BASELINE:abc",
        ),
        safety_prompts=[],
        dashboard_sections={},
        debug_meta={},
    )


class TestInvariantBoundsCatchesInvalidScore(unittest.TestCase):
    """Test 1 — invariant bounds check catches invalid score."""

    def test_score_above_100_fails(self):
        registry = get_default_registry()
        out = _minimal_valid_output(registry)
        out.clusters = [ClusterResult("CL_ENERGY_VAR", strength=150.0, confidence=60.0, reasoning_trace_id="t")]
        with self.assertRaises(AssertionError) as ctx:
            assert_scores_in_bounds(out)
        self.assertIn("out of bounds", str(ctx.exception))
        self.assertIn("150", str(ctx.exception))


class TestDuplicateIdsDetected(unittest.TestCase):
    """Test 2 — duplicate IDs detected."""

    def test_duplicate_cluster_id_fails(self):
        registry = get_default_registry()
        out = _minimal_valid_output(registry)
        out.clusters = [
            ClusterResult("CL_ENERGY_VAR", strength=50.0, confidence=60.0, reasoning_trace_id="t1"),
            ClusterResult("CL_ENERGY_VAR", strength=40.0, confidence=50.0, reasoning_trace_id="t2"),
        ]
        with self.assertRaises(AssertionError) as ctx:
            assert_no_duplicate_ids(out)
        self.assertIn("Duplicate cluster ID", str(ctx.exception))


class TestBlendedLensConsistencyChecked(unittest.TestCase):
    """Test 3 — blended lens consistency checked."""

    def test_blended_without_secondary_fails(self):
        registry = get_default_registry()
        out = _minimal_valid_output(registry)
        out.lens = LensResult(
            primary_lens_id="LENS_STRESS_RECOVERY",
            primary_lens_score=60.0,
            is_blended=True,
            secondary_lens_id=None,
            reasoning_trace_id="lens:l:abc",
        )
        with self.assertRaises(AssertionError) as ctx:
            assert_blended_lens_consistency(out)
        self.assertIn("is_blended", str(ctx.exception))
        self.assertIn("secondary_lens_id", str(ctx.exception))


class TestAllGoldenFixturesPassInvariants(unittest.TestCase):
    """Test 4 — all golden fixtures pass invariants."""

    def test_invariants_pass_on_all_golden_fixtures(self):
        registry = get_default_registry()
        names = [
            "iron_pattern",
            "stress_sleep",
            "sugar_instability",
            "thyroid_context",
            "gut_pattern",
            "perimenopause_sleep",
            "training_mismatch",
            "baseline_low_signal",
            "safety_heavy_bleeding_dizziness",
            "safety_persistent_diarrhea",
            "postpartum_info",
            "cycle_acne_hairloss",
        ]
        for name in names:
            fixture = load_golden_fixture(name)
            engine_input = engine_input_from_fixture(fixture)
            output = run_engine(engine_input, DEFAULT_CONFIG)
            try:
                assert_engine_invariants(output, registry, DEFAULT_CONFIG)
            except AssertionError as e:
                self.fail(f"Fixture {name} failed invariants: {e}")


class TestTraceAttachmentInvariant(unittest.TestCase):
    """Test 5 — trace attachment invariant: when traces enabled, every major entity has trace ID."""

    def test_trace_ids_present_when_traces_enabled(self):
        registry = get_default_registry()
        # DEFAULT_CONFIG has enable_reasoning_traces=True; run_engine attaches trace IDs
        fixture = load_golden_fixture("baseline_low_signal")
        engine_input = engine_input_from_fixture(fixture)
        output = run_engine(engine_input, DEFAULT_CONFIG)
        # assert_engine_invariants includes assert_trace_ids_when_enabled
        assert_engine_invariants(output, registry, DEFAULT_CONFIG)
        self.assertIsNotNone(output.lens.reasoning_trace_id)
        for c in output.clusters:
            self.assertIsNotNone(c.reasoning_trace_id, f"Cluster {c.cluster_id} missing trace ID")
        for s in output.systems:
            self.assertIsNotNone(s.reasoning_trace_id, f"System {s.system_id} missing trace ID")

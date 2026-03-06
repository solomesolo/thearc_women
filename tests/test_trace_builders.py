"""
Tests for Task 11.1 — Reasoning Trace Object Model and Trace Builders.
Tests for Task 11.2 — Attach Reasoning Trace References Across Engine Outputs.
"""

import unittest
from types import SimpleNamespace

from engine.trace.builders import (
    attach_reasoning_traces,
    attach_trace_id_to_dashboard_sections,
    build_cluster_trace,
    build_pattern_trace,
    build_safety_trace,
    build_system_trace,
    stable_trace_id,
    trace_store_to_debug_dict,
)
from engine.trace.store import TraceStore
from engine.types import (
    ClusterResult,
    EngineOutput,
    LensResult,
    ReasoningTrace,
    RootPatternResult,
    SafetyPrompt,
    SignalScore,
    SystemResult,
)


def _cluster(cluster_id="CL_ENERGY_VAR", strength=62.0, confidence=71.0, supporting_signals=None, confounders=None):
    return SimpleNamespace(
        cluster_id=cluster_id,
        strength=strength,
        confidence=confidence,
        supporting_signals=supporting_signals or ["SYM_FATIGUE", "SYM_AFTERNOON_CRASH"],
        confounders_applied=confounders or ["sleep_overlap"],
    )


def _system(system_id="SYS_STRESS", score=68.0, status="needs_attention", top_drivers=None):
    return SimpleNamespace(
        system_id=system_id,
        score=score,
        status=status,
        top_drivers=top_drivers or ["CL_STRESS_ACCUM", "CL_SLEEP_DISRUPT"],
        reasoning_trace_id=None,
    )


def _pattern(pattern_id="RP_BLOOD_SUGAR", score=55.0, confidence=50.0, evidence_level="High", explain_meta=None):
    return SimpleNamespace(
        pattern_id=pattern_id,
        score=score,
        confidence=confidence,
        evidence_level=evidence_level,
        explain_meta=explain_meta or {"contributing_clusters": ["CL_ENERGY_VAR", "CL_SUGAR_INSTAB"], "fallback_only": False},
    )


def _safety_prompt(rule_id="SAFE02", priority="high", message_type="urgent attention", trigger_signals=None, cluster_override=None):
    return SimpleNamespace(
        safety_rule_id=rule_id,
        priority=priority,
        message_type=message_type,
        trigger_signals=trigger_signals or ["heavy_bleeding", "dizziness"],
        cluster_override=cluster_override or ["CL_IRON_PATTERN"],
    )


class TestDeterministicTraceId(unittest.TestCase):
    """Test 11.1.1 — deterministic trace ID."""

    def test_same_payload_same_trace_id(self):
        payload = {"a": 1, "b": 2}
        id1 = stable_trace_id("cluster", "CL_ENERGY_VAR", payload)
        id2 = stable_trace_id("cluster", "CL_ENERGY_VAR", payload)
        self.assertEqual(id1, id2)
        self.assertTrue(id1.startswith("cluster:CL_ENERGY_VAR:"))

    def test_different_payload_different_id(self):
        id1 = stable_trace_id("cluster", "CL_X", {"x": 1})
        id2 = stable_trace_id("cluster", "CL_X", {"x": 2})
        self.assertNotEqual(id1, id2)


class TestClusterTraceIncludesSupportingSignals(unittest.TestCase):
    """Test 11.1.2 — cluster trace includes supporting signals."""

    def test_inputs_include_supporting_signals(self):
        cluster = _cluster()
        signal_scores = [SignalScore(symptom_id="SYM_FATIGUE", score=68.0, missing_fields=[]),
                         SignalScore(symptom_id="SYM_AFTERNOON_CRASH", score=60.0, missing_fields=[])]
        trace = build_cluster_trace(cluster, signal_scores, {})
        self.assertIn("supporting_signals", trace.inputs)
        self.assertEqual(len(trace.inputs["supporting_signals"]), 2)
        self.assertEqual(trace.trace_type, "cluster")
        self.assertEqual(trace.entity_id, "CL_ENERGY_VAR")


class TestSystemTraceIncludesContributingClusters(unittest.TestCase):
    """Test 11.1.3 — system trace includes contributing clusters."""

    def test_contributing_clusters_present(self):
        system = _system()
        clusters = [
            _cluster("CL_STRESS_ACCUM", 70.0, 78.0, [], []),
            _cluster("CL_SLEEP_DISRUPT", 55.0, 72.0, [], []),
        ]
        trace = build_system_trace(system, clusters)
        self.assertIn("contributing_clusters", trace.inputs)
        self.assertEqual(len(trace.inputs["contributing_clusters"]), 2)
        self.assertEqual(trace.outputs["top_drivers"], ["CL_STRESS_ACCUM", "CL_SLEEP_DISRUPT"])


class TestPatternTraceIncludesEvidenceLevel(unittest.TestCase):
    """Test 11.1.4 — pattern trace includes evidence level."""

    def test_outputs_include_evidence_level(self):
        pattern = _pattern(evidence_level="Moderate")
        trace = build_pattern_trace(pattern, None)
        self.assertIn("evidence_level", trace.outputs)
        self.assertEqual(trace.outputs["evidence_level"], "Moderate")
        self.assertEqual(trace.trace_type, "pattern")


class TestTraceStoreAddGet(unittest.TestCase):
    """Test 11.1.5 — trace store add/get works."""

    def test_stored_trace_retrievable(self):
        store = TraceStore()
        trace = build_cluster_trace(_cluster(), [], {})
        tid = store.add(trace)
        self.assertEqual(tid, trace.trace_id)
        retrieved = store.get(trace.trace_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.entity_id, trace.entity_id)
        self.assertEqual(retrieved.trace_type, trace.trace_type)

    def test_as_dict(self):
        store = TraceStore()
        trace = build_safety_trace(_safety_prompt(), None)
        store.add(trace)
        d = store.as_dict()
        self.assertIn(trace.trace_id, d)
        self.assertEqual(d[trace.trace_id]["entity_id"], "SAFE02")


# --- Task 11.2: Attach reasoning traces to engine output ---


def _minimal_engine_output_for_traces():
    """Minimal EngineOutput with clusters, systems, lens, safety_prompts and dashboard_sections."""
    clusters = [
        ClusterResult(cluster_id="CL_A", strength=50.0, confidence=60.0, supporting_signals=["s1"], confounders_applied=[]),
        ClusterResult(cluster_id="CL_B", strength=55.0, confidence=70.0, supporting_signals=["s2"], confounders_applied=[]),
    ]
    systems = [
        SystemResult(system_id="SYS_X", score=60.0, status="stable", top_drivers=["CL_A"]),
        SystemResult(system_id="SYS_Y", score=65.0, status="needs_attention", top_drivers=["CL_B"]),
    ]
    root_patterns = [
        RootPatternResult(pattern_id="RP_1", score=50.0, confidence=50.0, explain_meta={"contributing_clusters": ["CL_A"]}),
    ]
    lens = LensResult(primary_lens_id="LENS_BASELINE", primary_lens_score=0.7, explain_meta={"contributing_systems": ["SYS_X"]})
    safety_prompts = [
        SafetyPrompt(safety_rule_id="SAFE01", priority="high", message_type="attention"),
        SafetyPrompt(safety_rule_id="SAFE02", priority="medium", message_type="info"),
    ]
    dashboard_sections = {
        "primary_lens_card": {"title": "Lens", "body": "", "show_reasoning_trace_id": None},
        "systems_map": {
            "items": [
                {"system_id": "SYS_X", "label": "X", "reasoning_trace_id": None},
                {"system_id": "SYS_Y", "label": "Y", "reasoning_trace_id": None},
            ],
            "selected_system_id": "SYS_X",
        },
        "system_detail_inspector": {"system_id": "SYS_X", "show_reasoning_trace_id": None},
        "safety_panel": {
            "prompts": [
                {"safety_rule_id": "SAFE01", "reasoning_trace_id": None},
                {"safety_rule_id": "SAFE02", "reasoning_trace_id": None},
            ],
        },
    }
    return EngineOutput(
        user_id="u1",
        timestamp="2025-01-01",
        time_window="7d",
        signal_scores=[],
        clusters=clusters,
        systems=systems,
        root_patterns=root_patterns,
        lens=lens,
        safety_prompts=safety_prompts,
        dashboard_sections=dashboard_sections,
        debug_meta={"derived_flags": {}},
    )


class Test112ClustersReceiveTraceIds(unittest.TestCase):
    """Test 11.2.1 — every cluster has non-null reasoning_trace_id after attach."""

    def test_clusters_receive_trace_ids(self):
        output = _minimal_engine_output_for_traces()
        registry = config = None
        result = attach_reasoning_traces(output, registry, config)
        self.assertIs(result, output)
        for cluster in result.clusters:
            self.assertIsNotNone(cluster.reasoning_trace_id, f"cluster {cluster.cluster_id} should have reasoning_trace_id")
            self.assertTrue(cluster.reasoning_trace_id.startswith("cluster:"))


class Test112LensCardReceivesTraceId(unittest.TestCase):
    """Test 11.2.2 — primary_lens_card has show_reasoning_trace_id populated."""

    def test_lens_card_show_reasoning_trace_id(self):
        output = _minimal_engine_output_for_traces()
        attach_reasoning_traces(output, None, None)
        card = output.dashboard_sections.get("primary_lens_card")
        self.assertIsNotNone(card)
        self.assertIn("show_reasoning_trace_id", card)
        self.assertIsNotNone(card["show_reasoning_trace_id"])
        self.assertTrue(card["show_reasoning_trace_id"].startswith("lens:"))


class Test112SystemsMapItemsReceiveTraceIds(unittest.TestCase):
    """Test 11.2.3 — each systems_map item has reasoning_trace_id."""

    def test_systems_map_items_have_reasoning_trace_id(self):
        output = _minimal_engine_output_for_traces()
        attach_reasoning_traces(output, None, None)
        items = output.dashboard_sections.get("systems_map", {}).get("items", [])
        self.assertGreater(len(items), 0)
        for item in items:
            self.assertIn("reasoning_trace_id", item)
            self.assertIsNotNone(item["reasoning_trace_id"])
            self.assertTrue(item["reasoning_trace_id"].startswith("system:"))


class Test112TraceStoreSerializedInDebugMeta(unittest.TestCase):
    """Test 11.2.4 — debug_meta['reasoning_traces'] exists and is non-empty."""

    def test_reasoning_traces_in_debug_meta(self):
        output = _minimal_engine_output_for_traces()
        attach_reasoning_traces(output, None, None)
        traces = output.debug_meta.get("reasoning_traces")
        self.assertIsNotNone(traces)
        self.assertIsInstance(traces, dict)
        self.assertGreater(len(traces), 0)
        for trace_id, data in traces.items():
            self.assertIn("trace_type", data)
            self.assertIn("entity_id", data)
            self.assertIn("summary", data)
            self.assertIn("inputs", data)
            self.assertIn("calculations", data)
            self.assertIn("outputs", data)
            self.assertIn("links", data)


class Test112SafetyPromptsReceiveTraceIds(unittest.TestCase):
    """Test 11.2.5 — every safety prompt has non-null reasoning_trace_id."""

    def test_safety_prompts_receive_trace_ids(self):
        output = _minimal_engine_output_for_traces()
        attach_reasoning_traces(output, None, None)
        for prompt in output.safety_prompts:
            self.assertIsNotNone(prompt.reasoning_trace_id, f"prompt {prompt.safety_rule_id} should have reasoning_trace_id")
            self.assertTrue(prompt.reasoning_trace_id.startswith("safety:"))

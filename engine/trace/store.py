"""
Trace storage. In-memory store for reasoning traces; no DB.
"""

from typing import Any, Dict, Optional

from engine.types import ReasoningTrace


class TraceStore:
    """Lightweight in-memory store for ReasoningTrace objects."""

    def __init__(self) -> None:
        self._traces: Dict[str, ReasoningTrace] = {}

    def add(self, trace: ReasoningTrace) -> str:
        self._traces[trace.trace_id] = trace
        return trace.trace_id

    def get(self, trace_id: str) -> Optional[ReasoningTrace]:
        return self._traces.get(trace_id)

    def as_dict(self) -> Dict[str, Dict[str, Any]]:
        """Return traces as dict of trace_id -> serializable dict (for debug_meta etc.)."""
        out: Dict[str, Dict[str, Any]] = {}
        for tid, t in self._traces.items():
            out[tid] = {
                "trace_id": t.trace_id,
                "trace_type": t.trace_type,
                "entity_id": t.entity_id,
                "summary": t.summary,
                "inputs": dict(t.inputs),
                "calculations": dict(t.calculations),
                "outputs": dict(t.outputs),
                "links": dict(t.links),
            }
        return out

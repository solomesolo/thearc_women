"""
Serialize EngineOutput to JSON-serializable dict for API responses.
"""

from dataclasses import asdict
from typing import Any, Dict

from engine.types import EngineOutput


def engine_output_to_dict(out: EngineOutput) -> Dict[str, Any]:
    """Convert EngineOutput to a JSON-serializable dict."""
    return asdict(out)

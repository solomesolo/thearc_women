"""
Safety: ensures no raw engine IDs or sensitive values leak to the UI.

Helpers to validate and sanitize view models before they are sent to the
dashboard. Used by the translator and builders to enforce the rule that
cluster_id, pattern_id, system_id, lens_id, and raw confidence are never
exposed.
"""

from __future__ import annotations

import re
from typing import Any


# Names that must not appear in view-model payloads consumed by the UI
FORBIDDEN_KEYS = frozenset({
    "cluster_id",
    "pattern_id",
    "system_id",
    "lens_id",
    "raw_confidence",
    "confidence_value",
    "internal_id",
})


def is_safe_key(key: str) -> bool:
    """Return True if the key is allowed in view models."""
    key_lower = key.lower()
    return key_lower not in FORBIDDEN_KEYS and not key_lower.endswith("_id")


def sanitize_extra(extra: dict[str, Any]) -> dict[str, Any]:
    """
    Return a copy of extra with any forbidden keys removed.
    Used for the 'extra' dict on view models.
    """
    return {k: v for k, v in extra.items() if is_safe_key(k)}


def validate_view_model_payload(payload: dict[str, Any]) -> None:
    """
    Raise ValueError if payload contains forbidden keys.
    Call before sending view models to the UI.
    """
    def check(d: dict[str, Any], path: str) -> None:
        for key in d:
            if not is_safe_key(key):
                raise ValueError(f"Forbidden key in view model at {path}: {key!r}")
            if isinstance(d[key], dict):
                check(d[key], f"{path}.{key}")

    check(payload, "root")

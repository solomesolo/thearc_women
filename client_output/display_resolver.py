"""
Canonical display dictionary resolver.

Replaces raw engine IDs with human-readable display_title and short_label.
Enforced constraints: display_title <= 40 chars, short_label <= 20 chars.
Missing entries raise DisplayDictionaryError; no silent fallback to raw IDs.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DISPLAY_TITLE_MAX_LEN = 40
SHORT_LABEL_MAX_LEN = 20

_DATA_PATH = Path(__file__).parent / "data" / "display_dictionary.json"
_CACHE: dict[str, dict[str, dict[str, str]]] | None = None


# ---------------------------------------------------------------------------
# Exception
# ---------------------------------------------------------------------------


class DisplayDictionaryError(LookupError):
    """Raised when a display dictionary lookup fails (missing ID)."""

    def __init__(self, category: str, entity_id: str) -> None:
        self.category = category
        self.entity_id = entity_id
        super().__init__(f"Display dictionary: unknown {category} id {entity_id!r}")


# ---------------------------------------------------------------------------
# Data loading and validation
# ---------------------------------------------------------------------------


def _load_data() -> dict[str, dict[str, dict[str, str]]]:
    global _CACHE
    if _CACHE is None:
        with open(_DATA_PATH, encoding="utf-8") as f:
            _CACHE = json.load(f)
    return _CACHE


def _get_entry(category: str, entity_id: str) -> dict[str, str]:
    data = _load_data()
    if category not in data:
        raise DisplayDictionaryError(category, entity_id)
    category_data = data[category]
    if entity_id not in category_data:
        raise DisplayDictionaryError(category, entity_id)
    return category_data[entity_id]


def _validate_entry(category: str, entity_id: str, entry: dict[str, str]) -> None:
    title = entry.get("display_title", "")
    label = entry.get("short_label", "")
    if len(title) > DISPLAY_TITLE_MAX_LEN:
        raise ValueError(
            f"Display dictionary: display_title for {category}/{entity_id} "
            f"exceeds {DISPLAY_TITLE_MAX_LEN} chars (got {len(title)})"
        )
    if len(label) > SHORT_LABEL_MAX_LEN:
        raise ValueError(
            f"Display dictionary: short_label for {category}/{entity_id} "
            f"exceeds {SHORT_LABEL_MAX_LEN} chars (got {len(label)})"
        )


def _resolve(category: str, entity_id: str) -> dict[str, str]:
    entry = _get_entry(category, entity_id)
    _validate_entry(category, entity_id, entry)
    return dict(entry)


# ---------------------------------------------------------------------------
# Resolver API (hard-fail on missing)
# ---------------------------------------------------------------------------


def resolve_cluster(entity_id: str) -> dict[str, str]:
    """Resolve cluster ID to display_title and short_label. Raises DisplayDictionaryError if missing."""
    return _resolve("clusters", entity_id)


def resolve_system(entity_id: str) -> dict[str, str]:
    """Resolve system ID to display_title and short_label. Raises DisplayDictionaryError if missing."""
    return _resolve("systems", entity_id)


def resolve_pattern(entity_id: str) -> dict[str, str]:
    """Resolve root pattern ID to display_title and short_label. Raises DisplayDictionaryError if missing."""
    return _resolve("root_patterns", entity_id)


def resolve_lab(entity_id: str) -> dict[str, str]:
    """Resolve lab ID to display_title and short_label. Raises DisplayDictionaryError if missing."""
    return _resolve("labs", entity_id)


def resolve_lens(entity_id: str) -> dict[str, str]:
    """Resolve lens ID to display_title and short_label. Raises DisplayDictionaryError if missing."""
    return _resolve("lenses", entity_id)


def resolve_message_type(entity_id: str) -> dict[str, str]:
    """Resolve safety message type ID to display_title and short_label. Raises DisplayDictionaryError if missing."""
    return _resolve("safety_message_types", entity_id)


# ---------------------------------------------------------------------------
# Helpers for tests and validation
# ---------------------------------------------------------------------------


def get_all_ids(category: str) -> set[str]:
    """Return the set of all known IDs for a category. Used by tests."""
    data = _load_data()
    if category not in data:
        return set()
    return set(data[category].keys())


def get_all_entries(category: str) -> dict[str, dict[str, str]]:
    """Return all entries for a category (id -> { display_title, short_label }). Used by tests."""
    data = _load_data()
    if category not in data:
        return {}
    return dict(data[category])

"""
Display dictionary: stable display keys for UI reference.

Maps internal engine concepts to stable, URL- and UI-safe display keys.
The dashboard uses these keys (e.g. for routing or lookups), not raw IDs.
"""

from __future__ import annotations

import re
from typing import Any


def slugify(s: str, max_length: int = 64) -> str:
    """Produce a URL-safe, readable key from a string."""
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s)
    return s[:max_length].strip("-")


def display_key(prefix: str, *parts: Any) -> str:
    """
    Build a stable display key from a prefix and parts (e.g. slugified names).
    Used so the UI can refer to items without ever seeing engine IDs.
    """
    joined = "-".join(str(p).strip() for p in parts if p is not None and str(p).strip())
    return f"{prefix}:{slugify(joined) or 'item'}"

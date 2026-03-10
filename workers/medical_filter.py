"""Medical language filter: replace prohibited phrases with safer alternatives (Task 18)."""
from __future__ import annotations

import re

REPLACEMENTS = [
    (r"\btreats\b", "may be associated with"),
    (r"\bcures\b", "is commonly linked to"),
    (r"\bdiagnoses\b", "is often observed in"),
    (r"\bprescribes\b", "is commonly used in"),
]


def apply_medical_filter(text: str | None) -> str:
    """Replace prohibited phrases in generated content. Returns empty string if text is None."""
    if not text or not text.strip():
        return ""
    out = text
    for pattern, replacement in REPLACEMENTS:
        out = re.sub(pattern, replacement, out, flags=re.IGNORECASE)
    return out

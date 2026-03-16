"""
Confidence-band translation: raw score -> display-safe bands only.

Replaces raw numbers (e.g. 35.7202%) with approved bands and user-facing text.
UI must show only confidence_label and confidence_text; raw decimal must not
appear unless a debug flag is enabled outside this package.

Policy for invalid scores: clamp to [0, 100]. Input may be 0–100 or 0–1 (normalized to 0–100).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Union

# ---------------------------------------------------------------------------
# Approved bands (0–100 scale)
# 0–39   -> Low signal
# 40–64  -> Moderate support
# 65–84  -> Strong support
# 85–100 -> Very strong support
# ---------------------------------------------------------------------------

LOW_SIGNAL_TEXT = (
    "A small number of signals suggest this pattern, but the evidence is limited."
)
MODERATE_SUPPORT_TEXT = (
    "Several signals align with this pattern, though additional context may help clarify it."
)
STRONG_SUPPORT_TEXT = (
    "Multiple signals consistently align with this pattern across your responses."
)
VERY_STRONG_SUPPORT_TEXT = (
    "Signals strongly align with this pattern, suggesting a consistent signal pattern in your data."
)


@dataclass(frozen=True)
class ConfidenceBand:
    """Display-safe confidence band; no raw numeric score exposed."""

    confidence_label: str
    confidence_text: str


def _normalize_score(score: Union[float, int]) -> float:
    """Clamp to [0, 100]. If score is in [0, 1], treat as fraction and scale to 0–100."""
    val = float(score)
    if 0 <= val <= 1:
        val = val * 100.0
    return max(0.0, min(100.0, val))


def map_confidence(score: Union[float, int]) -> ConfidenceBand:
    """
    Map a raw confidence score to an approved ConfidenceBand.

    Score may be 0–100 (e.g. 35.72) or 0–1 (e.g. 0.357); both are normalized.
    Values outside [0, 100] (or [0, 1]) are clamped to the nearest bound.
    Returns only confidence_label and confidence_text; no raw value.
    """
    s = _normalize_score(score)
    if s >= 85:
        return ConfidenceBand(
            confidence_label="Very strong support",
            confidence_text=VERY_STRONG_SUPPORT_TEXT,
        )
    if s >= 65:
        return ConfidenceBand(
            confidence_label="Strong support",
            confidence_text=STRONG_SUPPORT_TEXT,
        )
    if s >= 40:
        return ConfidenceBand(
            confidence_label="Moderate support",
            confidence_text=MODERATE_SUPPORT_TEXT,
        )
    return ConfidenceBand(
        confidence_label="Low signal",
        confidence_text=LOW_SIGNAL_TEXT,
    )


def map_confidence_optional(score: Optional[Union[float, int]]) -> ConfidenceBand:
    """
    Like map_confidence but accepts None; None is treated as 0 (Low signal).
    Use when engine may omit confidence.
    """
    if score is None:
        return ConfidenceBand(confidence_label="Low signal", confidence_text=LOW_SIGNAL_TEXT)
    return map_confidence(score)


# ---------------------------------------------------------------------------
# Legacy: DisplayConfidence / raw_to_display (unchanged for backward compatibility).
# Dashboard builders use map_confidence_optional for band labels/text.
# ---------------------------------------------------------------------------

from client_output.contracts import ConfidenceTier, DisplayConfidence

TIER_HIGH = ConfidenceTier(label="high", sort_order=3)
TIER_MEDIUM = ConfidenceTier(label="medium", sort_order=2)
TIER_LOW = ConfidenceTier(label="low", sort_order=1)
TIER_UNKNOWN = ConfidenceTier(label="unknown", sort_order=0)


def raw_to_display(
    raw_value: Optional[float],
    *,
    high_threshold: float = 0.7,
    low_threshold: float = 0.4,
) -> DisplayConfidence:
    """
    Legacy: map 0–1 or None to DisplayConfidence (tier + display_text).
    Does not expose raw value.
    """
    if raw_value is None:
        tier = TIER_UNKNOWN
        display_text = "—"
    elif raw_value >= high_threshold:
        tier = TIER_HIGH
        display_text = "High"
    elif raw_value >= low_threshold:
        tier = TIER_MEDIUM
        display_text = "Medium"
    else:
        tier = TIER_LOW
        display_text = "Low"
    return DisplayConfidence(tier=tier, display_text=display_text)

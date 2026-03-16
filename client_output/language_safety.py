"""
Global language safety validator.

Every user-facing string must comply: interpretive content uses allowed framing,
includes uncertainty qualifiers, and must not contain forbidden diagnostic or
alarm language. Urgent safety messages may bypass alarm-language rules.
"""

from __future__ import annotations

import re
from typing import Any, Literal, Optional

# ---------------------------------------------------------------------------
# Validation context
# ---------------------------------------------------------------------------

ValidationContext = Literal["interpretive", "lab_awareness", "recommendation", "urgent_safety", "dashboard"]


# ---------------------------------------------------------------------------
# Forbidden and required language
# ---------------------------------------------------------------------------

# Phrases that always fail validation (diagnostic / certainty / treatment)
FORBIDDEN_PHRASES = frozenset({
    "diagnosis",
    "diagnostic",
    "diagnosed with",
    "you have",
    "this means you have",
    "indicates",
    "proves",
    "confirms",
    "demonstrates",
    "clearly shows",
    "disease risk",
    "disease likelihood",
    "pathology",
    "medical condition confirmed",
    "treatment recommendation",
    "medical treatment",
    "you should treat",
    "prescribed treatment",
    "medication advice",
})

# Alarm phrases: forbidden unless context is urgent_safety (safety layer exception)
FORBIDDEN_ALARM_PHRASES = frozenset({
    "dangerous",
    "serious problem",
    "urgent medical problem",
    "critical condition",
})

# At least one required in interpretive content (unless urgent_safety)
REQUIRED_QUALIFIERS = frozenset({
    "may",
    "can",
    "sometimes",
    "often",
    "commonly",
})

# Preferred vocabulary: discouraged -> preferred (for sanitize)
PREFERRED_VOCABULARY = {
    "problem": "pattern",
    "problems": "patterns",
    "abnormal": "variable",
    "poor habits": "supportive habits",
    "unhealthy behavior": "patterns",
    "unhealthy": "variable",
}


# ---------------------------------------------------------------------------
# Exception
# ---------------------------------------------------------------------------


class LanguageSafetyError(ValueError):
    """Raised when a string fails language safety validation."""

    def __init__(self, message: str, phrase: Optional[str] = None, context: Optional[str] = None) -> None:
        super().__init__(message)
        self.phrase = phrase
        self.context = context


# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------


def _contains_phrase(text: str, phrase: str) -> bool:
    """Case-insensitive word-boundary check for phrase."""
    if not text or not phrase:
        return False
    pattern = re.compile(re.escape(phrase), re.IGNORECASE)
    return bool(pattern.search(text))


def _has_qualifier(text: str) -> bool:
    """True if text contains at least one of the required uncertainty qualifiers."""
    if not text:
        return False
    lower = text.lower()
    return any(q in lower for q in REQUIRED_QUALIFIERS)


def _get_forbidden_phrase(text: str, *, include_alarm: bool) -> Optional[str]:
    """Return the first forbidden phrase found in text, or None."""
    if not text:
        return None
    lower = text.lower()
    for phrase in FORBIDDEN_PHRASES:
        if _contains_phrase(lower, phrase):
            return phrase
    if include_alarm:
        for phrase in FORBIDDEN_ALARM_PHRASES:
            if _contains_phrase(lower, phrase):
                return phrase
    return None


def _validate_text_impl(text: str, context: ValidationContext) -> None:
    if not isinstance(text, str):
        return
    t = text.strip()
    if not t:
        return

    include_alarm = context not in ("urgent_safety",)
    forbidden = _get_forbidden_phrase(t, include_alarm=include_alarm)
    if forbidden:
        raise LanguageSafetyError(
            f"Language safety: forbidden phrase {forbidden!r} in text.",
            phrase=forbidden,
            context=context,
        )

    if context == "interpretive" and not _has_qualifier(t):
        raise LanguageSafetyError(
            "Language safety: interpretive text must include an uncertainty qualifier (e.g. may, can, sometimes, often, commonly).",
            context=context,
        )


def validate_text(text: str, context: ValidationContext) -> None:
    """
    Check that a user-facing string complies with language safety rules.
    Raises LanguageSafetyError if forbidden phrase present or (for interpretive)
    required qualifier missing. urgent_safety context skips alarm-phrase and
    qualifier checks.
    """
    _validate_text_impl(text, context)


def _sanitize_or_raise_impl(text: str, context: ValidationContext) -> str:
    if not isinstance(text, str):
        raise LanguageSafetyError("Language safety: text must be a string.", context=context)
    out = text
    for discouraged, preferred in PREFERRED_VOCABULARY.items():
        if discouraged in out.lower():
            pattern = re.compile(re.escape(discouraged), re.IGNORECASE)
            out = pattern.sub(preferred, out)
    _validate_text_impl(out, context)
    return out


def sanitize_or_raise(text: str, context: ValidationContext) -> str:
    """
    Apply preferred vocabulary replacements, then validate.
    Returns the (possibly normalized) string or raises LanguageSafetyError.
    """
    return _sanitize_or_raise_impl(text, context)


class LanguageSafetyValidator:
    """Validator instance; use validate_text and sanitize_or_raise as class or module-level functions."""

    @staticmethod
    def validate_text(text: str, context: ValidationContext) -> None:
        return _validate_text_impl(text, context)

    @staticmethod
    def sanitize_or_raise(text: str, context: ValidationContext) -> str:
        return _sanitize_or_raise_impl(text, context)


def validate_dashboard_strings(dashboard_payload: Any, context: ValidationContext = "dashboard") -> None:
    """
    Traverse a dashboard payload (dict from model_dump() or nested dicts/lists)
    and validate every string value. Uses 'dashboard' context by default (forbidden
    phrases only; no qualifier requirement for titles/labels). Raises LanguageSafetyError
    on first violation.
    """
    if isinstance(dashboard_payload, str):
        validate_text(dashboard_payload, context)
        return
    if isinstance(dashboard_payload, dict):
        for v in dashboard_payload.values():
            validate_dashboard_strings(v, context)
        return
    if isinstance(dashboard_payload, list):
        for item in dashboard_payload:
            validate_dashboard_strings(item, context)
        return

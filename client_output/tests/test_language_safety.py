"""
Tests for the global language safety validator.

- Forbidden phrase rejection: each banned phrase fails validation.
- Qualifier requirement: interpretive text must include may/can/sometimes/often/commonly.
- Preferred vocabulary: replacements or rejections for problem, abnormal, etc.
- Urgent safety exception: urgent_safety context may bypass alarm-language rules.
- Whole-dashboard validation: every string in DashboardVM output is validated.
"""

from __future__ import annotations

import pytest

from client_output.language_safety import (
    LanguageSafetyError,
    LanguageSafetyValidator,
    ValidationContext,
    validate_text,
    sanitize_or_raise,
    validate_dashboard_strings,
    FORBIDDEN_PHRASES,
    FORBIDDEN_ALARM_PHRASES,
)
from client_output.translator import build_dashboard_view


# ---------------------------------------------------------------------------
# Forbidden phrase rejection: each banned phrase must fail validation
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("phrase", sorted(FORBIDDEN_PHRASES))
def test_forbidden_phrase_rejected(phrase: str):
    """Each phrase in FORBIDDEN_PHRASES must cause validation to fail."""
    text = f"Some text that contains {phrase} in the middle."
    with pytest.raises(LanguageSafetyError) as exc_info:
        validate_text(text, "interpretive")
    # May detect this phrase or a substring (e.g. 'you have' inside 'this means you have')
    assert exc_info.value.phrase is not None
    assert exc_info.value.phrase in FORBIDDEN_PHRASES


@pytest.mark.parametrize("phrase", sorted(FORBIDDEN_ALARM_PHRASES))
def test_forbidden_alarm_phrase_rejected_in_interpretive(phrase: str):
    """Alarm phrases must fail when context is not urgent_safety."""
    text = f"Note: this is {phrase}."
    with pytest.raises(LanguageSafetyError):
        validate_text(text, "interpretive")


# ---------------------------------------------------------------------------
# Qualifier requirement: "This pattern reflects stress." fails; "may reflect" passes
# ---------------------------------------------------------------------------

def test_interpretive_without_qualifier_fails():
    with pytest.raises(LanguageSafetyError) as exc_info:
        validate_text("This pattern reflects stress.", "interpretive")
    assert "qualifier" in str(exc_info.value).lower()


def test_interpretive_with_qualifier_passes():
    validate_text("This pattern may reflect stress.", "interpretive")


def test_interpretive_can_passes():
    validate_text("Signals can suggest variability.", "interpretive")


def test_interpretive_sometimes_passes():
    validate_text("Patterns sometimes appear when stress is high.", "interpretive")


def test_interpretive_often_passes():
    validate_text("Patterns often appear in this context.", "interpretive")


def test_interpretive_commonly_passes():
    validate_text("Signals commonly associated with sleep.", "interpretive")


def test_lab_awareness_no_qualifier_required():
    """Non-interpretive context does not require qualifier."""
    validate_text("Lab value noted.", "lab_awareness")


# ---------------------------------------------------------------------------
# Preferred vocabulary: replacements or rejections
# ---------------------------------------------------------------------------

def test_sanitize_replaces_problem_with_pattern():
    out = sanitize_or_raise("This may suggest a problem.", "interpretive")
    assert "pattern" in out.lower()
    assert "problem" not in out.lower()


def test_sanitize_replaces_abnormal_with_variable():
    out = sanitize_or_raise("Readings may show abnormal variability.", "interpretive")
    assert "variable" in out.lower()
    assert "abnormal" not in out.lower()


def test_sanitize_replaces_poor_habits():
    out = sanitize_or_raise("Poor habits may affect signals.", "interpretive")
    assert "supportive habits" in out or "supportive" in out.lower()


def test_sanitize_replaces_unhealthy_behavior():
    out = sanitize_or_raise("Unhealthy behavior can change patterns.", "interpretive")
    assert "patterns" in out.lower()
    assert "unhealthy behavior" not in out.lower()


def test_validate_rejects_you_have_even_after_sanitize():
    """If forbidden phrase remains after replacement, sanitize_or_raise still raises."""
    with pytest.raises(LanguageSafetyError):
        sanitize_or_raise("You have a problem.", "interpretive")


# ---------------------------------------------------------------------------
# Urgent safety exception: alarm phrases allowed in urgent_safety context
# ---------------------------------------------------------------------------

def test_urgent_safety_allows_alarm_phrases():
    """In urgent_safety context, alarm phrases do not cause rejection."""
    for phrase in FORBIDDEN_ALARM_PHRASES:
        text = f"This is {phrase}."
        validate_text(text, "urgent_safety")


def test_urgent_safety_still_rejects_diagnostic_phrases():
    """urgent_safety does not bypass diagnostic/forbidden phrases."""
    with pytest.raises(LanguageSafetyError):
        validate_text("You have a diagnosis.", "urgent_safety")


def test_urgent_safety_no_qualifier_required():
    """urgent_safety context does not require uncertainty qualifier."""
    validate_text("Urgent medical problem requires attention.", "urgent_safety")


# ---------------------------------------------------------------------------
# Whole-dashboard validation: traverse every output string and validate
# ---------------------------------------------------------------------------

def test_validate_dashboard_strings_passes_for_safe_dashboard():
    """A dashboard built from safe content passes full validation."""
    raw = {
        "lenses": [{"lens_id": "LENS_BASELINE", "description": "Signals may reflect baseline."}],
        "systems": [{"system_id": "SYS_HORMONAL", "summary": "Patterns often align.", "status_label": "Stable"}],
        "root_patterns": [
            {
                "pattern_id": "RP_STRESS_LOAD",
                "summary": "Signals may suggest stress.",
                "expanded_explanation": "Patterns sometimes appear when stress is high.",
                "evidence_label": "Evidence",
                "caution_note": "",
            },
        ],
        "clusters": [
            {"cluster_id": "CL_ENERGY_VAR", "summary": "Variability can indicate energy swings.", "typical_signals": []},
        ],
        "watch_items": [],
        "lab_awareness": [],
        "recommendations": [],
        "preventive_strategies": [],
        "weekly_insights": [],
    }
    result = build_dashboard_view(raw)
    validate_dashboard_strings(result, "dashboard")


def test_validate_dashboard_strings_raises_on_unsafe():
    """If dashboard contains forbidden phrase, validation fails."""
    raw = {
        "lenses": [],
        "systems": [],
        "root_patterns": [
            {
                "title": "P",
                "short_label": "P",
                "summary": "Summary.",
                "expanded_explanation": "This diagnosis indicates a problem.",
                "evidence_label": "E",
                "caution_note": "",
            },
        ],
        "clusters": [],
        "watch_items": [],
        "lab_awareness": [],
        "recommendations": [],
        "preventive_strategies": [],
        "weekly_insights": [],
    }
    # Build view - root pattern will have the forbidden text in expanded_explanation
    from client_output.translator import build_dashboard_vm
    from client_output.confidence import map_confidence_optional
    from client_output.builders import build_root_pattern_view_models
    # Build with raw that has forbidden content
    patterns = build_root_pattern_view_models(raw["root_patterns"])
    # We need to get dashboard that includes this - build_dashboard_view uses builders which
    # take raw and produce VMs. So the VM will have expanded_explanation "This diagnosis indicates a problem."
    result = build_dashboard_view(raw)
    with pytest.raises(LanguageSafetyError):
        validate_dashboard_strings(result, "dashboard")


def test_language_safety_validator_class_api():
    """Class API mirrors module functions."""
    LanguageSafetyValidator.validate_text("Signals may suggest a pattern.", "interpretive")
    out = LanguageSafetyValidator.sanitize_or_raise("This may show a problem.", "interpretive")
    assert "pattern" in out.lower()

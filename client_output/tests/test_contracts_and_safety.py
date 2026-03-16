"""
Tests for contracts and safety: view models must not expose raw IDs.
"""

import pytest

from client_output.contracts import LensViewModel, DisplayConfidence
from client_output.confidence import raw_to_display
from client_output.safety import is_safe_key, FORBIDDEN_KEYS, validate_view_model_payload


def test_confidence_raw_not_exposed():
    """DisplayConfidence must not contain raw numeric value."""
    d = raw_to_display(0.9)
    assert d.tier.label == "high"
    assert d.display_text == "High"
    assert not hasattr(d, "raw_value") and "raw" not in str(d.tier)


def test_forbidden_keys_rejected():
    for key in FORBIDDEN_KEYS:
        assert is_safe_key(key) is False
    assert is_safe_key("display_key") is True
    assert is_safe_key("label") is True


def test_validate_view_model_payload_raises_on_forbidden():
    with pytest.raises(ValueError, match="cluster_id"):
        validate_view_model_payload({"cluster_id": "x"})
    with pytest.raises(ValueError, match="raw_confidence"):
        validate_view_model_payload({"nested": {"raw_confidence": 0.5}})


def test_validate_view_model_payload_allows_safe():
    validate_view_model_payload({"display_key": "lens:foo", "label": "Foo"})


def test_lens_view_model_has_display_key_not_id():
    vm = LensViewModel(
        display_key="lens:wellness",
        label="Wellness",
        description="...",
        sort_order=0,
    )
    assert hasattr(vm, "display_key")
    assert not hasattr(vm, "lens_id")

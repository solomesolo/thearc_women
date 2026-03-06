"""
Registry tests: default registry loads, legacy resolution, validation, enums.
"""

import unittest

from engine.errors import UnknownEntityIdError
from engine.ids.registry import get_default_registry


def test_default_registry_loads():
    registry = get_default_registry()
    assert registry.is_valid_symptom("SYM_FATIGUE")
    assert registry.is_valid_cluster("CL_ENERGY_VAR")
    assert registry.is_valid_system("SYS_SLEEP")


def test_legacy_root_pattern_resolves():
    registry = get_default_registry()
    assert registry.resolve_id("RP_SLEEP_DEPRIVE") == "RP_SLEEP_DEPRIVATION"


def test_invalid_symptom_raises():
    registry = get_default_registry()
    try:
        registry.require_symptom("SYM_NOT_REAL")
    except UnknownEntityIdError:
        return
    raise AssertionError("Expected UnknownEntityIdError")


def test_enum_values_present():
    registry = get_default_registry()
    assert registry.enums["system_status"] == ["stable", "variable", "needs_attention"]
    assert registry.enums["confidence_band"] == ["weak", "moderate", "strong", "very_strong"]
    assert registry.enums["evidence_level"] == [
        "High",
        "Moderate",
        "Emerging",
        "Clinical_Practice",
    ]


def test_get_label_returns_label():
    registry = get_default_registry()
    assert registry.get_label("SYM_FATIGUE") == "SYM Fatigue"
    assert registry.get_label("RP_SLEEP_DEPRIVE") == "RP Sleep Deprivation"


def test_require_returns_record():
    registry = get_default_registry()
    rec = registry.require_cluster("CL_ENERGY_VAR")
    assert rec["id"] == "CL_ENERGY_VAR"
    assert "label" in rec


class TestRegistry(unittest.TestCase):
    """Run the same tests via unittest for environments without pytest."""

    def test_default_registry_loads(self):
        test_default_registry_loads()

    def test_legacy_root_pattern_resolves(self):
        test_legacy_root_pattern_resolves()

    def test_invalid_symptom_raises(self):
        test_invalid_symptom_raises()

    def test_enum_values_present(self):
        test_enum_values_present()

    def test_get_label_returns_label(self):
        test_get_label_returns_label()

    def test_require_returns_record(self):
        test_require_returns_record()

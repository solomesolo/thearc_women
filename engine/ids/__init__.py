"""
Registry loading and ID/category validation only.
"""

from engine.ids.registry import (
    MedicalEntityRegistry,
    build_default_registry,
    get_default_registry,
    load_registry_from_path,
)
from engine.ids.validators import (
    validate_cluster_id,
    validate_engine_input,
    validate_lab_id,
    validate_lens_id,
    validate_root_pattern_id,
    validate_symptom_id,
    validate_system_id,
)

__all__ = [
    "MedicalEntityRegistry",
    "build_default_registry",
    "get_default_registry",
    "load_registry_from_path",
    "validate_engine_input",
    "validate_symptom_id",
    "validate_cluster_id",
    "validate_system_id",
    "validate_root_pattern_id",
    "validate_lab_id",
    "validate_lens_id",
]

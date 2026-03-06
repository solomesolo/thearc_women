"""
Centralized ID validation using the registry. Valid if ID exists in category;
if invalid and strict=True raise UnknownEntityIdError; if strict=False return False.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from engine.config import EngineConfig
from engine.errors import MalformedInputError, UnknownEntityIdError
from engine.types import EngineInput

if TYPE_CHECKING:
    from engine.ids.registry import MedicalEntityRegistry


def validate_symptom_id(entity_id: str, registry: MedicalEntityRegistry, strict: bool = True) -> bool:
    if registry.is_valid_symptom(entity_id):
        return True
    if strict:
        raise UnknownEntityIdError(f"Unknown symptom: {entity_id}")
    return False


def validate_cluster_id(entity_id: str, registry: MedicalEntityRegistry, strict: bool = True) -> bool:
    if registry.is_valid_cluster(entity_id):
        return True
    if strict:
        raise UnknownEntityIdError(f"Unknown cluster: {entity_id}")
    return False


def validate_system_id(entity_id: str, registry: MedicalEntityRegistry, strict: bool = True) -> bool:
    if registry.is_valid_system(entity_id):
        return True
    if strict:
        raise UnknownEntityIdError(f"Unknown system: {entity_id}")
    return False


def validate_root_pattern_id(
    entity_id: str, registry: MedicalEntityRegistry, strict: bool = True
) -> bool:
    if registry.is_valid_root_pattern(entity_id):
        return True
    if strict:
        raise UnknownEntityIdError(f"Unknown root pattern: {entity_id}")
    return False


def validate_lab_id(entity_id: str, registry: MedicalEntityRegistry, strict: bool = True) -> bool:
    if registry.is_valid_lab(entity_id):
        return True
    if strict:
        raise UnknownEntityIdError(f"Unknown lab: {entity_id}")
    return False


def validate_lens_id(entity_id: str, registry: MedicalEntityRegistry, strict: bool = True) -> bool:
    if registry.is_valid_lens(entity_id):
        return True
    if strict:
        raise UnknownEntityIdError(f"Unknown lens: {entity_id}")
    return False


def validate_engine_input(
    engine_input: EngineInput,
    registry: MedicalEntityRegistry,
    config: EngineConfig,
) -> None:
    """Validate top-level engine input. Raises MalformedInputError if invalid.
    When config.strict_id_validation is True, unknown IDs raise UnknownEntityIdError.
    """
    if not engine_input.user_id or not engine_input.timestamp:
        raise MalformedInputError("user_id and timestamp are required")

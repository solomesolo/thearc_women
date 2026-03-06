"""
Engine error hierarchy.

Used by: run.py, ids/validators, ingest/*, signals/*, clusters/*,
temporal/*, labs/*, systems/*, patterns/*, lens/*, safety/*, output/*, trace/*.
"""


class EngineError(Exception):
    """Base exception for the medical reasoning engine.
    Raised when any engine stage fails for reasons other than validation.
    """


class EngineValidationError(EngineError):
    """Raised when input or entity validation fails.
    Used by: ids/validators, ingest/* when strict_id_validation is True.
    """


class UnknownEntityIdError(EngineValidationError):
    """Raised when an ID (symptom, cluster, system, lens, etc.) is not in the registry.
    Used by: ids/validators, and any stage that looks up IDs against the registry.
    """


class MalformedInputError(EngineValidationError):
    """Raised when the structure or types of input payloads are invalid.
    Used by: ingest/* when survey/labs cannot be normalized.
    """


class RuleEvaluationError(EngineError):
    """Raised when a rule or scoring step fails during evaluation (e.g. missing data, logic error).
    Used by: signals/*, clusters/*, systems/*, patterns/*, lens/*, safety/*.
    """

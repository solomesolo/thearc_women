"""
Single source of truth for canonical medical IDs. Load once, index once, reuse.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from engine.errors import EngineValidationError, UnknownEntityIdError

# --- Fallback in-code canonical registry (no external file required) ---

_REQUIRED_TOP_LEVEL = {
    "enums",
    "symptoms",
    "clusters",
    "systems",
    "root_patterns",
    "labs",
    "lenses",
    "safety_messages",
}

_ENUM_SPEC = {
    "system_status": ["stable", "variable", "needs_attention"],
    "confidence_band": ["weak", "moderate", "strong", "very_strong"],
    "evidence_level": ["High", "Moderate", "Emerging", "Clinical_Practice"],
}

def _mk(id_: str, label: str, **kw: Any) -> Dict[str, Any]:
    d = {"id": id_, "label": label}
    d.update(kw)
    return d


def _default_label(entity_id: str) -> str:
    """First segment unchanged, rest title-cased (e.g. SYM_FATIGUE -> SYM Fatigue)."""
    parts = entity_id.split("_")
    if not parts:
        return entity_id
    return " ".join([parts[0]] + [p.capitalize() for p in parts[1:]])


def _symptom_list() -> List[Dict[str, Any]]:
    items = [
        "SYM_FATIGUE", "SYM_MORNING_EXH", "SYM_AFTERNOON_CRASH", "SYM_BRAIN_FOG", "SYM_POOR_FOCUS",
        "SYM_ANXIETY", "SYM_LOW_MOOD", "SYM_IRRITABLE", "SYM_INSOMNIA", "SYM_WAKE_3AM",
        "SYM_UNREFRESHED", "SYM_NIGHT_SWEATS", "SYM_SUGAR_CRAVE", "SYM_WEIGHT_GAIN", "SYM_WEIGHT_RESIST",
        "SYM_LOW_STAMINA", "SYM_EX_INTOL", "SYM_PALPITATIONS", "SYM_DIZZINESS", "SYM_HEADACHES",
        "SYM_IRREG_CYCLE", "SYM_MISSED_PERIOD", "SYM_HEAVY_BLEED", "SYM_PAINFUL_PERIOD", "SYM_PMS",
        "SYM_BREAST_TENDER", "SYM_BLOATING", "SYM_CONSTIP", "SYM_DIARRHEA", "SYM_HAIR_LOSS",
        "SYM_ACNE", "SYM_DRY_SKIN", "SYM_BRITTLE_NAILS", "SYM_COLD_INTOL", "SYM_LOW_LIBIDO",
    ]
    return [_mk(x, _default_label(x)) for x in items]


def _cluster_list() -> List[Dict[str, Any]]:
    items = [
        "CL_ENERGY_VAR", "CL_STRESS_ACCUM", "CL_SLEEP_DISRUPT", "CL_CYCLE_VAR", "CL_SUGAR_INSTAB",
        "CL_IRON_PATTERN", "CL_THYROID_SIGNALS", "CL_TRAIN_MISMATCH", "CL_GUT_PATTERN", "CL_INFLAM_LOAD",
    ]
    return [_mk(x, _default_label(x)) for x in items]


def _system_list() -> List[Dict[str, Any]]:
    items = [
        "SYS_HORMONAL", "SYS_METABOLIC", "SYS_STRESS", "SYS_SLEEP", "SYS_GUT", "SYS_MICRO",
        "SYS_CARDIO", "SYS_BONE", "SYS_RECOVERY", "SYS_BIOMARKERS_CTX", "SYS_INFLAM_CTX", "SYS_NUTRITION",
    ]
    return [_mk(x, _default_label(x)) for x in items]


def _root_pattern_list() -> List[Dict[str, Any]]:
    items = [
        "RP_STRESS_LOAD", "RP_CORTISOL_RHYTHM", "RP_BLOOD_SUGAR", "RP_IRON_DEPLETION", "RP_THYROID_SLOWING",
        "RP_PROG_LOW", "RP_ESTRO_DOM", "RP_ANDRO_EXCESS", "RP_MICRO_DEPLETION", "RP_OVERTRAIN",
        "RP_SLEEP_DEPRIVATION", "RP_GUT_DYSBIOSIS", "RP_NERVOUS_DYS", "RP_INFLAM_CTX", "RP_VASOMOTOR_CTX",
        "RP_PERI_TRANSITION",
    ]
    out = [_mk(x, _default_label(x)) for x in items]
    for r in out:
        if r["id"] == "RP_SLEEP_DEPRIVATION":
            r["legacy_ids"] = ["RP_SLEEP_DEPRIVE"]
            break
    return out

def _lab_list() -> List[Dict[str, Any]]:
    items = [
        "LAB_FERRITIN", "LAB_B12", "LAB_FOLATE", "LAB_VITD", "LAB_TSH", "LAB_FT4",
        "LAB_GLUCOSE_FAST", "LAB_HBA1C", "LAB_INSULIN_FAST", "LAB_TRIG", "LAB_HDL", "LAB_LDL",
        "LAB_CRP", "LAB_MAG", "LAB_ZINC", "LAB_OMEGA3",
    ]
    return [_mk(x, _default_label(x)) for x in items]


def _lens_list() -> List[Dict[str, Any]]:
    items = [
        "LENS_STRESS_RECOVERY", "LENS_ENERGY_METABOLIC", "LENS_HORMONAL_RHYTHM",
        "LENS_GUT_ABSORPTION", "LENS_NUTRIENT_RESERVES", "LENS_BASELINE",
    ]
    return [_mk(x, _default_label(x)) for x in items]


def _safety_list() -> List[Dict[str, Any]]:
    items = ["MSG_INFO", "MSG_AWARENESS", "MSG_CLINICIAN", "MSG_URGENT"]
    return [_mk(x, _default_label(x)) for x in items]


FALLBACK_CANONICAL_REGISTRY: Dict[str, Any] = {
    "meta": {"name": "Canonical Medical Entity Dictionary", "version": "1.0.0"},
    "enums": {
        "system_status": _ENUM_SPEC["system_status"],
        "confidence_band": _ENUM_SPEC["confidence_band"],
        "evidence_level": _ENUM_SPEC["evidence_level"],
    },
    "symptoms": _symptom_list(),
    "clusters": _cluster_list(),
    "systems": _system_list(),
    "root_patterns": _root_pattern_list(),
    "labs": _lab_list(),
    "lenses": _lens_list(),
    "safety_messages": _safety_list(),
}


class MedicalEntityRegistry:
    """
    Canonical medical ID registry. Build indexes once at construction;
    O(1) lookups and validation. Fail fast on invalid registry data.
    """

    def __init__(self, data: Dict[str, Any]) -> None:
        self._raw = data
        self.meta: Dict[str, Any] = data.get("meta") or {}
        self.enums: Dict[str, List[str]] = {}
        self.symptoms_by_id: Dict[str, Dict[str, Any]] = {}
        self.clusters_by_id: Dict[str, Dict[str, Any]] = {}
        self.systems_by_id: Dict[str, Dict[str, Any]] = {}
        self.root_patterns_by_id: Dict[str, Dict[str, Any]] = {}
        self.labs_by_id: Dict[str, Dict[str, Any]] = {}
        self.lenses_by_id: Dict[str, Dict[str, Any]] = {}
        self.safety_messages_by_id: Dict[str, Dict[str, Any]] = {}
        self.all_entities_by_id: Dict[str, Dict[str, Any]] = {}
        self.legacy_to_canonical: Dict[str, str] = {}

        self._validate_top_level(data)
        self._validate_enums(data.get("enums") or {})
        self._index_category("symptoms", self.symptoms_by_id)
        self._index_category("clusters", self.clusters_by_id)
        self._index_category("systems", self.systems_by_id)
        self._index_category("labs", self.labs_by_id)
        self._index_category("lenses", self.lenses_by_id)
        self._index_category("safety_messages", self.safety_messages_by_id)
        self._index_root_patterns(data.get("root_patterns") or [])
        self._validate_uniqueness_and_legacy()
        self._build_all_entities_and_legacy()

    def _validate_top_level(self, data: Dict[str, Any]) -> None:
        for key in _REQUIRED_TOP_LEVEL:
            if key not in data:
                raise EngineValidationError(f"Registry missing required top-level key: {key}")

    def _validate_enums(self, enums: Dict[str, Any]) -> None:
        for enum_name, expected in _ENUM_SPEC.items():
            if enum_name not in enums:
                raise EngineValidationError(f"Registry enums missing: {enum_name}")
            actual = enums[enum_name]
            if not isinstance(actual, list):
                raise EngineValidationError(f"Registry enums.{enum_name} must be a list")
            if set(actual) != set(expected):
                raise EngineValidationError(
                    f"Registry enums.{enum_name} must be exactly {expected}, got {actual}"
                )
        self.enums = {k: list(v) for k, v in enums.items()}

    def _index_category(
        self,
        key: str,
        index: Dict[str, Dict[str, Any]],
    ) -> None:
        items = self._raw.get(key)
        if not isinstance(items, list):
            raise EngineValidationError(f"Registry.{key} must be a list")
        seen: set = set()
        for rec in items:
            if not isinstance(rec, dict):
                raise EngineValidationError(f"Registry.{key} record must be a dict")
            if "id" not in rec or "label" not in rec:
                raise EngineValidationError(f"Registry.{key} record must have 'id' and 'label'")
            eid = rec["id"]
            if eid in seen:
                raise EngineValidationError(f"Duplicate ID in {key}: {eid}")
            seen.add(eid)
            index[eid] = dict(rec)

    def _index_root_patterns(self, items: List[Dict[str, Any]]) -> None:
        if not isinstance(items, list):
            raise EngineValidationError("Registry.root_patterns must be a list")
        seen: set = set()
        for rec in items:
            if not isinstance(rec, dict) or "id" not in rec or "label" not in rec:
                raise EngineValidationError("Registry.root_patterns record must have 'id' and 'label'")
            eid = rec["id"]
            if eid in seen:
                raise EngineValidationError(f"Duplicate ID in root_patterns: {eid}")
            seen.add(eid)
            self.root_patterns_by_id[eid] = dict(rec)
            for leg in rec.get("legacy_ids") or []:
                if leg in self.legacy_to_canonical and self.legacy_to_canonical[leg] != eid:
                    raise EngineValidationError(f"Duplicate legacy alias: {leg}")
                if (
                    leg in self.root_patterns_by_id
                    or leg in self.symptoms_by_id
                    or leg in self.clusters_by_id
                    or leg in self.systems_by_id
                    or leg in self.labs_by_id
                    or leg in self.lenses_by_id
                    or leg in self.safety_messages_by_id
                ):
                    raise EngineValidationError(f"Legacy alias collides with canonical ID: {leg}")
                self.legacy_to_canonical[leg] = eid

    def _build_all_entities_and_legacy(self) -> None:
        for index in (
            self.symptoms_by_id,
            self.clusters_by_id,
            self.systems_by_id,
            self.root_patterns_by_id,
            self.labs_by_id,
            self.lenses_by_id,
            self.safety_messages_by_id,
        ):
            for eid, rec in index.items():
                if eid in self.all_entities_by_id:
                    raise EngineValidationError(f"Duplicate canonical ID across categories: {eid}")
                self.all_entities_by_id[eid] = rec
        for leg, canon in self.legacy_to_canonical.items():
            if leg in self.all_entities_by_id:
                raise EngineValidationError(f"Legacy alias collides with canonical: {leg}")

    def _validate_uniqueness_and_legacy(self) -> None:
        pass

    def resolve_id(self, entity_id: str) -> str:
        """Convert legacy alias to canonical ID; return as-is if already canonical."""
        return self.legacy_to_canonical.get(entity_id, entity_id)

    def get_label(self, entity_id: str) -> Optional[str]:
        """Return label for entity_id (after resolving legacy); None if unknown."""
        canon = self.resolve_id(entity_id)
        rec = self.all_entities_by_id.get(canon)
        return rec.get("label") if rec else None

    def is_valid_symptom(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.symptoms_by_id

    def is_valid_cluster(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.clusters_by_id

    def is_valid_system(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.systems_by_id

    def is_valid_root_pattern(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.root_patterns_by_id

    def is_valid_lab(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.labs_by_id

    def is_valid_lens(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.lenses_by_id

    def is_valid_safety_message(self, entity_id: str) -> bool:
        return self.resolve_id(entity_id) in self.safety_messages_by_id

    def require_symptom(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.symptoms_by_id:
            raise UnknownEntityIdError(f"Unknown symptom: {entity_id}")
        return self.symptoms_by_id[canon]

    def require_cluster(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.clusters_by_id:
            raise UnknownEntityIdError(f"Unknown cluster: {entity_id}")
        return self.clusters_by_id[canon]

    def require_system(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.systems_by_id:
            raise UnknownEntityIdError(f"Unknown system: {entity_id}")
        return self.systems_by_id[canon]

    def require_root_pattern(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.root_patterns_by_id:
            raise UnknownEntityIdError(f"Unknown root pattern: {entity_id}")
        return self.root_patterns_by_id[canon]

    def require_lab(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.labs_by_id:
            raise UnknownEntityIdError(f"Unknown lab: {entity_id}")
        return self.labs_by_id[canon]

    def require_lens(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.lenses_by_id:
            raise UnknownEntityIdError(f"Unknown lens: {entity_id}")
        return self.lenses_by_id[canon]

    def require_safety_message(self, entity_id: str) -> Dict[str, Any]:
        canon = self.resolve_id(entity_id)
        if canon not in self.safety_messages_by_id:
            raise UnknownEntityIdError(f"Unknown safety message: {entity_id}")
        return self.safety_messages_by_id[canon]


def load_registry_from_path(path: str | Path) -> MedicalEntityRegistry:
    """Load registry from a JSON file."""
    p = Path(path)
    if not p.exists():
        raise EngineValidationError(f"Registry file not found: {path}")
    text = p.read_text()
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise EngineValidationError(f"Invalid registry JSON: {e}") from e
    if not isinstance(data, dict):
        raise EngineValidationError("Registry JSON must be an object")
    return MedicalEntityRegistry(data)


def build_default_registry() -> MedicalEntityRegistry:
    """Build registry from the in-code fallback canonical data."""
    return MedicalEntityRegistry(FALLBACK_CANONICAL_REGISTRY)


@lru_cache(maxsize=1)
def get_default_registry() -> MedicalEntityRegistry:
    """Load once, reuse for all runs. No repeated file I/O."""
    return build_default_registry()

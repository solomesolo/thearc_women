"""
Helpers for golden tests: load fixtures, load expected outputs, build EngineInput.
Task 12.1 — Golden Test Fixtures and Expected Outputs.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

from engine.types import EngineInput, LabInput, SurveyInput, SymptomInput

_GOLDEN_DIR = Path(__file__).resolve().parent
FIXTURES_DIR = _GOLDEN_DIR / "fixtures"
EXPECTED_DIR = _GOLDEN_DIR / "expected"


def load_golden_fixture(name: str) -> dict:
    """Load a fixture JSON from tests/golden/fixtures/{name}.json."""
    path = FIXTURES_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Golden fixture not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_expected_golden(name: str) -> dict:
    """Load expected output subset from tests/golden/expected/{name}.expected.json."""
    path = EXPECTED_DIR / f"{name}.expected.json"
    if not path.exists():
        raise FileNotFoundError(f"Golden expected file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def _survey_from_dict(d: Dict[str, Any]) -> SurveyInput:
    if not d:
        return SurveyInput()
    symptom_inputs: List[SymptomInput] = []
    for s in d.get("symptom_inputs") or []:
        if not isinstance(s, dict) or not s.get("symptom_id"):
            continue
        symptom_inputs.append(
            SymptomInput(
                symptom_id=str(s["symptom_id"]),
                severity=int(s["severity"]) if s.get("severity") is not None and isinstance(s.get("severity"), (int, float)) else None,
                frequency=int(s["frequency"]) if s.get("frequency") is not None and isinstance(s.get("frequency"), (int, float)) else None,
                duration_days=int(s["duration_days"]) if s.get("duration_days") is not None and isinstance(s.get("duration_days"), (int, float)) else None,
                timing=str(s["timing"]) if s.get("timing") is not None else None,
                phase_link=str(s["phase_link"]) if s.get("phase_link") is not None else None,
                post_meal=bool(s["post_meal"]) if s.get("post_meal") is not None else None,
            )
        )
    return SurveyInput(
        life_stage=d.get("life_stage"),
        age_years=int(d["age_years"]) if d.get("age_years") is not None else None,
        symptom_inputs=symptom_inputs,
        raw_fields=dict(d.get("raw_fields") or {}),
    )


def _labs_from_list(items: List[Any]) -> List[LabInput]:
    out: List[LabInput] = []
    for item in items or []:
        if not isinstance(item, dict) or not item.get("lab_id"):
            continue
        out.append(
            LabInput(
                lab_id=str(item["lab_id"]),
                value=float(item["value"]) if item.get("value") is not None else None,
                date=str(item["date"]) if item.get("date") else None,
                value_state=str(item["value_state"]) if item.get("value_state") else None,
            )
        )
    return out


def engine_input_from_fixture(fixture: Dict[str, Any]) -> EngineInput:
    """Build EngineInput from a fixture dict (engine input contract)."""
    survey_dict = fixture.get("survey") or {}
    if not isinstance(survey_dict, dict):
        survey_dict = {}
    # Normalizer uses _as_dict(survey) and expects raw keys (stress_level, fatigue_freq, etc.) in raw_fields
    raw_fields = dict(survey_dict.get("raw_fields") or {})
    raw_fields.update({
        k: v for k, v in survey_dict.items()
        if k not in ("life_stage", "age_years") and v is not None
    })
    if survey_dict.get("symptom_inputs") is not None:
        raw_fields["symptom_inputs"] = survey_dict["symptom_inputs"]
    survey = SurveyInput(
        life_stage=survey_dict.get("life_stage"),
        age_years=int(survey_dict["age_years"]) if survey_dict.get("age_years") is not None else None,
        symptom_inputs=_survey_from_dict(survey_dict).symptom_inputs,
        raw_fields=raw_fields,
    )
    return EngineInput(
        user_id=str(fixture.get("user_id", "fixture_user")),
        timestamp=str(fixture.get("timestamp", "2026-03-06T10:00:00Z")),
        time_window=str(fixture.get("time_window", "7d")),
        survey=survey,
        labs=_labs_from_list(fixture.get("labs") or []),
        history=dict(fixture.get("history") or {}),
    )


def extract_output_subset(output: Any) -> Dict[str, Any]:
    """Extract the comparable subset from EngineOutput for golden assertion."""
    clusters = getattr(output, "clusters", None) or []
    systems = getattr(output, "systems", None) or []
    root_patterns = getattr(output, "root_patterns", None) or []
    lens = getattr(output, "lens", None)
    safety_prompts = getattr(output, "safety_prompts", None) or []

    top_clusters = [
        c.cluster_id
        for c in sorted(clusters, key=lambda x: (float(getattr(x, "strength", 0) or 0), getattr(x, "cluster_id", "")), reverse=True)
    ][:5]
    system_status = {}
    for s in systems:
        sid = getattr(s, "system_id", None)
        if sid:
            system_status[sid] = getattr(s, "status", "stable") or "stable"
    top_root_patterns = [
        r.pattern_id
        for r in sorted(root_patterns, key=lambda x: (float(getattr(x, "score", 0) or 0), getattr(x, "pattern_id", "")), reverse=True)
    ][:5]
    primary_lens_id = getattr(lens, "primary_lens_id", None) or "LENS_BASELINE"
    secondary_lens_id = getattr(lens, "secondary_lens_id", None)
    safety_rule_ids = sorted([getattr(p, "safety_rule_id", "") for p in safety_prompts if getattr(p, "safety_rule_id", "")])

    return {
        "top_clusters": top_clusters,
        "system_status": system_status,
        "top_root_patterns": top_root_patterns,
        "primary_lens_id": primary_lens_id,
        "secondary_lens_id": secondary_lens_id,
        "safety_rule_ids": safety_rule_ids,
    }

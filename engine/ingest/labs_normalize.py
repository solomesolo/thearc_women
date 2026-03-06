"""
Normalize optional lab records for lab-based confidence adjustments.
No diagnosis or classification from numeric values; only normalize and validate.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from engine.errors import UnknownEntityIdError

# --- Canonical label → lab ID mapping ---

LAB_NAME_TO_ID = {
    "Ferritin": "LAB_FERRITIN",
    "Vitamin B12": "LAB_B12",
    "B12": "LAB_B12",
    "Folate": "LAB_FOLATE",
    "Vitamin D (25-OH)": "LAB_VITD",
    "Vitamin D": "LAB_VITD",
    "TSH": "LAB_TSH",
    "Free T4": "LAB_FT4",
    "Fasting glucose": "LAB_GLUCOSE_FAST",
    "HbA1c": "LAB_HBA1C",
    "Fasting insulin": "LAB_INSULIN_FAST",
    "Triglycerides": "LAB_TRIG",
    "HDL cholesterol": "LAB_HDL",
    "LDL cholesterol": "LAB_LDL",
    "CRP": "LAB_CRP",
    "Magnesium": "LAB_MAG",
    "Zinc": "LAB_ZINC",
    "Omega-3 index": "LAB_OMEGA3",
}

VALID_VALUE_STATES = {"present_recent", "out_of_range", "unknown"}
RECENCY_BUCKETS = ("le_12m", "between_12m_24m", "gt_24m_or_unknown")


@dataclass
class NormalizedLab:
    lab_id: str
    value: Optional[float]
    date: Optional[str]
    value_state: str
    recency_bucket: str
    recency_factor: float
    raw_record: Dict[str, Any]


def _as_dict(record: Any) -> Dict[str, Any]:
    """Convert LabInput or dict to dict."""
    if record is None:
        return {}
    if hasattr(record, "lab_id"):
        out = {
            "lab_id": getattr(record, "lab_id", None),
            "value": getattr(record, "value", None),
            "date": getattr(record, "date", None),
            "value_state": getattr(record, "value_state", None),
        }
        return {k: v for k, v in out.items() if v is not None}
    if isinstance(record, dict):
        return dict(record)
    return {}


def _normalize_lab_id(record: Dict[str, Any], registry: Any, strict: bool = True) -> Optional[str]:
    """Resolve canonical lab_id from record. Return None if invalid and not strict."""
    lab_id = record.get("lab_id")
    if lab_id and registry.is_valid_lab(lab_id):
        return lab_id
    lab_name = record.get("lab_name")
    if lab_name and lab_name in LAB_NAME_TO_ID:
        return LAB_NAME_TO_ID[lab_name]
    if strict:
        raise UnknownEntityIdError(f"Unknown lab: lab_id={lab_id!r}, lab_name={lab_name!r}")
    return None


def _normalize_value_state(value_state: Optional[str]) -> str:
    """Return one of present_recent, out_of_range, unknown."""
    if value_state is None:
        return "unknown"
    s = str(value_state).strip().lower()
    if s in VALID_VALUE_STATES:
        return s
    return "unknown"


def _parse_date_safe(date_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO-like date; return None if unparseable."""
    if not date_str:
        return None
    s = str(date_str).strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        pass
    if len(s) >= 10:
        try:
            dt = datetime.strptime(s[:10], "%Y-%m-%d")
            return dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            pass
    return None


def _parse_reference_ts(ts: Optional[str]) -> datetime:
    """Parse reference timestamp; default to now if missing/invalid."""
    if not ts:
        return datetime.now(timezone.utc)
    parsed = _parse_date_safe(ts)
    if parsed is not None:
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    return datetime.now(timezone.utc)


def _compute_recency(
    date_str: Optional[str], reference_timestamp: str
) -> Tuple[str, float]:
    """
    Return (recency_bucket, recency_factor).
    ≤365 days → le_12m, 1.0; >365 and ≤730 → between_12m_24m, 0.5; else gt_24m_or_unknown, 0.25.
    """
    ref = _parse_reference_ts(reference_timestamp)
    lab_dt = _parse_date_safe(date_str)
    if lab_dt is None:
        return "gt_24m_or_unknown", 0.25
    if lab_dt.tzinfo is None:
        lab_dt = lab_dt.replace(tzinfo=timezone.utc)
    delta = ref - lab_dt
    days = delta.total_seconds() / 86400
    if days < 0:
        days = -days
    if days <= 365:
        return "le_12m", 1.0
    if days <= 730:
        return "between_12m_24m", 0.5
    return "gt_24m_or_unknown", 0.25


def _coerce_float(value: Any) -> Optional[float]:
    """Preserve numeric value; None if unparseable."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if isinstance(value, bool):
            return None
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_lab_inputs(
    labs_input: Any,
    registry: Any,
    config: Any,
    reference_timestamp: Optional[str] = None,
) -> List[NormalizedLab]:
    """
    Accept list of dicts or list of LabInput; return list[NormalizedLab].
    reference_timestamp used for recency; defaults to None (then gt_24m_or_unknown).
    """
    if labs_input is None:
        labs_input = []
    if not isinstance(labs_input, list):
        return []

    ref_ts = reference_timestamp or ""
    strict = getattr(config, "strict_id_validation", True)
    out: List[NormalizedLab] = []

    for item in labs_input:
        record = _as_dict(item)
        if not record:
            continue

        lab_id = _normalize_lab_id(record, registry, strict=strict)
        if lab_id is None:
            continue

        value = _coerce_float(record.get("value"))
        date_raw = record.get("date")
        date_parsed = _parse_date_safe(date_raw)
        date_keep = date_raw if date_parsed is not None else None

        value_state = _normalize_value_state(record.get("value_state"))
        recency_bucket, recency_factor = _compute_recency(date_raw, ref_ts)

        out.append(
            NormalizedLab(
                lab_id=lab_id,
                value=value,
                date=date_keep,
                value_state=value_state,
                recency_bucket=recency_bucket,
                recency_factor=recency_factor,
                raw_record=dict(record),
            )
        )

    return out

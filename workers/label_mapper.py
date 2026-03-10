"""Load label dictionaries and map LLM output to approved platform labels (Task 16, 17)."""
from __future__ import annotations

import json
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
_labels_dir = _root / "labels"

_CACHE: dict[str, dict[str, str]] = {}


def _load_dict(name: str) -> dict[str, str]:
    if name not in _CACHE:
        p = _labels_dir / f"{name}.json"
        _CACHE[name] = json.loads(p.read_text()) if p.exists() else {}
    return _CACHE[name]


def normalize(label_type: str, value: str) -> str:
    """Map a raw value to approved label; returns original if no mapping."""
    d = _load_dict(label_type)
    key = (value or "").strip().lower()
    return d.get(key, value.strip() or value)


def assign_labels_for_article(
    cursor,
    article_id: str,
    symptoms: list[str],
    biomarkers: list[str],
    root_causes: list[str],
    life_stages: list[str],
    biological_systems: list[str],
    id_factory,
) -> None:
    """Insert article_labels rows for each normalized value (Task 17)."""
    from workers.pipeline_logger import log_event, EVENT_LABEL_MAPPING_FAILURE

    def insert_batch(label_type: str, values: list[str]) -> None:
        seen = set()
        for v in values:
            if not v or not v.strip():
                continue
            approved = normalize(label_type, v.strip())
            if approved in seen:
                continue
            seen.add(approved)
            try:
                cursor.execute(
                    """
                    INSERT INTO article_labels (id, "articleId", "labelType", "labelValue")
                    VALUES (%s, %s, %s, %s)
                    """,
                    (id_factory(), article_id, label_type, approved),
                )
            except Exception as e:
                log_event(EVENT_LABEL_MAPPING_FAILURE, str(e), {"article_id": article_id, "label_type": label_type, "value": v})

    insert_batch("symptom", symptoms)
    insert_batch("biomarker", biomarkers)
    insert_batch("root_cause", root_causes)
    insert_batch("life_stage", life_stages)
    insert_batch("system", biological_systems)

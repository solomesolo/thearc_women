#!/usr/bin/env python3.10
"""
Clinical notes store — The Arc Woman
====================================
Stores narrative clinical content for all documents that are NOT lab reports and NOT imaging reports.

Goal:
- Categorize content into summary / diagnoses / recommendations / medications
- Persist into clinical_notes_records (one row per document_id)

Sources:
- Prefer medical_extractions structured entities (LLM or fallback extractor)
- Fallback to OCR raw_text with light heuristics
"""

from __future__ import annotations

import json
import logging
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [CLINICAL] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def _parse_report_date_from_ocr(raw_text: str) -> str | None:
    candidates: list[tuple[int, int, int]] = []
    for line in raw_text.splitlines():
        low = line.lower()
        if "geb" in low or "born" in low or "dob" in low:
            continue
        for m in re.finditer(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b", line):
            d, mo, y = m.group(1), m.group(2), m.group(3)
            y = ("20" + y) if len(y) == 2 else y
            try:
                yi, mi, di = int(y), int(mo), int(d)
            except ValueError:
                continue
            if yi < 2000 or yi > 2100:
                continue
            if not (1 <= mi <= 12 and 1 <= di <= 31):
                continue
            candidates.append((yi, mi, di))
        for m in re.finditer(r"\b(\d{4})-(\d{2})-(\d{2})\b", line):
            try:
                yi, mi, di = int(m.group(1)), int(m.group(2)), int(m.group(3))
            except ValueError:
                continue
            if yi < 2000 or yi > 2100:
                continue
            candidates.append((yi, mi, di))
    if not candidates:
        return None
    yi, mi, di = max(candidates)
    return f"{yi:04d}-{mi:02d}-{di:02d}"


def _choose_summary(notes: list[str], raw_text: str) -> str | None:
    # Prefer the first "IMPRESSION/ASSESSMENT/PLAN" style note if present.
    for n in notes:
        if len(n.strip()) >= 40:
            return n.strip()[:800]
    # Otherwise take a short snippet from OCR.
    snippet = "\n".join([l.strip() for l in raw_text.splitlines() if l.strip()][:12]).strip()
    return snippet[:800] if snippet else None


@dataclass
class ClinicalPayload:
    user_email: str
    report_date: str | None
    document_type: str
    summary: str | None
    diagnoses: list[str]
    recommendations: str | None
    medications: list[dict[str, Any]]
    raw_notes: str | None
    source: str
    parsing_warnings: list[str]


def _build_from_extraction(
    entities: list[dict[str, Any]],
    raw_text: str,
    document_type: str,
    warnings: list[str],
) -> ClinicalPayload:
    report_date: str | None = None
    diagnoses: list[str] = []
    meds: list[dict[str, Any]] = []
    notes: list[str] = []
    recos: list[str] = []

    for e in entities:
        et = e.get("entity_type")
        if et == "patient_info" and e.get("field") in ("report_date", "observation_date") and not report_date:
            v = str(e.get("value") or "").strip()
            if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                report_date = v
            else:
                # allow dd.mm.yyyy etc
                rd = _parse_report_date_from_ocr(v)
                report_date = rd or report_date
        elif et == "diagnosis":
            v = (e.get("value") or "").strip()
            if v:
                diagnoses.append(v)
        elif et == "medication":
            meds.append(
                {
                    "name": e.get("name"),
                    "dose": e.get("dose"),
                    "units": e.get("units"),
                    "frequency": e.get("frequency"),
                    "route": e.get("route"),
                }
            )
        elif et == "note":
            section = (e.get("section") or "").strip()
            text = (e.get("text") or "").strip()
            if not text:
                continue
            notes.append(text)
            if section.lower() in ("plan", "recommendation", "recommendations", "follow-up", "follow up"):
                recos.append(text)

    if not report_date:
        report_date = _parse_report_date_from_ocr(raw_text)
        if report_date:
            warnings.append("Report date inferred from OCR text.")
        else:
            warnings.append("No report date found — clinical note will have no date.")

    summary = _choose_summary(notes, raw_text)
    recommendations = ("\n\n".join(recos).strip() or None) if recos else None
    raw_notes = ("\n\n".join(notes).strip() or None) if notes else None

    return ClinicalPayload(
        user_email="",
        report_date=report_date,
        document_type=document_type,
        summary=summary,
        diagnoses=sorted(set(diagnoses)),
        recommendations=recommendations,
        medications=[m for m in meds if any(v for v in m.values())],
        raw_notes=raw_notes,
        source="extraction",
        parsing_warnings=warnings,
    )


def _build_heuristic(raw_text: str, document_type: str, warnings: list[str]) -> ClinicalPayload:
    report_date = _parse_report_date_from_ocr(raw_text)
    if not report_date:
        warnings.append("No report date found — clinical note will have no date.")
    summary = _choose_summary([], raw_text)
    return ClinicalPayload(
        user_email="",
        report_date=report_date,
        document_type=document_type,
        summary=summary,
        diagnoses=[],
        recommendations=None,
        medications=[],
        raw_notes=raw_text[:5000] if raw_text else None,
        source="heuristic",
        parsing_warnings=warnings,
    )


def store_clinical_note(document_id: str) -> dict[str, Any]:
    from workers.db import get_conn

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT hu.user_email,
                       dc.document_type,
                       COALESCE(me.structured_entities, '[]'::jsonb) as entities,
                       COALESCE(me.parsing_warnings, '{}'::text[]) as extraction_warnings,
                       COALESCE(ocr.raw_text, '') as raw_text
                FROM health_uploads hu
                LEFT JOIN document_classifications dc ON dc.document_id = hu.document_id
                LEFT JOIN medical_extractions me ON me.document_id = hu.document_id
                LEFT JOIN ocr_results ocr ON ocr.document_id = hu.document_id
                WHERE hu.document_id = %s
                LIMIT 1
                """,
                (document_id,),
            )
            row = cur.fetchone()

    if not row:
        raise ValueError(f"Document not found: {document_id}")

    user_email, document_type, entities_json, extraction_warnings, raw_text = row
    document_type = document_type or "unknown"

    # Skip lab + imaging (handled elsewhere)
    if document_type in ("lab_report", "imaging_report"):
        return {"ok": True, "skipped": True, "reason": f"document_type={document_type}"}

    warnings = list(extraction_warnings or [])
    entities: list[dict[str, Any]] = []
    try:
        if isinstance(entities_json, str):
            entities = json.loads(entities_json)
        else:
            entities = list(entities_json or [])
    except Exception:
        warnings.append("Failed to parse structured entities — falling back to heuristic.")
        entities = []

    payload = (
        _build_from_extraction(entities, raw_text or "", document_type, warnings)
        if entities
        else _build_heuristic(raw_text or "", document_type, warnings)
    )
    payload.user_email = user_email

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO clinical_notes_records (
                  document_id, user_email, report_date, document_type,
                  summary, diagnoses, recommendations, medications, raw_notes,
                  source, parsing_warnings
                ) VALUES (
                  %s, %s, %s::date, %s,
                  %s, %s, %s, %s::jsonb, %s,
                  %s, %s
                )
                ON CONFLICT (document_id) DO UPDATE SET
                  user_email = EXCLUDED.user_email,
                  report_date = EXCLUDED.report_date,
                  document_type = EXCLUDED.document_type,
                  summary = EXCLUDED.summary,
                  diagnoses = EXCLUDED.diagnoses,
                  recommendations = EXCLUDED.recommendations,
                  medications = EXCLUDED.medications,
                  raw_notes = EXCLUDED.raw_notes,
                  source = EXCLUDED.source,
                  parsing_warnings = EXCLUDED.parsing_warnings,
                  updated_at = now()
                """,
                (
                    document_id,
                    payload.user_email,
                    payload.report_date,
                    payload.document_type,
                    payload.summary,
                    payload.diagnoses,
                    payload.recommendations,
                    json.dumps(payload.medications),
                    payload.raw_notes,
                    payload.source,
                    payload.parsing_warnings,
                ),
            )

    return {
        "ok": True,
        "skipped": False,
        "documentId": document_id,
        "documentType": payload.document_type,
        "reportDate": payload.report_date,
        "hasSummary": bool(payload.summary),
        "diagnosisCount": len(payload.diagnoses),
        "medCount": len(payload.medications),
        "source": payload.source,
        "warnings": payload.parsing_warnings[:5],
    }


if __name__ == "__main__":
    import argparse

    try:
        from dotenv import load_dotenv
        if (_root / ".env").exists():
            load_dotenv(_root / ".env")
        if (_root / ".env.local").exists():
            load_dotenv(_root / ".env.local", override=True)
    except ImportError:
        pass

    parser = argparse.ArgumentParser(description="Store clinical note record for a document.")
    parser.add_argument("document_id", help="UUID of document in DB")
    args = parser.parse_args()

    try:
        result = store_clinical_note(args.document_id)
        print(json.dumps(result, indent=2))
    except Exception as exc:
        log.error("Clinical notes store failed: %s", exc)
        import traceback
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)


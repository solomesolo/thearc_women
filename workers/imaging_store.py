#!/usr/bin/env python3.10
"""
Imaging report store — The Arc Woman
====================================
Takes an imaging_report document and stores a narrative record for the user's
health record imaging section.

Sources:
- Prefer structured entities from medical_extractions (LLM) when present:
  - note sections: FINDINGS / IMPRESSION / RECOMMENDATION (and German variants)
  - diagnosis entities
- Fallback: parse OCR raw_text into sections with simple header heuristics.

Persists into imaging_records (one row per document_id).
"""

from __future__ import annotations

import json
import logging
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [IMAGING] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def _normalise_iso_date(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    # already iso
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", s)
    if m:
        return s
    # dd.mm.yyyy etc
    m = re.search(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b", s)
    if not m:
        return None
    d, mo, y = int(m.group(1)), int(m.group(2)), m.group(3)
    y = int(("20" + y) if len(y) == 2 else y)
    if y < 1900 or y > 2100:
        return None
    if mo < 1 or mo > 12 or d < 1 or d > 31:
        return None
    return f"{y:04d}-{mo:02d}-{d:02d}"


def _parse_report_date_from_ocr(raw_text: str) -> str | None:
    # Prefer non-birthdate lines
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


def _extract_sections_from_text(raw_text: str) -> dict[str, str]:
    """
    Extract narrative sections using header keywords.
    Supports English and common German headings.
    """
    headers = [
        ("findings", [r"^FINDINGS\s*:?", r"^BEFUND\s*:?", r"^BEFUNDE\s*:?", r"^ERHEBUNG\s*:?"],),
        ("impression", [r"^IMPRESSION\s*:?", r"^ASSESSMENT\s*:?", r"^BEURTEILUNG\s*:?", r"^ZUSAMMENFASSUNG\s*:?"],),
        ("recommendations", [r"^RECOMMENDATION[S]?\s*:?", r"^EMPFEHLUNG(?:EN)?\s*:?", r"^WEITERE[S]?\s+VORGEHEN\s*:?", r"^PLAN\s*:?"],),
    ]
    compiled: list[tuple[str, re.Pattern[str]]] = []
    for key, pats in headers:
        for p in pats:
            compiled.append((key, re.compile(p, re.IGNORECASE)))

    current: str | None = None
    buf: dict[str, list[str]] = {"findings": [], "impression": [], "recommendations": []}

    for raw in raw_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        matched = None
        for key, pat in compiled:
            if pat.match(line):
                matched = key
                break
        if matched:
            current = matched
            # strip header prefix if inline content exists
            line2 = re.sub(r"^[A-ZÄÖÜ][A-ZÄÖÜ ]+\s*:?\s*", "", line, flags=re.IGNORECASE).strip()
            if line2:
                buf[current].append(line2)
            continue
        if current:
            buf[current].append(line)

    return {
        k: "\n".join(v).strip() if v else ""
        for k, v in buf.items()
    }


def _infer_modality(raw_text: str) -> str | None:
    t = raw_text.upper()
    if "MRI" in t or "MRT" in t:
        return "MRI"
    if "CT" in t or "COMPUTED TOMOGRAPHY" in t:
        return "CT"
    if "ULTRASOUND" in t or "SONOGRAPH" in t or "SONO" in t:
        return "Ultrasound"
    if "X-RAY" in t or "XRAY" in t or "RÖNTGEN" in t or "ROENTGEN" in t:
        return "X-ray"
    if "MAMMO" in t:
        return "Mammography"
    return None


@dataclass
class ImagingPayload:
    user_email: str
    report_date: str | None
    modality: str | None
    body_part: str | None
    findings: str | None
    impression: str | None
    recommendations: str | None
    diagnoses: list[str]
    source: str
    parsing_warnings: list[str]


def _build_from_extraction(
    structured_entities: list[dict[str, Any]],
    raw_text: str,
    warnings: list[str],
) -> ImagingPayload:
    report_date: str | None = None
    diagnoses: list[str] = []
    notes: dict[str, list[str]] = {"findings": [], "impression": [], "recommendations": []}

    for e in structured_entities:
        et = e.get("entity_type")
        if et == "patient_info" and e.get("field") in ("report_date", "observation_date") and not report_date:
            report_date = _normalise_iso_date(str(e.get("value") or "")) or report_date
        elif et == "diagnosis":
            v = (e.get("value") or "").strip()
            if v:
                diagnoses.append(v)
        elif et == "note":
            section = (e.get("section") or "").strip().lower()
            text = (e.get("text") or "").strip()
            if not text:
                continue
            if section in ("findings", "befund", "befunde"):
                notes["findings"].append(text)
            elif section in ("impression", "assessment", "beurteilung", "zusammenfassung", "diagnosis", "final diagnosis"):
                notes["impression"].append(text)
            elif section in ("recommendation", "recommendations", "plan", "empfehlung", "empfehlungen", "weitere schritte"):
                notes["recommendations"].append(text)

    if not report_date:
        report_date = _parse_report_date_from_ocr(raw_text)
        if report_date:
            warnings.append("Report date inferred from OCR text.")
        else:
            warnings.append("No report date found — imaging record will have no date.")

    sec_fallback = _extract_sections_from_text(raw_text)
    findings = "\n\n".join(notes["findings"]).strip() or sec_fallback["findings"]
    impression = "\n\n".join(notes["impression"]).strip() or sec_fallback["impression"]
    recommendations = "\n\n".join(notes["recommendations"]).strip() or sec_fallback["recommendations"]

    modality = _infer_modality(raw_text)

    return ImagingPayload(
        user_email="",
        report_date=report_date,
        modality=modality,
        body_part=None,
        findings=findings or None,
        impression=impression or None,
        recommendations=recommendations or None,
        diagnoses=sorted(set(diagnoses)),
        source="extraction",
        parsing_warnings=warnings,
    )


def _build_heuristic(raw_text: str, warnings: list[str]) -> ImagingPayload:
    report_date = _parse_report_date_from_ocr(raw_text)
    if not report_date:
        warnings.append("No report date found — imaging record will have no date.")
    sections = _extract_sections_from_text(raw_text)
    modality = _infer_modality(raw_text)
    return ImagingPayload(
        user_email="",
        report_date=report_date,
        modality=modality,
        body_part=None,
        findings=sections["findings"] or None,
        impression=sections["impression"] or None,
        recommendations=sections["recommendations"] or None,
        diagnoses=[],
        source="heuristic",
        parsing_warnings=warnings,
    )


def store_imaging_record(document_id: str) -> dict[str, Any]:
    """
    Upsert imaging_records for the given document if it is an imaging report.
    No-op for non-imaging documents.
    """
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
    if document_type != "imaging_report":
        return {"ok": True, "skipped": True, "reason": f"document_type={document_type}"}

    warnings = list(extraction_warnings or [])
    entities: list[dict[str, Any]] = []
    try:
        if isinstance(entities_json, str):
            entities = json.loads(entities_json)
        else:
            entities = list(entities_json or [])
    except Exception:
        warnings.append("Failed to parse structured entities JSON — falling back to heuristic.")
        entities = []

    payload = (
        _build_from_extraction(entities, raw_text or "", warnings)
        if entities
        else _build_heuristic(raw_text or "", warnings)
    )
    payload.user_email = user_email

    # Persist
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO imaging_records (
                  document_id, user_email, report_date, modality, body_part,
                  findings, impression, recommendations, diagnoses, source, parsing_warnings
                ) VALUES (
                  %s, %s, %s::date, %s, %s,
                  %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (document_id) DO UPDATE SET
                  user_email = EXCLUDED.user_email,
                  report_date = EXCLUDED.report_date,
                  modality = EXCLUDED.modality,
                  body_part = EXCLUDED.body_part,
                  findings = EXCLUDED.findings,
                  impression = EXCLUDED.impression,
                  recommendations = EXCLUDED.recommendations,
                  diagnoses = EXCLUDED.diagnoses,
                  source = EXCLUDED.source,
                  parsing_warnings = EXCLUDED.parsing_warnings,
                  updated_at = now()
                """,
                (
                    document_id,
                    payload.user_email,
                    payload.report_date,
                    payload.modality,
                    payload.body_part,
                    payload.findings,
                    payload.impression,
                    payload.recommendations,
                    payload.diagnoses,
                    payload.source,
                    payload.parsing_warnings,
                ),
            )

    return {
        "ok": True,
        "skipped": False,
        "documentId": document_id,
        "reportDate": payload.report_date,
        "modality": payload.modality,
        "hasFindings": bool(payload.findings),
        "hasImpression": bool(payload.impression),
        "hasRecommendations": bool(payload.recommendations),
        "diagnosisCount": len(payload.diagnoses),
        "source": payload.source,
        "warnings": payload.parsing_warnings[:5],
    }


if __name__ == "__main__":
    import argparse

    # Load env
    try:
        from dotenv import load_dotenv
        if (_root / ".env").exists():
            load_dotenv(_root / ".env")
        if (_root / ".env.local").exists():
            load_dotenv(_root / ".env.local", override=True)
    except ImportError:
        pass

    parser = argparse.ArgumentParser(description="Store imaging record for a document.")
    parser.add_argument("document_id", help="UUID of document in DB")
    args = parser.parse_args()

    try:
        result = store_imaging_record(args.document_id)
        print(json.dumps(result, indent=2))
    except Exception as exc:
        log.error("Imaging store failed: %s", exc)
        import traceback
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)


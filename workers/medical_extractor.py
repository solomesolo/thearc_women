#!/usr/bin/env python3.10
"""
Medical content extraction module — The Arc Woman
==================================================
Extracts structured medical entities from OCR text using the Anthropic Claude API
(claude-haiku-4-5 — fast, cost-effective for extraction tasks).

Extracted entity types
----------------------
  patient_info   patient name, report/observation date, provider, facility
  test_result    test name, numeric value, units, reference range, flag, interpretation
  diagnosis      clinical finding or diagnosis with optional ICD-10 code
  procedure      procedure name and summary details
  medication     drug name, dose, units, frequency, route
  score          scored assessments (PHQ-9, DEXA T-score, TNM staging, BI-RADS …)
  note           free-text sections: IMPRESSION, FINDINGS, COMMENT, RECOMMENDATION …

Usage (CLI)
-----------
  python3.10 workers/medical_extractor.py <document_id>
  python3.10 workers/medical_extractor.py --text "raw text to extract from"

Output (JSON, stdout)
---------------------
  {
    "structured_entities": [...],
    "extraction_confidence": 0.87,
    "missing_fields": ["report_date"],
    "parsing_warnings": ["Page 3 has low OCR confidence — values may be inaccurate"]
  }
"""
from __future__ import annotations

import json
import logging
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ── project root ───────────────────────────────────────────────────────────────
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [EXTRACT] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── constants ──────────────────────────────────────────────────────────────────

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS_RESPONSE = 4096
MAX_INPUT_CHARS = 80_000   # ~20k tokens; truncate longer documents with a warning

# ── result type ────────────────────────────────────────────────────────────────

@dataclass
class ExtractionResult:
    structured_entities: list[dict[str, Any]] = field(default_factory=list)
    extraction_confidence: float = 0.0
    missing_fields: list[str] = field(default_factory=list)
    parsing_warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "structured_entities": self.structured_entities,
            "extraction_confidence": self.extraction_confidence,
            "missing_fields": self.missing_fields,
            "parsing_warnings": self.parsing_warnings,
        }


# ── prompt ─────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a precise medical document parser. Your job is to extract structured \
information from medical document text and return it as valid JSON.

Rules you must follow:
- Only extract information explicitly present in the text. Never infer or hallucinate.
- Use null (JSON null) for any field that is absent or unclear — never an empty string.
- For numeric values, extract the raw number without units (e.g. 6.5 not "6.5 K/uL").
- For dates, use ISO format YYYY-MM-DD when the full date is available. If only \
  month/year, use YYYY-MM. If only year, use YYYY.
- For test results, create one entity per individual measurement (not one per panel).
- For reference ranges given as "3.5-5.0", keep the string form including the dash.
- Flags: use exactly "H", "L", "CRITICAL", or "PANIC" when flagged, otherwise null.
- Confidence: 0.0–1.0 per entity reflecting how clearly it was stated in the text.
- extraction_confidence: weighted mean of individual entity confidences.
- missing_fields: field names expected for this document type but absent from the text.
- parsing_warnings: note ambiguous values, garbled OCR text, unusual formats, or \
  anything that may have reduced extraction accuracy.
- Respond with ONLY valid JSON — no markdown, no explanation, no code fences.\
"""

_USER_TEMPLATE = """\
Extract all medical information from the document below.

Return a single JSON object with this exact schema:
{{
  "structured_entities": [
    // PATIENT INFO — one entry per field found:
    {{"entity_type":"patient_info","field":"patient_name","value":"...","confidence":0.95}},
    {{"entity_type":"patient_info","field":"report_date","value":"YYYY-MM-DD","confidence":0.95}},
    {{"entity_type":"patient_info","field":"observation_date","value":"YYYY-MM-DD","confidence":0.9}},
    {{"entity_type":"patient_info","field":"provider_name","value":"...","confidence":0.9}},
    {{"entity_type":"patient_info","field":"provider_specialty","value":"...","confidence":0.85}},
    {{"entity_type":"patient_info","field":"facility_name","value":"...","confidence":0.9}},

    // TEST RESULT — one entry per individual measurement:
    {{
      "entity_type":"test_result",
      "test_name":"WBC",
      "result_name":"White Blood Cell Count",
      "numeric_value":6.5,
      "text_value":null,
      "units":"K/uL",
      "reference_range":"4.0-11.0",
      "interpretation":"Normal",
      "flag":null,
      "confidence":0.97
    }},

    // DIAGNOSIS — one entry per distinct finding/diagnosis:
    {{"entity_type":"diagnosis","value":"Type 2 diabetes mellitus, well-controlled","icd_code":"E11.9","confidence":0.88}},

    // PROCEDURE — one entry per procedure:
    {{"entity_type":"procedure","procedure_name":"Laparoscopic appendectomy","details":"Performed under general anesthesia, no complications, EBL 20 mL","confidence":0.95}},

    // MEDICATION — one entry per drug:
    {{"entity_type":"medication","name":"Metformin","dose":"1000","units":"mg","frequency":"BID","route":"oral","confidence":0.96}},

    // SCORE / STAGING — one entry per scored assessment:
    {{"entity_type":"score","score_name":"PHQ-9","value":"12","numeric_value":12,"stage":null,"interpretation":"Moderate depression","confidence":0.92}},
    {{"entity_type":"score","score_name":"TNM","value":"T2N0M0","numeric_value":null,"stage":"IIA","interpretation":null,"confidence":0.9}},
    {{"entity_type":"score","score_name":"BI-RADS","value":"3","numeric_value":3,"stage":null,"interpretation":"Probably benign — short-interval follow-up suggested","confidence":0.95}},
    {{"entity_type":"score","score_name":"DEXA T-score","value":"-1.8","numeric_value":-1.8,"stage":null,"interpretation":"Osteopenia","confidence":0.93}},

    // FREE-TEXT NOTE — one entry per distinct section:
    {{"entity_type":"note","section":"IMPRESSION","text":"Normal MRI of the brain without evidence of acute intracranial pathology.","confidence":0.99}}
  ],
  "extraction_confidence": 0.91,
  "missing_fields": ["report_date", "facility_name"],
  "parsing_warnings": ["Reference range missing for TSH"]
}}

--- DOCUMENT START ---
{text}
--- DOCUMENT END ---\
"""


# ── LLM call ───────────────────────────────────────────────────────────────────

def _call_claude(text: str, warnings: list[str]) -> dict[str, Any]:
    """
    Call the Anthropic API and return the parsed extraction dict.
    Raises on unrecoverable failure so the caller can store a partial result.
    """
    import anthropic

    truncated = False
    if len(text) > MAX_INPUT_CHARS:
        text = text[:MAX_INPUT_CHARS]
        truncated = True
        warnings.append(
            f"Document truncated to {MAX_INPUT_CHARS:,} characters for extraction "
            f"— later pages may be missing from results."
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError("ANTHROPIC_API_KEY environment variable is not set")

    client = anthropic.Anthropic(api_key=api_key)
    user_message = _USER_TEMPLATE.format(text=text)

    log.info("Calling Claude %s for extraction (%d chars input)…", MODEL, len(text))

    message = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS_RESPONSE,
        temperature=0,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if the model wrapped its response
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    return json.loads(raw)


# ── validation & normalisation ─────────────────────────────────────────────────

_VALID_ENTITY_TYPES = {
    "patient_info", "test_result", "diagnosis",
    "procedure", "medication", "score", "note",
}

_PATIENT_INFO_FIELDS = {
    "patient_name", "report_date", "observation_date",
    "provider_name", "provider_specialty", "facility_name",
}


def _validate_entity(e: Any, warnings: list[str]) -> dict[str, Any] | None:
    """Light validation: drop malformed entities, clamp confidence."""
    if not isinstance(e, dict):
        warnings.append(f"Dropped non-dict entity: {type(e).__name__}")
        return None

    etype = e.get("entity_type")
    if etype not in _VALID_ENTITY_TYPES:
        warnings.append(f"Dropped entity with unknown type: {etype!r}")
        return None

    # Clamp confidence to [0, 1]
    conf = e.get("confidence")
    if isinstance(conf, (int, float)):
        e["confidence"] = round(max(0.0, min(1.0, float(conf))), 3)
    else:
        e["confidence"] = 0.5
        warnings.append(f"Entity {etype!r} had no confidence — defaulted to 0.5")

    # patient_info must have a recognised field name
    if etype == "patient_info":
        f = e.get("field")
        if f not in _PATIENT_INFO_FIELDS:
            warnings.append(f"patient_info entity has unrecognised field {f!r} — kept as-is")

    # test_result: ensure numeric_value is float or null
    if etype == "test_result":
        nv = e.get("numeric_value")
        if nv is not None:
            try:
                e["numeric_value"] = float(nv)
            except (TypeError, ValueError):
                e["numeric_value"] = None
                warnings.append(f"Could not parse numeric_value for {e.get('test_name')!r}")

    # score: same
    if etype == "score":
        nv = e.get("numeric_value")
        if nv is not None:
            try:
                e["numeric_value"] = float(nv)
            except (TypeError, ValueError):
                e["numeric_value"] = None

    return e


def _normalise_result(raw: dict[str, Any], warnings: list[str]) -> ExtractionResult:
    """Turn the raw LLM JSON dict into a validated ExtractionResult."""
    entities_raw = raw.get("structured_entities", [])
    if not isinstance(entities_raw, list):
        warnings.append("structured_entities was not a list — reset to empty")
        entities_raw = []

    entities = [
        e for e in (_validate_entity(ent, warnings) for ent in entities_raw)
        if e is not None
    ]

    conf = raw.get("extraction_confidence", 0.0)
    if not isinstance(conf, (int, float)):
        conf = 0.0
    conf = round(max(0.0, min(1.0, float(conf))), 3)

    missing = raw.get("missing_fields", [])
    if not isinstance(missing, list):
        missing = []
    missing = [str(m) for m in missing]

    llm_warnings = raw.get("parsing_warnings", [])
    if not isinstance(llm_warnings, list):
        llm_warnings = []
    all_warnings = [str(w) for w in llm_warnings] + warnings

    return ExtractionResult(
        structured_entities=entities,
        extraction_confidence=conf,
        missing_fields=missing,
        parsing_warnings=all_warnings,
    )


# ── DB helpers ─────────────────────────────────────────────────────────────────

def _get_raw_text_and_info(document_id: str) -> tuple[str, float] | None:
    """
    Returns (raw_text, avg_confidence) from ocr_results for the given document.
    avg_confidence is used to pre-warm parsing_warnings about low-quality input.
    """
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT raw_text, avg_confidence
                FROM   ocr_results
                WHERE  document_id = %s
                LIMIT  1
                """,
                (document_id,),
            )
            row = cur.fetchone()
            return (row[0], float(row[1])) if row else None


def persist_extraction(document_id: str, result: ExtractionResult) -> None:
    """Upsert medical_extractions row."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO medical_extractions
                    (document_id, structured_entities, extraction_confidence,
                     missing_fields, parsing_warnings)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    structured_entities   = EXCLUDED.structured_entities,
                    extraction_confidence = EXCLUDED.extraction_confidence,
                    missing_fields        = EXCLUDED.missing_fields,
                    parsing_warnings      = EXCLUDED.parsing_warnings,
                    extracted_at          = NOW()
                """,
                (
                    document_id,
                    json.dumps(result.structured_entities),
                    result.extraction_confidence,
                    result.missing_fields,
                    result.parsing_warnings,
                ),
            )
    log.info(
        "Extraction persisted: %d entities, conf=%.2f, %d warnings",
        len(result.structured_entities),
        result.extraction_confidence,
        len(result.parsing_warnings),
    )


# ── public API ─────────────────────────────────────────────────────────────────

def extract_text(raw_text: str, avg_ocr_confidence: float = 100.0) -> ExtractionResult:
    """
    Extract structured entities from raw OCR text (no DB interaction).
    Useful for testing or when the caller already has the text.
    """
    warnings: list[str] = []

    if avg_ocr_confidence < 50:
        warnings.append(
            f"OCR confidence is low ({avg_ocr_confidence:.0f}%) — extracted values "
            f"may contain transcription errors."
        )
    elif avg_ocr_confidence < 70:
        warnings.append(
            f"OCR confidence is moderate ({avg_ocr_confidence:.0f}%) — verify "
            f"numeric values against the original document."
        )

    if not raw_text or not raw_text.strip():
        return ExtractionResult(
            parsing_warnings=["Document has no OCR text to extract from."],
        )

    def _heuristic_lab_fallback(text: str, base_warnings: list[str]) -> ExtractionResult:
        """
        Very small rule-based extractor used when the LLM extractor is unavailable.
        It targets the most common "test name / value / unit / reference range" rows.
        """
        import re

        warnings = list(base_warnings)
        warnings.append(
            "LLM extraction unavailable — using heuristic lab parser (may miss results)."
        )

        # Example lines (German/English mix) we try to parse:
        # "Leukozyten 6.5 Tsd/pl 4.0 - 10.0"
        # "TSH basal LIA 1.71 pru/ml 0.27 - 4.2"
        # "Glucose im Plasma I 84 mg/dl 60 - 125"
        value_unit_re = re.compile(
            r"(?P<value>[-+]?\d+(?:[.,]\d+)?)\s*"
            r"(?P<unit>[A-Za-zµ/%][A-Za-z0-9µ/%._-]{0,14})"
        )

        range_re = re.compile(
            r"(?P<low>\d+(?:[.,]\d+)?)\s*[-–]\s*(?P<high>\d+(?:[.,]\d+)?)"
        )

        # Try to find a document/report date to attach to all observations downstream.
        # Common formats: 27.07.2022, 27/07/2022, 2022-07-27
        #
        # Heuristic: prefer a non-birthdate (exclude lines containing "Geb" / DOB),
        # and prefer the most recent date (usually report issue date / sample date).
        date_iso: str | None = None
        candidates: list[tuple[int, int, int]] = []  # (y, m, d)
        for line in text.splitlines():
            low = line.lower()
            if "geb" in low:  # e.g. "Geb.-Dat"
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
                if not (1 <= mi <= 12 and 1 <= di <= 31):
                    continue
                candidates.append((yi, mi, di))

        if candidates:
            yi, mi, di = max(candidates)
            date_iso = f"{yi:04d}-{mi:02d}-{di:02d}"

        # Restrict to lab-like units to avoid parsing IDs / addresses.
        unit_allow_re = re.compile(
            r"^(%|f[l1]|pg|ng/ml|pg/ml|mg/dl|g/dl|mmol/l|µmol/l|umol/l|u/l|iu/l|m?u/l|"
            r"tsd/p[l1]|mio/p[l1]|k/?u[l1]|10\^?\d+/?.{0,3}|g/l)$",
            re.IGNORECASE,
        )

        name_blacklist = (
            "patient", "geb.-dat", "ausg.-d", "ext.-nr", "eingang", "material",
            "poststr", "straße", "strasse", "peiting", "frau",
        )

        entities: list[dict[str, Any]] = []
        if date_iso:
            entities.append(
                {
                    "entity_type": "patient_info",
                    "field": "report_date",
                    "value": date_iso,
                    "confidence": 0.8,
                }
            )

        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("--- Page"):
                continue
            # Skip obvious headers/addresses.
            if "ENDBEFUND" in line.upper() or "PATIENT" in line.upper():
                continue

            # Heuristic: must contain a value+unit pattern (e.g., "13.6 g/dl")
            m_vu = value_unit_re.search(line)
            if not m_vu:
                continue

            # Extract name as the text before the value.
            value_start = m_vu.start()
            name = line[:value_start].strip(" .:-_")
            if len(name) < 2 or len(name) > 80:
                continue
            low_name = name.lower()
            if any(k in low_name for k in name_blacklist):
                continue

            value_raw = m_vu.group("value").replace(",", ".")
            try:
                numeric_value = float(value_raw)
            except ValueError:
                continue

            unit = m_vu.group("unit")
            if not unit_allow_re.match(unit):
                continue

            ref = None
            m_range = range_re.search(line[m_vu.end() :])
            if m_range:
                low = m_range.group("low").replace(",", ".")
                high = m_range.group("high").replace(",", ".")
                ref = f"{low}-{high}"

            entities.append(
                {
                    "entity_type": "test_result",
                    "test_name": name,
                    "result_name": name,
                    "numeric_value": numeric_value,
                    "text_value": None,
                    "units": unit,
                    "reference_range": ref,
                    "interpretation": None,
                    "flag": None,
                    "confidence": 0.6,
                }
            )

        # If we found nothing, return warnings so the UI can explain why.
        if not entities:
            warnings.append("Heuristic parser found no lab-like rows in OCR text.")
        if not date_iso:
            warnings.append("No report date found in OCR text — dates will be missing.")
        return ExtractionResult(
            structured_entities=entities,
            extraction_confidence=0.55 if entities else 0.0,
            missing_fields=[],
            parsing_warnings=warnings,
        )

    try:
        raw_result = _call_claude(raw_text, warnings)
    except json.JSONDecodeError as exc:
        warnings.append(f"LLM returned invalid JSON — extraction failed: {exc}")
        return ExtractionResult(parsing_warnings=warnings)
    except Exception as exc:
        warnings.append(f"Extraction API call failed: {exc}")
        return _heuristic_lab_fallback(raw_text, warnings)

    return _normalise_result(raw_result, warnings)


def extract_document(document_id: str) -> ExtractionResult:
    """
    Full extraction pipeline:
      1. Fetch raw OCR text + confidence from DB
      2. Run Claude extraction
      3. Persist result to medical_extractions
      4. Return ExtractionResult
    """
    row = _get_raw_text_and_info(document_id)
    if row is None:
        raise ValueError(f"No OCR result found for document_id={document_id}")

    raw_text, avg_conf = row
    log.info(
        "Extracting document %s (%d chars, avg_conf=%.1f%%)",
        document_id, len(raw_text), avg_conf,
    )

    result = extract_text(raw_text, avg_ocr_confidence=avg_conf)
    persist_extraction(document_id, result)
    return result


# ── CLI ────────────────────────────────────────────────────────────────────────

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

    parser = argparse.ArgumentParser(
        description="Extract structured entities from a medical document."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("document_id", nargs="?", help="UUID of document in DB")
    group.add_argument("--text", help="Raw text to extract from (skips DB lookup)")
    args = parser.parse_args()

    try:
        if args.text:
            result = extract_text(args.text)
        else:
            result = extract_document(args.document_id)

        print(json.dumps(result.to_dict(), indent=2))

    except Exception as exc:
        import traceback
        log.error("Extraction failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

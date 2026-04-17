#!/usr/bin/env python3.10
"""
Async processing pipeline — The Arc Woman
==========================================
Orchestrates the full document processing pipeline with per-step tracking,
structured error logging, and stateful retry support.

Pipeline steps (in order)
--------------------------
  ocr            → OCR + page extraction
  classify       → Document type detection
  extract        → Claude medical entity extraction
  bin_map        → Health category bin assignment
  normalize      → Unit + name normalisation
  longitudinal   → Write to health_observations time-series table
  interventions  → Compute care gap flags + intervention plan

Processing status transitions (written to health_uploads.processing_status)
  queued      → set by /api/upload at job creation
  processing  → set when pipeline starts
  extracted   → set after extract step completes
  classified  → set after classify step completes
  completed   → set when all steps finish successfully
  failed      → set when pipeline exhausts retries

Retry strategy
--------------
  Each step has a per-step max_attempts.  On step failure the runner:
    1. Logs the error to pipeline_step_logs with status=failed
    2. Sleeps briefly (exponential backoff, 2^attempt seconds, max 30s)
    3. Re-runs the step up to max_attempts times
    4. If all attempts fail → mark job failed + stop pipeline
    5. Steps that already appear in ocr_jobs.completed_steps are SKIPPED
       so a retry triggered via /api/ocr/[id]/retry resumes from the
       failed step rather than starting from scratch.

Usage (CLI)
-----------
  python3.10 workers/pipeline_runner.py <document_id>
  python3.10 workers/pipeline_runner.py <document_id> --from-step extract
"""
from __future__ import annotations

import json
import logging
import sys
import time
import traceback
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [PIPELINE] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Step definitions ────────────────────────────────────────────────────────────

@dataclass
class StepDef:
    name:        str
    max_attempts: int       # total attempts (1 = no retry)
    timeout_s:   int        # soft guidance — not enforced in runner, used in logs
    description: str


PIPELINE_STEPS: list[StepDef] = [
    StepDef("ocr",           max_attempts=2, timeout_s=120, description="OCR + page extraction"),
    StepDef("classify",      max_attempts=2, timeout_s=30,  description="Document type detection"),
    StepDef("extract",       max_attempts=3, timeout_s=60,  description="Medical entity extraction (Claude)"),
    StepDef("imaging_store", max_attempts=2, timeout_s=15,  description="Store imaging narrative record"),
    StepDef("clinical_notes_store", max_attempts=2, timeout_s=15,  description="Store clinical notes record"),
    StepDef("bin_map",       max_attempts=2, timeout_s=15,  description="Health category bin assignment"),
    StepDef("normalize",     max_attempts=2, timeout_s=15,  description="Unit and name normalisation"),
    StepDef("longitudinal",  max_attempts=2, timeout_s=30,  description="Longitudinal time-series store"),
    StepDef("interventions", max_attempts=2, timeout_s=60,  description="Care gap and intervention plan"),
]

STEP_NAMES = [s.name for s in PIPELINE_STEPS]

# processing_status values written to health_uploads after each milestone
_STATUS_AFTER_STEP: dict[str, str] = {
    "ocr":           "processing",
    "classify":      "classified",
    "extract":       "extracted",
    "imaging_store": "processing",
    "clinical_notes_store": "processing",
    "bin_map":       "processing",
    "normalize":     "processing",
    "longitudinal":  "processing",
    "interventions": "completed",
}


# ── DB helpers ──────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_job(document_id: str) -> dict[str, Any] | None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT oj.status, oj.completed_steps, oj.retry_count,
                       oj.max_retries, hu.user_email
                FROM ocr_jobs oj
                JOIN health_uploads hu ON hu.document_id = oj.document_id
                WHERE oj.document_id = %s
                """,
                (document_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "status":          row[0],
                "completed_steps": list(row[1] or []),
                "retry_count":     row[2],
                "max_retries":     row[3],
                "user_email":      row[4],
            }


def _set_job_step(document_id: str, step: str) -> None:
    """Mark job as processing, set current_step."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ocr_jobs
                SET status = 'processing', current_step = %s, updated_at = NOW()
                WHERE document_id = %s
                """,
                (step, document_id),
            )


def _mark_step_complete(document_id: str, step: str) -> None:
    """Add step to completed_steps; update processing_status milestone."""
    upload_status = _STATUS_AFTER_STEP.get(step, "processing")
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Append to completed_steps array (deduplicated via array_append check)
            cur.execute(
                """
                UPDATE ocr_jobs
                SET completed_steps = array_append(
                        CASE WHEN %s = ANY(completed_steps) THEN completed_steps
                             ELSE completed_steps END, %s),
                    current_step = NULL,
                    updated_at   = NOW()
                WHERE document_id = %s
                """,
                (step, step, document_id),
            )
            # Update upload processing status
            cur.execute(
                """
                UPDATE health_uploads
                SET processing_status = %s
                WHERE document_id = %s
                """,
                (upload_status, document_id),
            )


def _mark_job_done(document_id: str) -> None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ocr_jobs
                SET status = 'completed', current_step = NULL, updated_at = NOW()
                WHERE document_id = %s
                """,
                (document_id,),
            )


def _mark_job_failed(document_id: str, error: str, step: str) -> None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ocr_jobs
                SET status = 'failed', last_error = %s,
                    retry_count = retry_count + 1, updated_at = NOW()
                WHERE document_id = %s
                """,
                (f"[{step}] {error}", document_id),
            )
            cur.execute(
                """
                UPDATE health_uploads
                SET processing_status = 'failed'
                WHERE document_id = %s
                """,
                (document_id,),
            )


# ── Step log helpers ────────────────────────────────────────────────────────────

def _log_step_start(document_id: str, step: str, attempt: int) -> str:
    """Insert a started log row; returns the log row id."""
    from workers.db import get_conn, uuid4_str
    log_id = uuid4_str()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pipeline_step_logs
                    (id, document_id, step, status, attempt, started_at)
                VALUES (%s, %s, %s, 'started', %s, NOW())
                """,
                (log_id, document_id, step, attempt),
            )
    return log_id


def _log_step_done(log_id: str, duration_ms: int) -> None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE pipeline_step_logs
                SET status = 'completed', duration_ms = %s, completed_at = NOW()
                WHERE id = %s
                """,
                (duration_ms, log_id),
            )


def _log_step_failed(log_id: str, duration_ms: int, error_msg: str, error_detail: str) -> None:
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE pipeline_step_logs
                SET status = 'failed', duration_ms = %s,
                    error_message = %s, error_detail = %s,
                    completed_at = NOW()
                WHERE id = %s
                """,
                (duration_ms, error_msg[:500], error_detail[:4000], log_id),
            )


def _log_step_skipped(document_id: str, step: str) -> None:
    from workers.db import get_conn, uuid4_str
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO pipeline_step_logs
                    (id, document_id, step, status, attempt, started_at, completed_at)
                VALUES (%s, %s, %s, 'skipped', 1, NOW(), NOW())
                """,
                (uuid4_str(), document_id, step),
            )


# ── Step implementations ────────────────────────────────────────────────────────

def _run_ocr(document_id: str, ctx: dict) -> None:
    from workers.ocr_utils import (
        DocumentOcrResult, PageOcrResult, aggregate_pages,
        extract_native_pdf_pages, ocr_image_array,
    )
    import io
    import numpy as np
    from PIL import Image

    # Fetch upload record
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT mime_type, storage_path FROM health_uploads WHERE document_id = %s",
                (document_id,),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"No upload record for {document_id}")
            mime_type, storage_path = row

    ctx["mime_type"]     = mime_type
    ctx["storage_path"]  = storage_path

    # Download from Supabase
    import os
    from supabase import create_client
    sb = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
    buckets_to_try = (
        [os.environ["HEALTH_UPLOADS_BUCKET"]]
        if os.environ.get("HEALTH_UPLOADS_BUCKET")
        else ["health0uploads", "health-uploads"]
    )
    last_err = None
    for bucket in buckets_to_try:
        try:
            file_bytes = bytes(sb.storage.from_(bucket).download(storage_path))
            break
        except Exception as e:
            last_err = e
            file_bytes = None
    if file_bytes is None:
        raise RuntimeError(f"Failed to download from any bucket: {buckets_to_try}") from last_err
    log.info("Downloaded %d bytes for %s", len(file_bytes), document_id)

    def _to_bgr(pil_img):
        rgb = pil_img.convert("RGB")
        arr = np.array(rgb)
        return arr[:, :, ::-1].copy()

    if mime_type == "application/pdf":
        pages = extract_native_pdf_pages(file_bytes)
        if pages is None:
            from pdf2image import convert_from_bytes
            pil_pages = convert_from_bytes(file_bytes, dpi=300, fmt="png", thread_count=2)
            pages = [ocr_image_array(i + 1, _to_bgr(p)) for i, p in enumerate(pil_pages)]
    elif mime_type in ("image/jpeg", "image/png", "image/tiff"):
        pil_img = Image.open(io.BytesIO(file_bytes))
        try:
            n = getattr(pil_img, "n_frames", 1)
        except Exception:
            n = 1
        if n > 1:
            pages = []
            for i in range(n):
                pil_img.seek(i)
                pages.append(ocr_image_array(i + 1, _to_bgr(pil_img.copy())))
        else:
            pages = [ocr_image_array(1, _to_bgr(pil_img))]
    else:
        raise ValueError(f"Unsupported mime_type: {mime_type}")

    if not pages:
        raise RuntimeError("OCR produced no pages")

    doc = aggregate_pages(document_id, pages)
    ctx["ocr_result"] = doc

    # Persist ocr_results + ocr_pages
    import json as _json
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ocr_results (id, document_id, ocr_status, raw_text, page_count, avg_confidence)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    ocr_status = EXCLUDED.ocr_status,
                    raw_text = EXCLUDED.raw_text,
                    page_count = EXCLUDED.page_count,
                    avg_confidence = EXCLUDED.avg_confidence,
                    processed_at = NOW()
                RETURNING id
                """,
                (document_id, doc.ocr_status, doc.raw_text, doc.page_count, doc.avg_confidence),
            )
            result_id = str(cur.fetchone()[0])
            cur.execute("DELETE FROM ocr_pages WHERE result_id = %s", (result_id,))
            for page in doc.pages:
                cur.execute(
                    """
                    INSERT INTO ocr_pages
                        (result_id, page_number, raw_text, confidence, word_count, is_low_conf, blocks)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (result_id, page.page_number, page.raw_text, page.confidence,
                     page.word_count, page.is_low_conf, _json.dumps(page.blocks)),
                )


def _run_classify(document_id: str, ctx: dict) -> None:
    from workers.document_classifier import classify_document
    result = classify_document(document_id)
    ctx["classification"] = result
    log.info("Classified: %s (conf=%.0f%%)", result.document_type, result.confidence * 100)


def _run_extract(document_id: str, ctx: dict) -> None:
    from workers.medical_extractor import extract_document
    result = extract_document(document_id)
    ctx["extraction"] = result
    ctx["extraction_ok"] = True
    log.info("Extracted: %d entities  conf=%.2f  warnings=%d",
             len(result.structured_entities), result.extraction_confidence,
             len(result.parsing_warnings))


def _run_imaging_store(document_id: str, ctx: dict) -> None:
    from workers.imaging_store import store_imaging_record
    result = store_imaging_record(document_id)
    ctx["imaging_store"] = result
    if result.get("skipped"):
        log.info("Imaging store: skipped (%s)", result.get("reason"))
    else:
        log.info(
            "Imaging store: saved (date=%s modality=%s source=%s)",
            result.get("reportDate"),
            result.get("modality"),
            result.get("source"),
        )

def _run_clinical_notes_store(document_id: str, ctx: dict) -> None:
    from workers.clinical_notes_store import store_clinical_note
    result = store_clinical_note(document_id)
    ctx["clinical_notes_store"] = result
    if result.get("skipped"):
        log.info("Clinical notes: skipped (%s)", result.get("reason"))
    else:
        log.info(
            "Clinical notes: saved (type=%s date=%s source=%s)",
            result.get("documentType"),
            result.get("reportDate"),
            result.get("source"),
        )


def _run_bin_map(document_id: str, ctx: dict) -> None:
    from workers.bin_mapper import assign_bins
    result = assign_bins(document_id)
    ctx["bins"] = result
    log.info("Bins: %s  conf=%.2f", result.assigned_bins, result.classification_confidence)


def _run_normalize(document_id: str, ctx: dict) -> None:
    from workers.normalizer import normalize_document
    result = normalize_document(document_id)
    ctx["norm"] = result
    log.info("Normalized: %d active, %d converted",
             result.active_observations, result.conversion_count)


def _run_longitudinal(document_id: str, ctx: dict) -> None:
    from workers.longitudinal_store import store_observations
    result = store_observations(document_id)
    ctx["longitudinal"] = result
    log.info("Longitudinal: %d upserted", result.upserted)


def _run_interventions(document_id: str, ctx: dict) -> None:
    from workers.intervention_planner import plan_interventions
    user_email = ctx.get("user_email") or _get_job(document_id)["user_email"]
    result = plan_interventions(user_email)
    ctx["interventions"] = result
    log.info("Interventions: %d gaps, %d due_soon",
             len(result.care_gap_flags), len(result.suggested_followups))


_STEP_FN: dict[str, Callable[[str, dict], None]] = {
    "ocr":           _run_ocr,
    "classify":      _run_classify,
    "extract":       _run_extract,
    "imaging_store": _run_imaging_store,
    "clinical_notes_store": _run_clinical_notes_store,
    "bin_map":       _run_bin_map,
    "normalize":     _run_normalize,
    "longitudinal":  _run_longitudinal,
    "interventions": _run_interventions,
}

# Steps that require a previous step to have succeeded
_STEP_REQUIRES: dict[str, str | None] = {
    "ocr":           None,
    "classify":      "ocr",
    "extract":       "ocr",
    "imaging_store": "extract",
    "clinical_notes_store": "extract",
    "bin_map":       "extract",
    "normalize":     "extract",
    "longitudinal":  "normalize",
    "interventions": "longitudinal",
}


# ── Core runner ─────────────────────────────────────────────────────────────────

def run_pipeline(document_id: str, from_step: str | None = None) -> dict[str, Any]:
    """
    Execute the full pipeline for document_id.

    from_step: if set, skip all steps before this one that already appear in
               completed_steps (stateful retry). Steps with unmet prerequisites
               are also skipped.

    Returns a summary dict.
    """
    job = _get_job(document_id)
    if not job:
        raise ValueError(f"No job found for document_id={document_id}")

    already_done: set[str] = set(job["completed_steps"])
    ctx: dict[str, Any] = {"user_email": job["user_email"]}

    # Mark job as processing + update upload status
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ocr_jobs SET status = 'processing', updated_at = NOW()
                WHERE document_id = %s
                """,
                (document_id,),
            )
            cur.execute(
                """
                UPDATE health_uploads SET processing_status = 'processing'
                WHERE document_id = %s
                  AND processing_status NOT IN ('completed')
                """,
                (document_id,),
            )

    # Determine start index
    start_idx = 0
    if from_step and from_step in STEP_NAMES:
        start_idx = STEP_NAMES.index(from_step)

    failed_step: str | None = None
    failed_error: str | None = None

    for step_def in PIPELINE_STEPS[start_idx:]:
        step = step_def.name

        # Skip steps already completed in a previous run
        if step in already_done:
            log.info("Step [%s] already completed — skipping", step)
            _log_step_skipped(document_id, step)
            continue

        # Check prerequisite
        prereq = _STEP_REQUIRES[step]
        if prereq and prereq not in already_done and prereq not in ctx:
            log.warning(
                "Step [%s] prerequisite [%s] not met — skipping step",
                step, prereq,
            )
            _log_step_skipped(document_id, step)
            continue

        # Run with retry
        step_succeeded = False
        for attempt in range(1, step_def.max_attempts + 1):
            log.info("Step [%s] attempt %d/%d starting", step, attempt, step_def.max_attempts)
            _set_job_step(document_id, step)
            log_id = _log_step_start(document_id, step, attempt)
            t0 = time.monotonic()

            try:
                _STEP_FN[step](document_id, ctx)
                duration_ms = int((time.monotonic() - t0) * 1000)
                _log_step_done(log_id, duration_ms)
                _mark_step_complete(document_id, step)
                already_done.add(step)
                step_succeeded = True
                log.info("Step [%s] completed in %dms", step, duration_ms)
                break

            except Exception as exc:
                duration_ms = int((time.monotonic() - t0) * 1000)
                tb = traceback.format_exc()
                err_msg = str(exc)
                log.error("Step [%s] attempt %d failed: %s", step, attempt, err_msg)

                if attempt < step_def.max_attempts:
                    backoff = min(2 ** attempt, 30)
                    log.info("Retrying step [%s] in %ds…", step, backoff)
                    # Update log row to retrying before sleeping
                    _log_step_failed(log_id, duration_ms, err_msg, tb)
                    # Insert a new "retrying" marker for the next attempt
                    from workers.db import get_conn as _gc, uuid4_str
                    with _gc() as conn:
                        with conn.cursor() as cur:
                            cur.execute(
                                """
                                INSERT INTO pipeline_step_logs
                                    (id, document_id, step, status, attempt)
                                VALUES (%s, %s, %s, 'retrying', %s)
                                """,
                                (uuid4_str(), document_id, step, attempt + 1),
                            )
                    time.sleep(backoff)
                else:
                    # Final attempt failed
                    _log_step_failed(log_id, duration_ms, err_msg, tb)
                    failed_step = step
                    failed_error = err_msg

        if not step_succeeded:
            log.error("Step [%s] exhausted all %d attempts — aborting pipeline",
                      step, step_def.max_attempts)
            _mark_job_failed(document_id, failed_error or "unknown", step)
            return {
                "ok":           False,
                "document_id":  document_id,
                "failed_step":  failed_step,
                "error":        failed_error,
                "completed":    sorted(already_done),
            }

    # All steps done
    _mark_job_done(document_id)
    log.info("Pipeline completed for document %s", document_id)

    return {
        "ok":          True,
        "document_id": document_id,
        "completed":   sorted(already_done),
    }


# ── CLI ─────────────────────────────────────────────────────────────────────────

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
        description="Run the full document processing pipeline."
    )
    parser.add_argument("document_id", help="UUID of document to process")
    parser.add_argument(
        "--from-step",
        dest="from_step",
        choices=STEP_NAMES,
        default=None,
        help="Resume pipeline from this step (skips already-completed steps)",
    )
    args = parser.parse_args()

    try:
        result = run_pipeline(args.document_id, from_step=args.from_step)
        print(json.dumps(result, indent=2))
        if not result["ok"]:
            sys.exit(1)
    except Exception as exc:
        log.error("Pipeline runner failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

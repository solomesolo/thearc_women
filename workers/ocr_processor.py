#!/usr/bin/env python3.10
"""
OCR Processing Worker — The Arc Woman
======================================
Entry point for the OCR pipeline. Called by:
  python3 workers/ocr_processor.py <document_id>

Or imported and called programmatically:
  from workers.ocr_processor import process_document
  process_document("uuid-of-document")

Pipeline:
  1. Fetch document record from DB (health_uploads)
  2. Download file from Supabase Storage
  3. Route to PDF or image OCR based on mime_type
  4. For PDFs: try native text extraction first, fall back to image OCR
  5. Per-page: preprocess → Tesseract → confidence → text blocks
  6. Aggregate confidence → determine status (success / partial / failed)
  7. Persist ocr_results + ocr_pages rows
  8. Update ocr_jobs.status + health_uploads.processing_status

Improvements over original lab-report-ocr-api-main:
  - PDF support (native + scanned)
  - Multi-page extraction with page-level results
  - Preprocessing pipeline (deskew, denoise, adaptive threshold)
  - Confidence scoring per word/page/document
  - Status: success / partial / failed
  - Low-confidence page flagging
  - Text block extraction with bounding boxes
  - All file types: PDF, JPEG, PNG, multi-page TIFF
"""
from __future__ import annotations

import io
import json
import logging
import os
import sys
import traceback
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

# ── project root on path ───────────────────────────────────────────────────────
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from workers.db import get_conn
from workers.ocr_utils import (
    DocumentOcrResult,
    PageOcrResult,
    aggregate_pages,
    extract_native_pdf_pages,
    ocr_image_array,
)
from workers.document_classifier import classify_document
from workers.medical_extractor import extract_document
from workers.bin_mapper import assign_bins
from workers.sensitivity_tagger import tag_document
from workers.normalizer import normalize_document
from workers.longitudinal_store import store_observations
from workers.intervention_planner import plan_interventions

# ── env ────────────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    if (_root / ".env").exists():
        load_dotenv(_root / ".env")
    if (_root / ".env.local").exists():
        load_dotenv(_root / ".env.local", override=True)
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [OCR] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

BUCKETS_TO_TRY = (
    [os.environ["HEALTH_UPLOADS_BUCKET"]]
    if os.environ.get("HEALTH_UPLOADS_BUCKET")
    else ["health0uploads", "health-uploads"]
)


# ── Supabase storage download ──────────────────────────────────────────────────

def _get_supabase():
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")
    return create_client(url, key)


def _download_file(storage_path: str) -> bytes:
    """Download a file from Supabase Storage and return its raw bytes."""
    sb = _get_supabase()
    last_err: Exception | None = None
    for bucket in BUCKETS_TO_TRY:
        try:
            response = sb.storage.from_(bucket).download(storage_path)
            if isinstance(response, (bytes, bytearray)):
                return bytes(response)
            raise RuntimeError(f"Unexpected download response type: {type(response)}")
        except Exception as e:
            last_err = e
    raise RuntimeError(f"Failed to download from any bucket: {BUCKETS_TO_TRY}") from last_err


# ── MIME → OCR routing ─────────────────────────────────────────────────────────

def _ocr_pdf(file_bytes: bytes, document_id: str) -> list[PageOcrResult]:
    """
    OCR a PDF file.
    Strategy:
      1. Try native text extraction (pdfplumber) — perfect for vectorized PDFs
      2. If sparse, convert pages to images via pdf2image → Tesseract
    """
    log.info("PDF: attempting native text extraction")
    native = extract_native_pdf_pages(file_bytes)
    if native is not None:
        log.info("PDF: native extraction succeeded (%d pages)", len(native))
        return native

    log.info("PDF: native text too sparse — falling back to image OCR (pdf2image)")
    from pdf2image import convert_from_bytes

    # 300 DPI for good Tesseract accuracy on A4
    pil_pages: list[Image.Image] = convert_from_bytes(
        file_bytes,
        dpi=300,
        fmt="png",
        thread_count=2,
    )

    results: list[PageOcrResult] = []
    for i, pil_img in enumerate(pil_pages, start=1):
        log.info("  PDF page %d/%d → Tesseract", i, len(pil_pages))
        img_bgr = _pil_to_bgr(pil_img)
        results.append(ocr_image_array(i, img_bgr))

    return results


def _ocr_image(file_bytes: bytes, mime_type: str, document_id: str) -> list[PageOcrResult]:
    """
    OCR a single image file (JPEG or PNG).
    Supports multi-frame TIFF as well (each frame = one page).
    """
    pil_img = Image.open(io.BytesIO(file_bytes))

    pages: list[PageOcrResult] = []

    # Handle animated/multi-frame images (e.g. multi-page TIFF)
    try:
        n_frames = getattr(pil_img, "n_frames", 1)
    except Exception:
        n_frames = 1

    if n_frames > 1:
        for i in range(n_frames):
            pil_img.seek(i)
            img_bgr = _pil_to_bgr(pil_img.copy())
            pages.append(ocr_image_array(i + 1, img_bgr))
    else:
        img_bgr = _pil_to_bgr(pil_img)
        pages.append(ocr_image_array(1, img_bgr))

    return pages


def _pil_to_bgr(pil_img: Image.Image) -> np.ndarray:
    """Convert a PIL Image to a BGR numpy array (OpenCV format)."""
    rgb = pil_img.convert("RGB")
    arr = np.array(rgb)
    return arr[:, :, ::-1].copy()  # RGB → BGR


# ── DB persistence ─────────────────────────────────────────────────────────────

def _set_job_status(document_id: str, status: str, error: str | None = None) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ocr_jobs
                SET status = %s, error = %s, updated_at = NOW()
                WHERE document_id = %s
                """,
                (status, error, document_id),
            )


def _set_upload_status(document_id: str, status: str) -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE health_uploads
                SET processing_status = %s
                WHERE document_id = %s
                """,
                (status, document_id),
            )


def _get_upload_record(document_id: str) -> dict[str, Any] | None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, document_id, user_email, file_name, mime_type,
                       file_size, storage_path, processing_status
                FROM health_uploads
                WHERE document_id = %s
                LIMIT 1
                """,
                (document_id,),
            )
            row = cur.fetchone()
            if row is None:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))


def _persist_result(doc: DocumentOcrResult) -> None:
    """Insert ocr_results + ocr_pages rows and update job/upload statuses."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Upsert aggregated result — RETURNING id gives us the real PK
            # (ON CONFLICT keeps the existing id, so we must not assume our
            #  freshly generated UUID is the one that ends up in the table)
            cur.execute(
                """
                INSERT INTO ocr_results
                    (id, document_id, ocr_status, raw_text, page_count, avg_confidence)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    ocr_status     = EXCLUDED.ocr_status,
                    raw_text       = EXCLUDED.raw_text,
                    page_count     = EXCLUDED.page_count,
                    avg_confidence = EXCLUDED.avg_confidence,
                    processed_at   = NOW()
                RETURNING id
                """,
                (
                    doc.document_id,
                    doc.ocr_status,
                    doc.raw_text,
                    doc.page_count,
                    doc.avg_confidence,
                ),
            )
            result_id = str(cur.fetchone()[0])

            # Remove stale pages before inserting fresh ones (handles re-processing)
            cur.execute("DELETE FROM ocr_pages WHERE result_id = %s", (result_id,))

            # Insert per-page rows
            for page in doc.pages:
                cur.execute(
                    """
                    INSERT INTO ocr_pages
                        (result_id, page_number, raw_text, confidence,
                         word_count, is_low_conf, blocks)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        result_id,
                        page.page_number,
                        page.raw_text,
                        page.confidence,
                        page.word_count,
                        page.is_low_conf,
                        json.dumps(page.blocks),
                    ),
                )

            # Update ocr_jobs
            cur.execute(
                """
                UPDATE ocr_jobs
                SET status = 'completed', updated_at = NOW()
                WHERE document_id = %s
                """,
                (doc.document_id,),
            )

            # Update health_uploads.processing_status
            cur.execute(
                """
                UPDATE health_uploads
                SET processing_status = %s
                WHERE document_id = %s
                """,
                (doc.ocr_status, doc.document_id),
            )


# ── Main entry point ───────────────────────────────────────────────────────────

def process_document(document_id: str) -> DocumentOcrResult:
    """
    Full OCR pipeline for a single document.
    Raises on unrecoverable error (caller should catch and mark job failed).
    """
    log.info("Starting OCR for document %s", document_id)

    # Mark job as processing
    _set_job_status(document_id, "processing")
    _set_upload_status(document_id, "processing")

    # Fetch upload record
    record = _get_upload_record(document_id)
    if record is None:
        raise ValueError(f"No health_upload found for document_id={document_id}")

    storage_path = record["storage_path"]
    mime_type = record["mime_type"]
    log.info("File: %s  mime: %s", storage_path, mime_type)

    # Download from Supabase Storage
    file_bytes = _download_file(storage_path)
    log.info("Downloaded %d bytes", len(file_bytes))

    # Route to OCR pipeline
    if mime_type == "application/pdf":
        pages = _ocr_pdf(file_bytes, document_id)
    elif mime_type in ("image/jpeg", "image/png", "image/tiff"):
        pages = _ocr_image(file_bytes, mime_type, document_id)
    else:
        raise ValueError(f"Unsupported mime_type: {mime_type}")

    if not pages:
        raise RuntimeError("OCR produced no pages")

    # Aggregate to document-level result
    doc_result = aggregate_pages(document_id, pages)
    log.info(
        "OCR complete: status=%s  pages=%d  avg_conf=%.1f%%",
        doc_result.ocr_status,
        doc_result.page_count,
        doc_result.avg_confidence,
    )

    # Persist to DB
    _persist_result(doc_result)
    log.info("Results persisted for document %s", document_id)

    # Classify document type (reads raw text back from DB to ensure consistency)
    try:
        classification = classify_document(document_id)
        log.info(
            "Document classified: %s (conf=%.0f%%)  secondary=%s",
            classification.document_type,
            classification.confidence * 100,
            classification.secondary_document_types,
        )
    except Exception as classify_exc:
        # Non-fatal — OCR result is still valid even if classification fails
        log.warning("Classification step failed (non-fatal): %s", classify_exc)

    # Extract structured medical entities via Claude API, then normalise
    extraction_ok = False
    try:
        extraction = extract_document(document_id)
        extraction_ok = True
        log.info(
            "Extraction complete: %d entities  conf=%.2f  warnings=%d",
            len(extraction.structured_entities),
            extraction.extraction_confidence,
            len(extraction.parsing_warnings),
        )
    except Exception as extract_exc:
        # Non-fatal — OCR and classification results are still valid
        log.warning("Extraction step failed (non-fatal): %s", extract_exc)

    # Normalise extracted entities (runs alongside bin assignment — both need extraction)
    norm_ok = False
    if extraction_ok:
        try:
            norm = normalize_document(document_id)
            norm_ok = True
            log.info(
                "Normalisation complete: %d active observations, %d converted",
                norm.active_observations,
                norm.conversion_count,
            )
        except Exception as norm_exc:
            log.warning("Normalisation step failed (non-fatal): %s", norm_exc)

    # Assign health category bins (requires extraction to have succeeded)
    bins_ok = False
    if extraction_ok:
        try:
            bins = assign_bins(document_id)
            bins_ok = True
            log.info(
                "Bin assignment complete: bins=%s  conf=%.2f  methods=%s",
                bins.assigned_bins,
                bins.classification_confidence,
                bins.method_summary,
            )
        except Exception as bin_exc:
            log.warning("Bin assignment step failed (non-fatal): %s", bin_exc)

    # Apply sensitivity tags (requires bin assignment to have succeeded)
    if bins_ok:
        try:
            sensitivity = tag_document(document_id)
            log.info(
                "Sensitivity tagging complete: level=%s  flagged=%s  tags=%s",
                sensitivity.sensitivity_level,
                sensitivity.flagged_bins,
                sensitivity.privacy_tags,
            )
        except Exception as sens_exc:
            log.warning("Sensitivity tagging step failed (non-fatal): %s", sens_exc)

    # Store normalised observations into the longitudinal time-series table.
    # Requires normalisation to have succeeded; sensitivity context is read from DB.
    store_ok = False
    if norm_ok:
        try:
            store_result = store_observations(document_id)
            store_ok = True
            log.info(
                "Longitudinal store complete: %d observations upserted for document %s",
                store_result.upserted,
                document_id,
            )
        except Exception as store_exc:
            log.warning("Longitudinal store step failed (non-fatal): %s", store_exc)

    # Compute care gap flags and intervention plan for the user.
    # Runs after longitudinal store so new observations are included.
    if store_ok:
        try:
            user_email = record["user_email"]
            plan_result = plan_interventions(user_email)
            log.info(
                "Intervention plan complete: %d gaps, %d due_soon, %d never_recorded (user=%s)",
                len([f for f in plan_result.care_gap_flags if f.gap_status == "overdue"]),
                len(plan_result.suggested_followups),
                len([f for f in plan_result.care_gap_flags if f.gap_status == "never_recorded"]),
                user_email,
            )
        except Exception as plan_exc:
            log.warning("Intervention planning step failed (non-fatal): %s", plan_exc)

    return doc_result


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 workers/ocr_processor.py <document_id>", file=sys.stderr)
        sys.exit(1)

    doc_id = sys.argv[1]

    try:
        result = process_document(doc_id)
        print(json.dumps({
            "ok": True,
            "document_id": result.document_id,
            "ocr_status": result.ocr_status,
            "page_count": result.page_count,
            "avg_confidence": result.avg_confidence,
            "pages": [
                {
                    "page_number": p.page_number,
                    "confidence": p.confidence,
                    "word_count": p.word_count,
                    "is_low_conf": p.is_low_conf,
                    "method": p.extraction_method,
                }
                for p in result.pages
            ],
        }, indent=2))
    except Exception as exc:
        # Mark job failed in DB
        try:
            _set_job_status(doc_id, "failed", str(exc))
            _set_upload_status(doc_id, "failed")
        except Exception:
            pass

        log.error("OCR failed for %s: %s", doc_id, exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

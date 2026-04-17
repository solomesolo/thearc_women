"""
OCR utility functions: image preprocessing, confidence scoring, text-block extraction.
Built on top of the original lab-report-ocr-api-main approach, extended for:
  - Multi-page documents (PDF + images)
  - Health document layouts (tables, columns, mixed)
  - Confidence scoring per word / page / document
  - Text-block preservation with bounding boxes
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from typing import Any

import cv2
import numpy as np


# ── Confidence thresholds ───────────────────────────────────────────────────────
LOW_CONF_THRESHOLD = 50.0   # below this → page flagged as low-confidence
PARTIAL_THRESHOLD  = 70.0   # below this (avg) → document status = partial
FAILED_THRESHOLD   = 40.0   # below this (avg) → document status = failed

# Tesseract PSM modes used per content type
PSM_AUTO      = "3"   # fully automatic (best for mixed lab / clinical docs)
PSM_BLOCK     = "6"   # assume uniform block of text (good for clean pages)
PSM_SPARSE    = "11"  # sparse text (good for header/footer only pages)


# ── Data structures ─────────────────────────────────────────────────────────────

@dataclass
class TextBlock:
    block_num: int
    text: str
    confidence: float
    left: int
    top: int
    width: int
    height: int


@dataclass
class PageOcrResult:
    page_number: int          # 1-based
    raw_text: str
    confidence: float         # 0–100, mean of word-level confidences
    word_count: int
    is_low_conf: bool
    blocks: list[dict[str, Any]] = field(default_factory=list)
    extraction_method: str = "tesseract"  # tesseract | native_pdf


@dataclass
class DocumentOcrResult:
    document_id: str
    pages: list[PageOcrResult]
    ocr_status: str           # success | partial | failed
    raw_text: str             # full concatenated text
    page_count: int
    avg_confidence: float


# ── Image preprocessing ─────────────────────────────────────────────────────────

def preprocess_image(img_bgr: np.ndarray) -> np.ndarray:
    """
    Full preprocessing pipeline tuned for health documents (lab reports, doctor's notes).
    Returns a grayscale, denoised, thresholded image ready for Tesseract.
    """
    # 1. Grayscale
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 2. Mild denoise — preserves thin text strokes (lab report values)
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # 3. Deskew (correct rotation up to ±15°)
    deskewed = _deskew(denoised)

    # 4. Adaptive threshold — handles uneven illumination across scanned docs
    #    Block size 31 works well for A4/letter size at 200+ DPI
    thresholded = cv2.adaptiveThreshold(
        deskewed, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10,
    )

    # 5. Morphological opening to remove speckle noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    cleaned = cv2.morphologyEx(thresholded, cv2.MORPH_OPEN, kernel)

    return cleaned


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Correct small rotations using Hough line detection."""
    try:
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
        if lines is None:
            return gray

        angles: list[float] = []
        for line in lines[:20]:  # use top 20 lines only
            rho, theta = line[0]
            angle_deg = np.degrees(theta) - 90
            if abs(angle_deg) < 15:  # ignore extreme rotations
                angles.append(angle_deg)

        if not angles:
            return gray

        median_angle = statistics.median(angles)
        if abs(median_angle) < 0.5:  # not worth correcting tiny skew
            return gray

        h, w = gray.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return gray


def upscale_if_small(img: np.ndarray, min_height: int = 1000) -> np.ndarray:
    """
    Scale up images that are too small for accurate OCR.
    Tesseract works best at 300 DPI; most A4 scans at 200 DPI = ~2480px tall.
    """
    h, w = img.shape[:2]
    if h < min_height:
        scale = min_height / h
        new_w = int(w * scale)
        return cv2.resize(img, (new_w, min_height), interpolation=cv2.INTER_CUBIC)
    return img


# ── Tesseract helpers ───────────────────────────────────────────────────────────

def _build_tesseract_config(psm: str = PSM_AUTO) -> str:
    """
    Build Tesseract config optimised for health documents.
    --oem 3 = LSTM + legacy engine combined (most accurate).
    """
    return (
        f"--oem 3 --psm {psm} "
        "-c tessedit_char_whitelist='' "  # allow all characters (lab values include '/', '.', '%', etc.)
        "-c preserve_interword_spaces=1"
    )


def run_tesseract_with_data(
    img_gray: np.ndarray,
    psm: str = PSM_AUTO,
) -> tuple[str, float, list[TextBlock]]:
    """
    Run Tesseract and return (raw_text, confidence, blocks).
    Uses image_to_data for word-level confidence instead of image_to_string.
    Returns confidence = mean of word-level confs (words with conf >= 0 only).
    """
    import pytesseract
    import pandas as pd

    config = _build_tesseract_config(psm)

    # image_to_data gives word-level bounding boxes + confidence
    data = pytesseract.image_to_data(
        img_gray,
        config=config,
        output_type=pytesseract.Output.DATAFRAME,
    )

    # Filter to actual words (conf >= 0 means Tesseract recognised something)
    words = data[data["conf"] >= 0].copy()
    words["text"] = words["text"].fillna("").astype(str).str.strip()
    words = words[words["text"] != ""]

    # Page confidence = mean word confidence (Tesseract reports 0–100)
    conf_values = words["conf"].tolist()
    page_conf = float(statistics.mean(conf_values)) if conf_values else 0.0

    # Raw text — reconstruct preserving line breaks
    raw_text = pytesseract.image_to_string(img_gray, config=config)

    # Text blocks grouped by block_num
    blocks: list[TextBlock] = []
    for block_num in sorted(words["block_num"].unique()):
        block_df = words[words["block_num"] == block_num]
        block_text = " ".join(block_df["text"].tolist())
        block_conf = float(block_df["conf"].mean())
        row = block_df.iloc[0]
        blocks.append(TextBlock(
            block_num=int(block_num),
            text=block_text,
            confidence=block_conf,
            left=int(row["left"]),
            top=int(row["top"]),
            width=int(block_df["width"].max()),
            height=int(block_df["height"].max()),
        ))

    return raw_text.strip(), page_conf, blocks


# ── Per-page OCR ────────────────────────────────────────────────────────────────

def ocr_image_array(page_number: int, img_bgr: np.ndarray) -> PageOcrResult:
    """
    Full OCR pipeline for a single image (numpy BGR array):
    preprocess → upscale → tesseract → confidence → result.

    Tries PSM_AUTO first; if confidence is very low, retries with PSM_BLOCK.
    """
    # Upscale tiny images
    img_bgr = upscale_if_small(img_bgr)

    # Preprocess
    preprocessed = preprocess_image(img_bgr)

    # First attempt: PSM_AUTO (handles mixed content well)
    raw_text, conf, blocks = run_tesseract_with_data(preprocessed, psm=PSM_AUTO)

    # Retry with PSM_BLOCK if first pass is poor (often better on clean pages)
    if conf < LOW_CONF_THRESHOLD and len(raw_text.strip()) > 0:
        raw2, conf2, blocks2 = run_tesseract_with_data(preprocessed, psm=PSM_BLOCK)
        if conf2 > conf:
            raw_text, conf, blocks = raw2, conf2, blocks2

    word_count = len(raw_text.split())

    return PageOcrResult(
        page_number=page_number,
        raw_text=raw_text,
        confidence=round(conf, 2),
        word_count=word_count,
        is_low_conf=(conf < LOW_CONF_THRESHOLD),
        blocks=[_block_to_dict(b) for b in blocks],
        extraction_method="tesseract",
    )


def _block_to_dict(b: TextBlock) -> dict[str, Any]:
    return {
        "block_num": b.block_num,
        "text": b.text,
        "confidence": round(b.confidence, 1),
        "left": b.left,
        "top": b.top,
        "width": b.width,
        "height": b.height,
    }


# ── Native PDF text extraction ──────────────────────────────────────────────────

def extract_native_pdf_pages(pdf_bytes: bytes) -> list[PageOcrResult] | None:
    """
    Try extracting text from a vectorized (non-scanned) PDF using pdfplumber.
    Returns None if the PDF appears to be image-only (< 20 words per page average).
    Returns PageOcrResult list with confidence=100.0 if native text is sufficient.
    """
    try:
        import pdfplumber
        import io

        pages: list[PageOcrResult] = []
        total_words = 0

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                text = (page.extract_text() or "").strip()
                word_count = len(text.split())
                total_words += word_count
                pages.append(PageOcrResult(
                    page_number=i,
                    raw_text=text,
                    confidence=100.0 if word_count > 5 else 0.0,
                    word_count=word_count,
                    is_low_conf=(word_count <= 5),
                    blocks=[],
                    extraction_method="native_pdf",
                ))

        avg_words = total_words / max(len(pages), 1)
        if avg_words < 20:
            # Likely a scanned PDF — fall back to image OCR
            return None

        return pages

    except Exception:
        return None


# ── Document-level aggregation ──────────────────────────────────────────────────

def aggregate_pages(document_id: str, pages: list[PageOcrResult]) -> DocumentOcrResult:
    """Combine per-page results into a single DocumentOcrResult with status."""
    if not pages:
        return DocumentOcrResult(
            document_id=document_id,
            pages=[],
            ocr_status="failed",
            raw_text="",
            page_count=0,
            avg_confidence=0.0,
        )

    raw_text = "\n\n--- Page {n} ---\n\n".join(
        [p.raw_text for p in pages]
    )
    # Simple join without the format string above:
    parts = []
    for p in pages:
        parts.append(f"--- Page {p.page_number} ---\n{p.raw_text}")
    raw_text = "\n\n".join(parts)

    confs = [p.confidence for p in pages]
    avg_conf = round(statistics.mean(confs), 2)

    low_conf_pages = sum(1 for p in pages if p.is_low_conf)

    if avg_conf >= PARTIAL_THRESHOLD and low_conf_pages == 0:
        status = "success"
    elif avg_conf >= FAILED_THRESHOLD:
        status = "partial"
    else:
        status = "failed"

    return DocumentOcrResult(
        document_id=document_id,
        pages=pages,
        ocr_status=status,
        raw_text=raw_text,
        page_count=len(pages),
        avg_confidence=avg_conf,
    )

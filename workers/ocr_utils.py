"""
OCR utility functions: image preprocessing, confidence scoring, text-block extraction.
Built on top of the original lab-report-ocr-api-main approach, extended for:
  - Multi-page documents (PDF + images)
  - Health document layouts (tables, columns, mixed)
  - Confidence scoring per word / page / document
  - Text-block preservation with bounding boxes
"""
from __future__ import annotations

import functools
import statistics
import subprocess
from dataclasses import dataclass, field
from typing import Any

import cv2
import numpy as np


# ── Confidence thresholds ───────────────────────────────────────────────────────
LOW_CONF_THRESHOLD = 50.0   # below this → page flagged as low-confidence
PARTIAL_THRESHOLD  = 70.0   # below this (avg) → document status = partial
FAILED_THRESHOLD   = 40.0   # below this (avg) → document status = failed

# Tesseract PSM modes used per content type
PSM_AUTO          = "3"   # fully automatic (best for mixed lab / clinical docs)
PSM_BLOCK         = "6"   # assume uniform block of text (good for clean pages)
PSM_SPARSE        = "11"  # sparse text (good for header/footer only pages)
PSM_SINGLE_COLUMN = "4"   # single column, variable text size (medical letters)

# Combined-score threshold below which fallback strategies are triggered.
# Score = Tesseract conf (0–100) * 0.5 + word-quality (0–1) * 50 → range 0–100.
_QUALITY_THRESHOLD = 60.0

# Fraction of tokens that must look like real words for output to be trusted
_MIN_WORD_QUALITY = 0.35

# Native PDF text is accepted only when this fraction of its tokens are word-like.
# Phone-photographed PDFs sometimes embed garbled embedded OCR text (≥20 words
# per page) that passes the word-count threshold but is nearly all symbols.
# Setting this below 0.45 lets borderline docs fall back to image OCR + _auto_orient.
_NATIVE_PDF_MIN_QUALITY = 0.45


@functools.lru_cache(maxsize=1)
def _lang_flag() -> str:
    """
    Return '-l deu+eng' if the German Tesseract language pack is installed.
    Falls back to '' (Tesseract default = English) so the pipeline never
    hard-fails on missing language data.
    Cached after first call — subprocess overhead is paid once per process.
    """
    try:
        result = subprocess.run(
            ["tesseract", "--list-langs"],
            capture_output=True, text=True, timeout=5,
        )
        if "deu" in (result.stdout + result.stderr):
            return "-l deu+eng"
    except Exception:
        pass
    return ""


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

def _auto_orient(gray: np.ndarray) -> np.ndarray:
    """
    Detect and correct 90° / 180° / 270° page rotations.

    Strategy (two passes so OSD failure does not silently skip rotation):

    Pass 1 — Tesseract OSD (--psm 0): fast, single call.  Works well on
    clean A4 scans with dense text.

    Pass 2 — brute-force fallback: if OSD throws or is unavailable, try all
    four orientations on a small thumbnail (≤ 800 px on longest side) and
    keep whichever orientation gives the highest _text_quality score.  This
    reliably handles phone-photographed documents and low-DPI scans where OSD
    cannot find enough characters to vote.
    """
    import re

    import pytesseract

    _rotations = {
        0:   gray,
        90:  cv2.rotate(gray, cv2.ROTATE_90_COUNTERCLOCKWISE),
        180: cv2.rotate(gray, cv2.ROTATE_180),
        270: cv2.rotate(gray, cv2.ROTATE_90_CLOCKWISE),
    }

    # ── Pass 1: OSD ──────────────────────────────────────────────────────────
    try:
        osd = pytesseract.image_to_osd(
            gray,
            config="--psm 0 -c min_characters_to_try=5",
        )
        m = re.search(r"Rotate:\s*(\d+)", osd)
        if m:
            angle = int(m.group(1))
            if angle in _rotations:
                return _rotations[angle]
    except Exception:
        pass  # OSD not available / too few characters — fall through

    # ── Pass 2: brute-force on a preprocessed thumbnail ─────────────────────
    # Phone photos have uneven lighting — adaptive threshold is essential so
    # Tesseract can distinguish text from background at each orientation.
    # Score = word_count × quality so a correctly-oriented image (many real
    # words) wins decisively over a sideways one (few or garbled tokens).
    best_img = gray
    best_score = -1.0
    lang = _lang_flag()
    cfg = f"--oem 3 --psm 3{' ' + lang if lang else ''}"

    for _angle, rotated in _rotations.items():
        try:
            h, w = rotated.shape
            scale = min(1.0, 1200 / max(h, w, 1))
            small = cv2.resize(
                rotated, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA
            )
            # Apply adaptive threshold so contrast is normalised before OCR
            thresh = cv2.adaptiveThreshold(
                small, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                blockSize=31, C=10,
            )
            text = pytesseract.image_to_string(thresh, config=cfg)
            word_count = len([t for t in text.split() if len(t) >= 3])
            q = _text_quality(text)
            score = word_count * q
            if score > best_score:
                best_score = score
                best_img = rotated
        except Exception:
            continue

    return best_img


def preprocess_image(img_bgr: np.ndarray) -> np.ndarray:
    """
    Full preprocessing pipeline tuned for health documents (lab reports, doctor's notes).
    Returns a grayscale, denoised, thresholded image ready for Tesseract.
    """
    # 1. Grayscale
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 2. Auto-orient — detect and correct 90° / 180° / 270° mis-scans.
    #    Must run on raw grayscale before any other processing so OSD sees
    #    natural text contrast rather than a thresholded binary image.
    gray = _auto_orient(gray)

    # 3. Mild denoise — preserves thin text strokes (lab report values)
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # 4. Deskew (correct residual ±15° tilt after large-angle correction above)
    deskewed = _deskew(denoised)

    # 5. Adaptive threshold — handles uneven illumination across scanned docs
    #    Block size 31 works well for A4/letter size at 200+ DPI
    thresholded = cv2.adaptiveThreshold(
        deskewed, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10,
    )

    # 6. Morphological opening to remove speckle noise
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
    Build Tesseract config for health documents.
    --oem 3 = LSTM + legacy combined.
    Language: German + English when deu pack is installed, else English only.
    """
    lang = _lang_flag()
    parts = [f"--oem 3 --psm {psm}"]
    if lang:
        parts.append(lang)
    parts.append("-c preserve_interword_spaces=1")
    return " ".join(parts)


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

def _text_quality(text: str) -> float:
    """
    Fraction of tokens that look like real words (≥2 chars, ≥60% alphabetic).
    Catches garbled OCR output that Tesseract may still report with high
    character-level confidence (e.g. table borders read as '=' or '|').
    Returns 0.0 (garbage) to 1.0 (clean readable text).
    """
    tokens = text.split()
    if not tokens:
        return 0.0
    word_like = sum(
        1 for t in tokens
        if len(t) >= 2 and sum(c.isalpha() for c in t) / len(t) >= 0.6
    )
    return word_like / len(tokens)


def _combined_score(conf: float, text: str) -> float:
    """Blend Tesseract confidence and word-quality into a single 0–100 score."""
    return conf * 0.5 + _text_quality(text) * 50.0


def _remove_table_lines(binary: np.ndarray) -> np.ndarray:
    """
    Morphologically detect and erase horizontal / vertical grid lines from a
    binary image (white background, black text + lines).

    German lab-result forms and screening letters often have dense table
    borders that Tesseract reads as '=', '|', or '-' characters, producing
    symbol soup.  Removing the lines before OCR dramatically improves output.
    """
    rows, cols = binary.shape

    # Work with inverted image: grid lines become white objects on black background
    inv = cv2.bitwise_not(binary)

    # Horizontal lines: structuring element spans at least 5 % of image width
    h_len = max(cols // 20, 40)
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (h_len, 1))
    h_lines = cv2.morphologyEx(inv, cv2.MORPH_OPEN, h_kernel, iterations=2)

    # Vertical lines: structuring element spans at least 5 % of image height
    v_len = max(rows // 20, 40)
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, v_len))
    v_lines = cv2.morphologyEx(inv, cv2.MORPH_OPEN, v_kernel, iterations=2)

    # Erase detected line pixels from the inverted image, then re-invert
    mask = cv2.bitwise_or(h_lines, v_lines)
    cleaned_inv = cv2.subtract(inv, mask)
    return cv2.bitwise_not(cleaned_inv)


def ocr_image_array(page_number: int, img_bgr: np.ndarray) -> PageOcrResult:
    """
    Full OCR pipeline for a single image.

    Multi-strategy approach — picks the best result by combined score:
      score = Tesseract_confidence × 0.5  +  word_quality × 50

    Strategies tried in order:
      1. Standard preprocessing + PSM_AUTO      (mixed-layout docs)
      2. Standard preprocessing + PSM_SINGLE_COLUMN  (narrative letters)
      3–5. Same two above + table-line removal  (German form / grid docs)
           + PSM_BLOCK as an extra attempt

    Line-removal strategies are only tried when the first two give a poor
    combined score — saves processing time on clean documents.
    """
    # Upscale tiny images
    img_bgr = upscale_if_small(img_bgr)

    # Preprocess
    preprocessed = preprocess_image(img_bgr)

    best_text: str = ""
    best_conf: float = 0.0
    best_blocks: list[TextBlock] = []
    best_score: float = -1.0

    def _try(img: np.ndarray, psm: str) -> None:
        nonlocal best_text, best_conf, best_blocks, best_score
        raw, conf, blocks = run_tesseract_with_data(img, psm=psm)
        score = _combined_score(conf, raw)
        if score > best_score:
            best_text, best_conf, best_blocks, best_score = raw, conf, blocks, score

    # Strategies 1 & 2: standard preprocessing
    _try(preprocessed, PSM_AUTO)
    _try(preprocessed, PSM_SINGLE_COLUMN)

    # Strategies 3–5: with table-line removal (triggered when quality is poor)
    if best_score < _QUALITY_THRESHOLD or _text_quality(best_text) < _MIN_WORD_QUALITY:
        no_lines = _remove_table_lines(preprocessed)
        _try(no_lines, PSM_AUTO)
        _try(no_lines, PSM_SINGLE_COLUMN)
        _try(no_lines, PSM_BLOCK)

    word_count = len(best_text.split())

    return PageOcrResult(
        page_number=page_number,
        raw_text=best_text,
        confidence=round(best_conf, 2),
        word_count=word_count,
        is_low_conf=(best_conf < LOW_CONF_THRESHOLD),
        blocks=[_block_to_dict(b) for b in best_blocks],
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

def _page_is_photo_scan(page) -> bool:  # type: ignore[no-untyped-def]
    """
    Return True when a PyMuPDF page is dominated by a large image XObject
    (characteristic of phone-photographed PDFs).

    Uses page.get_images() + page.get_image_rects() — this finds the actual
    embedded image XObjects, not just the image blocks reported by get_text().
    iOS/Android photo PDFs embed one full-page JPEG/PNG XObject that covers
    > 80 % of the page; vectorised PDFs have small logos (< 50 %).
    """
    try:
        page_area = page.rect.width * page.rect.height
        if page_area <= 0:
            return False
        images = page.get_images(full=True)
        if not images:
            return False
        for img_info in images:
            xref = img_info[0]
            try:
                for rect in page.get_image_rects(xref, transform=True):
                    img_area = rect.width * rect.height
                    if img_area > 0 and img_area / page_area > 0.5:
                        return True
            except Exception:
                pass
        return False
    except Exception:
        return False


def _try_pymupdf_extract(pdf_bytes: bytes) -> list[PageOcrResult] | None:
    """
    Second-chance native text via PyMuPDF (often better on some vector / hybrid PDFs).
    Optional dependency: pip install pymupdf
    """
    try:
        import fitz  # type: ignore[import-untyped]
    except ImportError:
        return None
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            # If any page is image-dominated (phone photo), the only "text" is
            # from embedded mobile OCR — partial, garbled, and missing the
            # body of a rotated document.  Reject early so the caller falls
            # back to pdf2image → Tesseract → _auto_orient.
            for i in range(len(doc)):
                if _page_is_photo_scan(doc.load_page(i)):
                    return None

            pages: list[PageOcrResult] = []
            total_words = 0
            for i in range(len(doc)):
                page = doc.load_page(i)
                text = (page.get_text("text") or "").strip()
                word_count = len(text.split())
                total_words += word_count
                pages.append(PageOcrResult(
                    page_number=i + 1,
                    raw_text=text,
                    confidence=100.0 if word_count > 5 else 0.0,
                    word_count=word_count,
                    is_low_conf=(word_count <= 5),
                    blocks=[],
                    extraction_method="native_pdf",
                ))
        finally:
            doc.close()
        avg_words = total_words / max(len(pages), 1)
        if avg_words < 15:
            return None
        all_text = " ".join(p.raw_text for p in pages)
        if _text_quality(all_text) < _NATIVE_PDF_MIN_QUALITY:
            return None
        return pages
    except Exception:
        return None


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
                # Reject image-dominated pages early (phone-photo PDFs).
                # pdfplumber's page.images gives bounding boxes in page units.
                # A single image > 60 % of page area means the "text" is from
                # mobile OCR — partial/garbled — so fall back to image OCR.
                try:
                    page_area = (page.width or 0) * (page.height or 0)
                    if page_area > 0:
                        for img in page.images:
                            # pdfplumber uses x0/x1 and top/bottom (page units)
                            img_w = img.get("x1", 0) - img.get("x0", 0)
                            img_h = img.get("bottom", 0) - img.get("top", 0)
                            img_area = abs(img_w) * abs(img_h)
                            if img_area / page_area > 0.6:
                                # Image-dominated — route to image OCR
                                return _try_pymupdf_extract(pdf_bytes)
                except Exception:
                    pass

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
            # Likely a scanned PDF — try PyMuPDF (sometimes extracts hidden text layers)
            fitz_pages = _try_pymupdf_extract(pdf_bytes)
            if fitz_pages is not None:
                return fitz_pages
            return None

        # Word count is sufficient — also check text quality.
        # A phone-photographed PDF may embed garbled embedded OCR text that
        # passes the word-count threshold but is nearly all symbols / junk.
        # If quality is low, fall through to image OCR so _auto_orient can fix
        # orientation before Tesseract runs.
        all_text = " ".join(p.raw_text for p in pages)
        if _text_quality(all_text) < _NATIVE_PDF_MIN_QUALITY:
            fitz_pages = _try_pymupdf_extract(pdf_bytes)
            # Accept PyMuPDF only if it gives better quality
            if fitz_pages is not None:
                fitz_text = " ".join(p.raw_text for p in fitz_pages)
                if _text_quality(fitz_text) >= _NATIVE_PDF_MIN_QUALITY:
                    return fitz_pages
            return None  # Trigger image OCR fallback

        return pages

    except Exception:
        return _try_pymupdf_extract(pdf_bytes)


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

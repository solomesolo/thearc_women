#!/usr/bin/env python3.10
"""
Medical document type classifier — The Arc Woman
==================================================
Classifies health documents into one or more of the following types using
weighted keyword scoring + structural pattern matching.  No external API or
model weights required — runs entirely offline.

Supported types
---------------
  lab_report                  | Lab results, blood panels, urinalysis
  imaging_report              | X-ray, MRI, CT, ultrasound, PET
  pathology_report            | Biopsy, histology, cytology, staging
  procedure_summary           | Operative / procedure notes
  consultation_note           | Specialist consults, SOAP notes
  screening_result            | Mammography, colonoscopy, Pap, wellness
  medication_treatment_summary| Medication lists, prescriptions, treatment plans

Multi-label support: if a document scores strongly in multiple categories
(e.g. a procedure note that includes a medication list) all matching types
are returned as secondary_document_types.

Usage (CLI)
-----------
  python3 workers/document_classifier.py <document_id>
  python3 workers/document_classifier.py --text "raw text here"

Output (JSON)
-------------
  {
    "document_type": "lab_report",
    "secondary_document_types": [],
    "confidence": 0.92,
    "all_scores": { "lab_report": 0.41, "imaging_report": 0.03, ... }
  }
"""
from __future__ import annotations

import json
import logging
import math
import re
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
    format="%(asctime)s [CLASSIFY] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── constants ──────────────────────────────────────────────────────────────────

DOCUMENT_TYPES = [
    "lab_report",
    "imaging_report",
    "pathology_report",
    "procedure_summary",
    "consultation_note",
    "screening_result",
    "medication_treatment_summary",
]

# Raw-score fraction of max that a secondary type must reach to be included
SECONDARY_THRESHOLD = 0.18
# Secondary score must also be at least this fraction of the primary score
SECONDARY_RATIO = 0.38
# Primary raw score fraction of max at which confidence is calibrated to 1.0
CONFIDENCE_CALIBRATION = 0.28


# ── result dataclass ───────────────────────────────────────────────────────────

@dataclass
class ClassificationResult:
    document_type: str
    secondary_document_types: list[str] = field(default_factory=list)
    confidence: float = 0.0        # 0.0–1.0, calibrated confidence of primary type
    all_scores: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "document_type": self.document_type,
            "secondary_document_types": self.secondary_document_types,
            "confidence": self.confidence,
            "all_scores": self.all_scores,
        }


# ── keyword rules ──────────────────────────────────────────────────────────────
# Each entry: (regex_pattern, weight)
# Patterns are case-insensitive.  Weight reflects how strongly the term implies
# that document type — unique / structural markers score higher than generic terms.

_RULES: dict[str, list[tuple[str, float]]] = {

    "lab_report": [
        # Structural / layout markers
        (r"reference\s+range", 3.5),
        (r"result[s]?\s+\||\|\s*result", 2.5),
        (r"\b(H|L|HIGH|LOW|CRITICAL|ABNORMAL|FLAG)\b", 2.5),
        (r"accession\s*(number|#|no\.?)", 2.5),
        (r"collection\s+date|specimen\s+(type|collected|received)", 2.5),
        (r"order(?:ing)?\s+physician|requesting\s+provider|ordering\s+provider", 2.0),
        (r"lab(?:oratory)?\s+(report|result|test|panel)", 3.0),
        # Panel / test names
        (r"\bCBC\b|complete\s+blood\s+count", 3.5),
        (r"\bCMP\b|\bBMP\b|comprehensive\s+metabolic|basic\s+metabolic", 3.5),
        (r"lipid\s+panel|cholesterol|triglyceride", 2.5),
        (r"urinalysis|urine\s+(analysis|culture|microscopy)", 2.5),
        (r"\bHbA1c\b|hemoglobin\s+A1c|glycated\s+hemoglobin", 2.5),
        (r"thyroid\s+(panel|function)|\bTSH\b|\bfT[34]\b|free\s+T[34]", 2.5),
        (r"\bPSA\b|prostate.?specific\s+antigen", 2.0),
        (r"hepatic\s+function|liver\s+(panel|function)", 2.0),
        (r"coagulation|prothrombin|INR|PT\b|PTT\b|aPTT", 2.0),
        (r"culture\s+(and\s+sensitivity|result)|sensitivity\s+(report|result)", 2.5),
        (r"rapid\s+test|PCR\s+(result|test|positive|negative)|\bantigen\b|\bantibody\b", 2.0),
        # Common analytes
        (r"\bWBC\b|\bRBC\b|\bhematocrit\b|\bhemoglobin\b", 2.0),
        (r"\bplatelet\b|\bneutrophil\b|\blymphocyte\b|\bmonocyte\b|\beosinophil\b|\bbasophil\b", 2.0),
        (r"\bcreatinine\b|\bBUN\b|\beGFR\b|\bGFR\b|\bglomerular", 2.0),
        (r"\bglucose\b|\binsulin\b|\bC.peptide\b", 1.5),
        (r"\bsodium\b|\bpotassium\b|\bchloride\b|\bbicarbonate\b|\bCO2\b", 1.5),
        (r"\bALT\b|\bAST\b|\bALP\b|\bGGT\b|\bbilirubin\b|\balbumin\b", 2.0),
        (r"\bferritin\b|\bserum\s+iron\b|\bTIBC\b|\btransferrin\b", 2.0),
        (r"\bvitamin\s+D\b|\b25.OH\b|\bvitamin\s+B12\b|\bfolate\b", 1.5),
        (r"\bmagnesium\b|\bphosphorus\b|\bcalcium\b|\buric\s+acid\b", 1.5),
        (r"\bCRP\b|C.reactive\s+protein|\bESR\b|sedimentation\s+rate", 1.5),
    ],

    "imaging_report": [
        # Structural section headers — the clearest signals
        (r"^IMPRESSION\s*:", 5.0),
        (r"^FINDINGS\s*:", 4.5),
        (r"^TECHNIQUE\s*:", 4.0),
        (r"^INDICATION\s*:", 3.0),
        (r"^COMPARISON\s*:", 3.0),
        (r"^HISTORY\s*:", 1.5),
        # Profession
        (r"radiol(?:ogist|ogy)", 3.5),
        (r"attending\s+radiologist|interpreting\s+physician", 3.0),
        # Modalities
        (r"\bMRI\b|magnetic\s+resonance\s+imaging", 3.5),
        (r"\bCT\b\s+(scan|chest|abdomen|head|brain|pelvis)|computed\s+tomography", 3.0),
        (r"\bX-?ray\b|radiograph|plain\s+film", 3.0),
        (r"\bultrasound\b|sonograph|sonography|\bUS\b\s+(of|showing)", 3.0),
        (r"\bPET\b\s*(scan|CT|imaging)|positron\s+emission", 3.0),
        (r"\bechocardiograph|\bechocardiogram|\becho\b\s+(of|showing|reveals)", 2.5),
        (r"\bnuclear\s+medicine\b|\bscintigraphy\b|\bDEXA\s+scan\b", 2.5),
        (r"\bfluoroscopy\b|\bangiograph|\bangiogram\b", 2.5),
        (r"\bmammograph|\bmammogram\b", 2.5),
        # Typical imaging language
        (r"no\s+acute\s+(finding|abnormality|cardiopulmonary|process)", 3.0),
        (r"normal\s+(study|exam|appearance|heart\s+size)", 2.5),
        (r"without\s+contrast|with\s+(?:and\s+without\s+)?contrast", 2.5),
        (r"\bcm\b.*\bmeasur|\bmeasur.*\bcm\b|\bmm\b.*\bsize\b", 1.5),
        (r"\bseries\b|\bslice[s]?\b|\bphase[s]?\b|\bsequence\b", 1.5),
        (r"right\s+lobe|left\s+lobe|posterior|anterior|superior|inferior", 1.0),
        (r"parenchym|opacity|density|attenuation|lucency|effusion", 2.0),
    ],

    "pathology_report": [
        (r"pathol(?:ogy|ogist)", 4.0),
        (r"\bbiopsy\b|\bbiopsied\b|\bcore\s+biopsy\b|\bexcisional\b", 4.0),
        (r"^DIAGNOSIS\s*:|^FINAL\s+DIAGNOSIS\s*:|^PATHOLOGIC\s+DIAGNOSIS\s*:", 5.0),
        (r"^GROSS\s+DESCRIPTION\s*:|grossly\b", 4.0),
        (r"^MICROSCOPIC\s+(?:DESCRIPTION|EXAMINATION)\s*:", 4.5),
        (r"^CLINICAL\s+(?:HISTORY|DIAGNOSIS)\s*:", 2.0),
        (r"^SPECIMEN\s*:|^SPECIMEN\s+DESCRIPTION\s*:", 3.0),
        (r"histol(?:ogy|ogic|ogical)", 3.5),
        (r"cytol(?:ogy|ogic|ogical)|cytopathol", 3.5),
        (r"\bmalignant\b|\bmalignancy\b|\bmalignancies\b", 3.5),
        (r"\bcarcinoma\b|\badenocarcinoma\b|\bsquamous\s+cell\b", 3.5),
        (r"\blymphoma\b|\bleukemia\b|\bmelanoma\b|\bsarcoma\b|\bglioma\b", 3.5),
        (r"\badenoma\b|\bhamartoma\b|\bfibroadenoma\b", 3.0),
        (r"\bbenign\b(?!\s+prostatic\s+hyperplasia)", 2.0),
        (r"\bmargins\b\s+(are\s+)?(clear|negative|positive|involved)", 3.0),
        (r"lymph\s+node\s+(involvement|metastasis|positive|negative)", 3.0),
        (r"\bstage\s+[IVX]+\b|\bTNM\b|\bpT[0-4]\b|\bpN[0-3]\b|\bpM[01]\b", 3.5),
        (r"immunohistochem|\bIHC\b|immunostain", 3.0),
        (r"\bER\b\s*(positive|negative|\+|\-)|\bPR\b\s*(positive|negative|\+|\-)|\bHER2\b", 3.0),
        (r"\bKi.67\b|\bKi67\b|proliferation\s+index", 2.5),
        (r"\bfrozen\s+section\b|\bintraoperative\s+consult", 2.5),
        (r"necros\w+|mitot\w+\s+figur|mitotic\s+rate", 2.5),
        (r"stain\w*\s+(positive|negative|shows|reveals)|H&E\s+stain|hematoxylin", 2.0),
    ],

    "procedure_summary": [
        (r"procedure\s+(performed|note|summary|report)", 4.0),
        (r"operative\s+(report|note)|operation\s+(report|record)", 4.0),
        (r"^PROCEDURE\s*:", 3.5),
        (r"\bsurgeon\b|\boperating\s+surgeon\b|\bassistant\s+surgeon\b", 3.5),
        (r"anesthes(?:ia|iology|iologist)", 3.5),
        (r"pre.?operative|post.?operative|pre.?op\b|post.?op\b", 3.5),
        (r"intraoperative|intra.?operative", 3.0),
        (r"\bincision\b|\bsuture[sd]?\b|\bclosure\b|\bdissect\w+\b", 3.0),
        (r"\blaparoscop\w+\b|laparotom\w+\b", 3.0),
        (r"\bendoscop\w+\b|gastroscop\w+\b|esophagoscop\w+\b", 2.5),
        (r"\bcolonoscop\w+\b|\bsigmoidoscop\w+\b", 2.5),
        (r"\bcystoscop\w+\b|\bbronchoscop\w+\b|\blaryngoscop\w+\b", 2.5),
        (r"\bEBL\b|estimated\s+blood\s+loss", 3.0),
        (r"patient\s+tolerated\s+(the\s+)?procedure|procedure\s+was\s+tolerated", 2.5),
        (r"\bpropofol\b|\bmidazolam\b|\bfentanyl\b|\bketamine\b|\bsevoflurane\b", 2.5),
        (r"\bsedation\b|\bgeneral\s+anesthesia\b|\blocal\s+anesthesia\b", 2.0),
        (r"\bcatheter\b|\btrocar\b|\bcannula\b|\bport\s+site\b", 2.0),
        (r"specimen\s+(sent|submitted|removed)\s+(to|for)\s+pathology", 2.5),
        (r"\bcomplication[s]?\b.*\b(none|no|without)\b|\buneventful\b", 2.0),
        (r"\belectrocautery\b|\bbovie\b|\bstapler\b|\bclip[s]?\b\s+applied", 2.0),
    ],

    "consultation_note": [
        (r"consult(?:ation)?\s+(note|request|report|letter)", 4.5),
        (r"referred\s+(by|from|to)\b|referral\s+(from|by|for)", 3.5),
        (r"\bHPI\b|history\s+of\s+present\s+illness", 3.5),
        (r"past\s+(medical|surgical)\s+history|\bPMH\b|\bPSH\b", 3.0),
        (r"assessment\s+and\s+plan\b|\bA\s*&\s*P\b|\bA\s*/\s*P\b", 3.5),
        (r"review\s+of\s+systems\b|\bROS\b", 3.0),
        (r"^SUBJECTIVE\s*:|^OBJECTIVE\s*:|^ASSESSMENT\s*:|^PLAN\s*:", 3.0),
        (r"physical\s+(exam|examination)\b|\bPE\b\s*:", 2.5),
        (r"vital\s+signs?\b|\bBP\b\s*\d|\bHR\b\s*\d|\bTemp\b|\bO2\s+sat", 2.5),
        (r"family\s+history\b|\bFH\b\s*:|social\s+history\b|\bSH\b\s*:", 2.5),
        (r"current\s+medications|medication\s+(list|reconciliation)", 1.5),
        (r"allerg(?:y|ies)\s*(to|:)", 1.5),
        (r"follow.?up\s+(in|with|appointment|visit)", 2.0),
        (r"\bspecialist\b.*\bseen\b|\bseen\s+by\s+(Dr\.|the)", 2.0),
        (r"\battending\s+physician\b|\btreating\s+physician\b", 1.5),
        (r"\bdiagnosis\s*:\s*\d+\b|\bICD.?10\b|\bICD.?9\b", 2.0),
        (r"\bSOAP\b|^S\s*:.*^O\s*:.*^A\s*:", 3.0),
        (r"impression\s+and\s+plan\b|clinical\s+impression\b", 2.5),
    ],

    "screening_result": [
        (r"screening\s+(result|report|exam|test|mammogram|colonoscopy|summary)", 4.5),
        (r"mammograph\w+|\bBI.?RADS\b|\bbirads\b", 4.0),
        (r"\bBI.?RADS\s+(category\s+)?[0-6]\b", 4.5),
        (r"Pap\s+(smear|test)|cervical\s+(cancer\s+)?screening", 4.0),
        (r"colon(?:oscopy)?\s+screening|colorectal\s+cancer\s+screening", 3.5),
        (r"\bFOBT\b|\bFIT\b|fecal\s+(immunochemical|occult\s+blood)|stool\s+(DNA|test)", 3.5),
        (r"bone\s+density|\bDEXA\b|\bosteoporosis\s+screening\b", 3.5),
        (r"annual\s+(exam|check|visit|wellness)|routine\s+(exam|check|visit)", 3.0),
        (r"well(?:ness)?\s+(visit|exam|check|screen)|health\s+maintenance\b", 3.0),
        (r"preventive\s+(care|medicine|health|screen)", 3.5),
        (r"next\s+screening\s+(due|recommended|in)|recommended\s+(interval|follow.?up)", 3.0),
        (r"no\s+evidence\s+of\s+(malignancy|cancer|abnormality)|negative\s+for\s+malignancy", 2.5),
        (r"HIV\s+screening|hepatitis\s+[BC]\s+screening|\bSTI\b\s+screen", 2.5),
        (r"lung\s+cancer\s+screening|\bLDCT\b|low.dose\s+CT", 2.5),
        (r"prostate\s+cancer\s+screening|\bPSA\s+screen", 2.5),
        (r"skin\s+cancer\s+screening|\bdermatology\s+screen", 2.0),
    ],

    "medication_treatment_summary": [
        (r"medication\s+(list|summary|reconciliation|record)", 4.5),
        (r"treatment\s+(plan|summary|protocol|record)", 4.0),
        (r"\bprescription\b|\bRx\b|\bdrug\s+order\b|\bmedication\s+order\b", 3.5),
        (r"\bSig\s*:|\bsig\s*:", 3.5),
        (r"\brefill[s]?\b|\bdispens\w+\b|\bpharmac\w+\b", 3.0),
        (r"\bBID\b|\bQD\b|\bTID\b|\bQID\b|\bPRN\b|\bq\.\d+h\b|\bonce\s+daily\b|\btwice\s+daily\b", 3.0),
        (r"\bmg\b|\bmcg\b|\bml\b|\bIU\b|\bunits\b", 1.5),
        (r"tablet[s]?\b|\bcapsule[s]?\b|\bsolution\b|\bpatch\b|\binjection\b|\binhaler\b", 2.5),
        (r"\bNDC\b|national\s+drug\s+code", 3.0),
        (r"drug\s+(interaction|allergy|class|name)", 2.5),
        (r"chemotherapy\s+(regimen|protocol|order|\bchemo\b)", 3.5),
        (r"\bradiation\s+therapy\b|\bradiotherapy\b|\bXRT\b", 3.0),
        (r"\bimmunotherapy\b|\bbiologic\s+(therapy|agent)\b|\btargeted\s+therapy\b", 3.0),
        (r"hormone\s+(therapy|replacement)|\bHRT\b|\bHT\b\s+(prescribed|ordered)", 2.5),
        (r"start\s+date|stop\s+date|discontin\w+|last\s+filled|date\s+prescribed", 2.5),
        (r"active\s+medication[s]?|current\s+medication[s]?", 3.0),
        (r"\bDEA\b\s+(number|#|\bno\b\.?)", 2.5),
        (r"\bsupplement[s]?\b|\bvitamin[s]?\b", 1.0),
    ],
}

# Compile all patterns once at import time (MULTILINE so ^ anchors work per-line)
_COMPILED: dict[str, list[tuple[re.Pattern[str], float]]] = {
    doc_type: [
        (re.compile(pattern, re.IGNORECASE | re.MULTILINE), weight)
        for pattern, weight in rules
    ]
    for doc_type, rules in _RULES.items()
}

# Max possible score per type — used only for score normalisation across types
_MAX_SCORES: dict[str, float] = {
    doc_type: sum(w for _, w in rules)
    for doc_type, rules in _RULES.items()
}


# ── core classifier ────────────────────────────────────────────────────────────

def classify_text(raw_text: str) -> ClassificationResult:
    """
    Classify a medical document from its raw OCR text.

    Scoring
    -------
    For each type, every matching pattern contributes:
        contribution = weight × (1 + log(n_matches))
    This rewards multiple occurrences sub-linearly (first hit matters most).
    The raw score is then divided by the type's theoretical max to give a
    normalised [0, 1] fraction, allowing fair comparison across types that
    have different numbers of rules.

    Confidence calibration
    ----------------------
    A normalised primary score of CONFIDENCE_CALIBRATION (0.28) → confidence 1.0.
    Scores below that are scaled linearly.  In practice, a typical strong
    lab report will normalise to 0.30–0.60, giving confidence ≈ 1.0.
    """
    if not raw_text or not raw_text.strip():
        return ClassificationResult(
            document_type="unknown",
            secondary_document_types=[],
            confidence=0.0,
            all_scores={t: 0.0 for t in DOCUMENT_TYPES},
        )

    scores: dict[str, float] = {}

    for doc_type, compiled_rules in _COMPILED.items():
        raw_score = 0.0
        for pattern, weight in compiled_rules:
            matches = pattern.findall(raw_text)
            if matches:
                raw_score += weight * (1.0 + math.log(len(matches)))
        max_s = _MAX_SCORES[doc_type]
        scores[doc_type] = min(raw_score / max_s, 1.0) if max_s > 0 else 0.0

    primary = max(scores, key=lambda k: scores[k])
    primary_score = scores[primary]

    confidence = round(min(primary_score / CONFIDENCE_CALIBRATION, 1.0), 3)

    # Secondary: above absolute threshold AND above relative ratio of primary
    secondaries = sorted(
        [
            t for t in DOCUMENT_TYPES
            if t != primary
            and scores[t] >= SECONDARY_THRESHOLD
            and (primary_score == 0 or scores[t] / primary_score >= SECONDARY_RATIO)
        ],
        key=lambda t: scores[t],
        reverse=True,
    )

    return ClassificationResult(
        document_type=primary,
        secondary_document_types=secondaries,
        confidence=confidence,
        all_scores={t: round(scores[t], 4) for t in DOCUMENT_TYPES},
    )


# ── DB persistence ─────────────────────────────────────────────────────────────

def _get_raw_text(document_id: str) -> str | None:
    """Fetch raw OCR text for the given document from the DB."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT raw_text FROM ocr_results WHERE document_id = %s LIMIT 1",
                (document_id,),
            )
            row = cur.fetchone()
            return row[0] if row else None


def persist_classification(document_id: str, result: ClassificationResult) -> None:
    """Upsert document classification into the DB."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO document_classifications
                    (document_id, document_type, secondary_document_types,
                     confidence, all_scores)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    document_type            = EXCLUDED.document_type,
                    secondary_document_types = EXCLUDED.secondary_document_types,
                    confidence               = EXCLUDED.confidence,
                    all_scores               = EXCLUDED.all_scores,
                    classified_at            = NOW()
                """,
                (
                    document_id,
                    result.document_type,
                    result.secondary_document_types,
                    result.confidence,
                    json.dumps(result.all_scores),
                ),
            )
    log.info(
        "Classification persisted: %s (%.0f%% confidence) secondary=%s",
        result.document_type,
        result.confidence * 100,
        result.secondary_document_types,
    )


def classify_document(document_id: str) -> ClassificationResult:
    """
    Full classify pipeline:
      1. Fetch raw text from DB
      2. Run classifier
      3. Persist result
      4. Return ClassificationResult
    """
    raw_text = _get_raw_text(document_id)
    if raw_text is None:
        raise ValueError(f"No OCR result found for document_id={document_id}")

    log.info("Classifying document %s (%d chars)", document_id, len(raw_text))
    result = classify_text(raw_text)
    log.info(
        "Classification: %s  conf=%.3f  secondary=%s",
        result.document_type,
        result.confidence,
        result.secondary_document_types,
    )

    persist_classification(document_id, result)
    return result


# ── CLI ────────────────────────────────────────────────────────────────────────

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

    parser = argparse.ArgumentParser(
        description="Classify a medical document by document_id or raw text."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("document_id", nargs="?", help="UUID of document in DB")
    group.add_argument("--text", help="Raw text to classify (skips DB lookup)")
    args = parser.parse_args()

    try:
        if args.text:
            result = classify_text(args.text)
        else:
            result = classify_document(args.document_id)

        print(json.dumps(result.to_dict(), indent=2))

    except Exception as exc:
        import traceback
        log.error("Classification failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

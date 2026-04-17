#!/usr/bin/env python3.10
"""
Sensitive data tagging — The Arc Woman
=======================================
Reads a document's bin assignment and applies privacy sensitivity tags.
Runs automatically after bin_mapper in the OCR pipeline.

Sensitivity levels (ordered ascending)
---------------------------------------
  standard         General health data — no special handling required
  sensitive        Requires access controls and audit logging
  high_sensitivity Requires strict access controls, audit logging, and
                   explicit consent before sharing

Default bin → sensitivity mapping (configurable via SENSITIVITY_CONFIG below)
-------------------------------------------------------------------------------
  mental_health  → sensitive        (42 CFR Part 2 analogue; HIPAA §164.508)
  oncology       → high_sensitivity (includes genetic risk; GINA implications)
  gynecology     → sensitive        (reproductive health privacy)
  All others     → standard

Privacy tag vocabulary
-----------------------
  phi                       Protected Health Information (HIPAA)
  mental_health_protected   Mental health / substance use records
  substance_use_protected   Substance use disorder records (42 CFR Part 2)
  reproductive_health       Reproductive / fertility / sexual health data
  oncology_sensitive        Cancer diagnosis / treatment records
  genetic_data              Genetic test results or BRCA / hereditary risk
  cardiovascular_risk       Cardiac risk data (insurance sensitivity)
  general_labs              Routine lab results (lowest sensitivity)

Output (persisted to sensitivity_profiles table)
-------------------------------------------------
  {
    "sensitivity_level": "high_sensitivity",
    "privacy_tags": ["phi", "oncology_sensitive", "genetic_data"],
    "flagged_bins": ["oncology"],
    "tag_reasons": {"oncology": "Oncology bin detected — high-sensitivity default"}
  }

Usage (CLI)
-----------
  python3.10 workers/sensitivity_tagger.py <document_id>
"""
from __future__ import annotations

import json
import logging
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SENSITIVITY] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Sensitivity level ordering ─────────────────────────────────────────────────
# Used to pick the highest level when a document spans multiple bins.
_LEVEL_ORDER = {"standard": 0, "sensitive": 1, "high_sensitivity": 2}


# ── Configurable sensitivity registry ─────────────────────────────────────────
# Modify this dict to adjust sensitivity per bin without touching logic code.
# Each entry:
#   level  — "standard" | "sensitive" | "high_sensitivity"
#   tags   — privacy tag strings attached to any document in this bin
#   reason — human-readable explanation stored in tag_reasons

SENSITIVITY_CONFIG: dict[str, dict[str, Any]] = {
    "general_labs": {
        "level":  "standard",
        "tags":   ["phi", "general_labs"],
        "reason": "Routine lab results — standard PHI handling",
    },
    "cardiovascular": {
        "level":  "standard",
        "tags":   ["phi", "cardiovascular_risk"],
        "reason": "Cardiovascular data — standard PHI; may affect insurance eligibility",
    },
    "gynecology": {
        "level":  "sensitive",
        "tags":   ["phi", "reproductive_health"],
        "reason": "Gynecology & Reproductive Health — sensitive per reproductive privacy guidelines",
    },
    "musculoskeletal": {
        "level":  "standard",
        "tags":   ["phi"],
        "reason": "Musculoskeletal data — standard PHI handling",
    },
    "oncology": {
        "level":  "high_sensitivity",
        "tags":   ["phi", "oncology_sensitive", "genetic_data"],
        "reason": "Oncology — high-sensitivity; may include genetic risk (GINA implications)",
    },
    "mental_health": {
        "level":  "sensitive",
        "tags":   ["phi", "mental_health_protected", "substance_use_protected"],
        "reason": "Mental & Behavioral Health — sensitive; analogous to 42 CFR Part 2 protections",
    },
    "respiratory": {
        "level":  "standard",
        "tags":   ["phi"],
        "reason": "Respiratory data — standard PHI handling",
    },
    "gastroenterology": {
        "level":  "standard",
        "tags":   ["phi"],
        "reason": "GI data — standard PHI handling",
    },
}

# Default for any bin not in the config (future bins, etc.)
_DEFAULT_ENTRY: dict[str, Any] = {
    "level":  "standard",
    "tags":   ["phi"],
    "reason": "Unknown bin — defaulting to standard PHI",
}


# ── Result type ────────────────────────────────────────────────────────────────

@dataclass
class SensitivityResult:
    sensitivity_level:  str                  # standard | sensitive | high_sensitivity
    privacy_tags:       list[str]            # deduplicated, sorted
    flagged_bins:       list[str]            # bins that drove the level above standard
    tag_reasons:        dict[str, str]       # bin → reason string
    assigned_bins:      list[str]            # all bins from bin_assignment (context)

    def to_dict(self) -> dict[str, Any]:
        return {
            "sensitivity_level": self.sensitivity_level,
            "privacy_tags":      self.privacy_tags,
            "flagged_bins":      self.flagged_bins,
            "tag_reasons":       self.tag_reasons,
            "assigned_bins":     self.assigned_bins,
        }


# ── Core tagging logic ─────────────────────────────────────────────────────────

def tag_bins(assigned_bins: list[str]) -> SensitivityResult:
    """
    Compute sensitivity for a list of health bin slugs.
    The document takes the highest level across all its bins.
    Privacy tags are the union of tags from every bin.
    """
    if not assigned_bins:
        return SensitivityResult(
            sensitivity_level="standard",
            privacy_tags=["phi"],
            flagged_bins=[],
            tag_reasons={},
            assigned_bins=[],
        )

    max_level    = "standard"
    all_tags:    set[str] = set()
    flagged:     list[str] = []
    tag_reasons: dict[str, str] = {}

    for bin_slug in assigned_bins:
        entry = SENSITIVITY_CONFIG.get(bin_slug, _DEFAULT_ENTRY)
        level  = entry["level"]
        tags   = entry["tags"]
        reason = entry["reason"]

        all_tags.update(tags)
        tag_reasons[bin_slug] = reason

        if _LEVEL_ORDER[level] > _LEVEL_ORDER[max_level]:
            max_level = level

        if _LEVEL_ORDER[level] > _LEVEL_ORDER["standard"]:
            flagged.append(bin_slug)

    return SensitivityResult(
        sensitivity_level=max_level,
        privacy_tags=sorted(all_tags),
        flagged_bins=sorted(flagged),
        tag_reasons=tag_reasons,
        assigned_bins=list(assigned_bins),
    )


# ── DB helpers ─────────────────────────────────────────────────────────────────

def _get_assigned_bins(document_id: str) -> list[str] | None:
    """Fetch assigned_bins from bin_assignments for the given document."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT assigned_bins FROM bin_assignments WHERE document_id = %s LIMIT 1",
                (document_id,),
            )
            row = cur.fetchone()
            if row is None:
                return None
            bins = row[0]
            # psycopg2 returns TEXT[] as a Python list
            if isinstance(bins, str):
                bins = json.loads(bins)
            return list(bins)


def persist_sensitivity(document_id: str, result: SensitivityResult) -> None:
    """Upsert sensitivity_profiles row."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sensitivity_profiles
                    (document_id, sensitivity_level, privacy_tags,
                     flagged_bins, tag_reasons)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (document_id) DO UPDATE SET
                    sensitivity_level = EXCLUDED.sensitivity_level,
                    privacy_tags      = EXCLUDED.privacy_tags,
                    flagged_bins      = EXCLUDED.flagged_bins,
                    tag_reasons       = EXCLUDED.tag_reasons,
                    tagged_at         = NOW()
                """,
                (
                    document_id,
                    result.sensitivity_level,
                    result.privacy_tags,
                    result.flagged_bins,
                    json.dumps(result.tag_reasons),
                ),
            )
    log.info(
        "Sensitivity profile persisted: level=%s  flagged=%s  tags=%s",
        result.sensitivity_level,
        result.flagged_bins,
        result.privacy_tags,
    )


def tag_document(document_id: str) -> SensitivityResult:
    """
    Full pipeline:
      1. Fetch assigned bins from bin_assignments
      2. Compute sensitivity
      3. Persist to sensitivity_profiles
      4. Return SensitivityResult
    """
    bins = _get_assigned_bins(document_id)
    if bins is None:
        raise ValueError(f"No bin assignment found for document_id={document_id}")

    log.info("Tagging document %s  bins=%s", document_id, bins)
    result = tag_bins(bins)
    log.info(
        "Sensitivity: level=%s  flagged=%s",
        result.sensitivity_level, result.flagged_bins,
    )

    persist_sensitivity(document_id, result)
    return result


# ── Audit log helper (called from Python worker context if needed) ─────────────

def log_access(
    document_id: str,
    user_email: str,
    route: str,
    sensitivity_level: str,
    action: str = "read",
) -> None:
    """
    Insert a row into document_access_logs.
    Called by any Python process that reads sensitive extracted data.
    The TypeScript API layer has its own equivalent in lib/sensitiveAccess.ts.
    """
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO document_access_logs
                    (document_id, user_email, route, action, sensitivity_level)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (document_id, user_email, route, action, sensitivity_level),
            )


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
        description="Apply sensitivity tags to a document's bin assignment."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("document_id", nargs="?", help="UUID of document in DB")
    group.add_argument(
        "--bins",
        metavar="BINS",
        help='Comma-separated bin slugs to tag (skips DB lookup), e.g. "mental_health,oncology"',
    )
    args = parser.parse_args()

    try:
        if args.bins:
            bins = [b.strip() for b in args.bins.split(",") if b.strip()]
            result = tag_bins(bins)
        else:
            result = tag_document(args.document_id)

        print(json.dumps(result.to_dict(), indent=2))

    except Exception as exc:
        import traceback
        log.error("Sensitivity tagging failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

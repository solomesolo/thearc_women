#!/usr/bin/env python3.10
"""
Longitudinal health observation store — The Arc Woman
======================================================
Reads normalised observations (from normalizer.py) and writes them into the
`health_observations` time-series table.

Each row represents one measured value for one metric at one point in time.
Multiple documents can contribute observations for the same metric — this is
intentional (shows trends across visits, labs, imaging).

Deduplication key: (document_id, observation_id)
  observation_id is a deterministic hash from the normalizer:
    SHA-256(document_id + canonical_name + date)[:32]
  On conflict the row is fully replaced — so re-running the pipeline on the
  same document always produces the same rows without creating duplicates.

Indexing strategy (enforced in migration):
  (user_email, canonical_metric_name, observation_date)  ← trend queries
  (user_email, bin)                                       ← dashboard filters
  (user_email, sensitivity_level)                         ← privacy-aware queries
  (observation_date)                                      ← gap detection scans

Usage (CLI)
-----------
  python3.10 workers/longitudinal_store.py <document_id>
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
    format="%(asctime)s [LONGITUDINAL] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Result type ────────────────────────────────────────────────────────────────

@dataclass
class StoreResult:
    document_id:      str
    upserted:         int
    skipped:          int          # superseded observations not written
    observations:     list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "document_id": self.document_id,
            "upserted":    self.upserted,
            "skipped":     self.skipped,
        }


# ── DB fetch helpers ───────────────────────────────────────────────────────────

def _get_upload_context(document_id: str) -> dict[str, Any] | None:
    """
    Return { user_email, bin_assignment, sensitivity_level, privacy_tags }
    for the document by joining health_uploads + bin_assignments +
    sensitivity_profiles.
    Returns None if the upload record doesn't exist.
    """
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    hu.user_email,
                    COALESCE(ba.assigned_bins, '{}')         AS assigned_bins,
                    COALESCE(sp.sensitivity_level, 'standard') AS sensitivity_level,
                    COALESCE(sp.privacy_tags, '{}')          AS privacy_tags
                FROM health_uploads hu
                LEFT JOIN bin_assignments    ba ON ba.document_id = hu.document_id
                LEFT JOIN sensitivity_profiles sp ON sp.document_id = hu.document_id
                WHERE hu.document_id = %s
                LIMIT 1
                """,
                (document_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "user_email":        row[0],
                "assigned_bins":     list(row[1]),
                "sensitivity_level": row[2],
                "privacy_tags":      list(row[3]),
            }


def _get_normalized_observations(document_id: str) -> list[dict[str, Any]] | None:
    """Return active (non-superseded) normalised observations from the DB."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT normalized_observations
                FROM   normalized_results
                WHERE  document_id = %s
                LIMIT  1
                """,
                (document_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            raw = row[0]
            if isinstance(raw, str):
                raw = json.loads(raw)
            return [o for o in (raw or []) if not o.get("superseded", False)]


# ── Bin lookup: canonical test name → primary bin ─────────────────────────────
# Used to attach a single primary bin slug to each observation row.
# (The document's full bin list is available in bin_assignments for broader queries.)

_CATEGORY_TO_BIN: dict[str, str] = {
    "haematology":     "general_labs",
    "metabolic":       "general_labs",
    "lipids":          "cardiovascular",
    "thyroid":         "general_labs",
    "iron":            "general_labs",
    "vitamins":        "general_labs",
    "inflammation":    "general_labs",
    "cardiac":         "cardiovascular",
    "hormones":        "gynecology",
    "oncology":        "oncology",
    "mental_health":   "mental_health",
    "respiratory":     "respiratory",
    "gastroenterology":"gastroenterology",
    "musculoskeletal": "musculoskeletal",
    "imaging_score":   "general_labs",   # BI-RADS → gyn/onc handled by bin_assignment
    "medication":      "general_labs",
    "other":           "general_labs",
}


def _observation_to_row(
    obs: dict[str, Any],
    document_id: str,
    user_email: str,
    sensitivity_level: str,
    privacy_tags: list[str],
) -> dict[str, Any]:
    """Map one normalised observation dict to a health_observations insert dict."""
    category = obs.get("category") or "other"
    primary_bin = _CATEGORY_TO_BIN.get(category, "general_labs")

    # sensitivity_flag: True when the observation's primary bin is sensitive/high_sensitivity
    sensitive_bins = {"mental_health", "oncology", "gynecology"}
    sensitivity_flag = primary_bin in sensitive_bins or \
                       sensitivity_level in ("sensitive", "high_sensitivity")

    # numeric_value: prefer already-normalised float; fall back to parsing text
    normalized_value = obs.get("normalized_value")
    numeric_value: float | None = None
    if isinstance(normalized_value, (int, float)):
        numeric_value = float(normalized_value)
    elif isinstance(normalized_value, str):
        try:
            numeric_value = float(normalized_value.replace(",", ""))
        except (ValueError, AttributeError):
            numeric_value = None

    # value_text: human-readable string representation
    value_text = str(normalized_value) if normalized_value is not None else None

    return {
        "observation_id":        obs.get("observation_id"),
        "document_id":           document_id,
        "user_email":            user_email,
        "bin":                   primary_bin,
        "observation_date":      obs.get("observation_date"),      # ISO string or None
        "metric_name":           obs.get("original_test_name") or obs.get("canonical_test_name"),
        "canonical_metric_name": obs.get("canonical_test_name"),
        "display_name":          obs.get("display_name"),
        "category":              category,
        "value_text":            value_text,
        "numeric_value":         numeric_value,
        "unit":                  obs.get("normalized_unit"),
        "original_unit":         obs.get("original_unit"),
        "reference_range":       obs.get("reference_range_normalized"),
        "flag":                  obs.get("flag"),
        "interpretation":        obs.get("interpretation"),
        "confidence_score":      float(obs.get("confidence") or 0.5),
        "sensitivity_level":     sensitivity_level,
        "sensitivity_flag":      sensitivity_flag,
        "privacy_tags":          privacy_tags,
        "source_entity_index":   obs.get("source_entity_index"),
        "conversion_applied":    bool(obs.get("conversion_applied", False)),
    }


# ── Bulk upsert ────────────────────────────────────────────────────────────────

def _bulk_upsert(rows: list[dict[str, Any]]) -> int:
    """
    Bulk upsert rows into health_observations.
    Conflict target: (document_id, observation_id) — deterministic per document run.
    Returns count of rows written.
    """
    if not rows:
        return 0

    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            for row in rows:
                cur.execute(
                    """
                    INSERT INTO health_observations (
                        observation_id, document_id, user_email,
                        bin, observation_date,
                        metric_name, canonical_metric_name, display_name, category,
                        value_text, numeric_value, unit, original_unit,
                        reference_range, flag, interpretation,
                        confidence_score, sensitivity_level, sensitivity_flag,
                        privacy_tags, source_entity_index, conversion_applied
                    ) VALUES (
                        %(observation_id)s, %(document_id)s, %(user_email)s,
                        %(bin)s, %(observation_date)s,
                        %(metric_name)s, %(canonical_metric_name)s, %(display_name)s, %(category)s,
                        %(value_text)s, %(numeric_value)s, %(unit)s, %(original_unit)s,
                        %(reference_range)s, %(flag)s, %(interpretation)s,
                        %(confidence_score)s, %(sensitivity_level)s, %(sensitivity_flag)s,
                        %(privacy_tags)s, %(source_entity_index)s, %(conversion_applied)s
                    )
                    ON CONFLICT (document_id, observation_id) DO UPDATE SET
                        bin                   = EXCLUDED.bin,
                        observation_date      = EXCLUDED.observation_date,
                        metric_name           = EXCLUDED.metric_name,
                        canonical_metric_name = EXCLUDED.canonical_metric_name,
                        display_name          = EXCLUDED.display_name,
                        category              = EXCLUDED.category,
                        value_text            = EXCLUDED.value_text,
                        numeric_value         = EXCLUDED.numeric_value,
                        unit                  = EXCLUDED.unit,
                        original_unit         = EXCLUDED.original_unit,
                        reference_range       = EXCLUDED.reference_range,
                        flag                  = EXCLUDED.flag,
                        interpretation        = EXCLUDED.interpretation,
                        confidence_score      = EXCLUDED.confidence_score,
                        sensitivity_level     = EXCLUDED.sensitivity_level,
                        sensitivity_flag      = EXCLUDED.sensitivity_flag,
                        privacy_tags          = EXCLUDED.privacy_tags,
                        source_entity_index   = EXCLUDED.source_entity_index,
                        conversion_applied    = EXCLUDED.conversion_applied,
                        updated_at            = NOW()
                    """,
                    row,
                )
    return len(rows)


# ── Public API ─────────────────────────────────────────────────────────────────

def store_observations(document_id: str) -> StoreResult:
    """
    Full pipeline:
      1. Load normalised observations from DB
      2. Load document context (user, bins, sensitivity)
      3. Map to health_observations rows
      4. Bulk upsert
      5. Return StoreResult
    """
    ctx = _get_upload_context(document_id)
    if not ctx:
        raise ValueError(f"No upload record found for document_id={document_id}")

    observations = _get_normalized_observations(document_id)
    if observations is None:
        raise ValueError(f"No normalised results found for document_id={document_id}")

    log.info(
        "Storing %d observations for document %s (user=%s  sensitivity=%s)",
        len(observations), document_id, ctx["user_email"], ctx["sensitivity_level"],
    )

    rows = [
        _observation_to_row(
            obs=obs,
            document_id=document_id,
            user_email=ctx["user_email"],
            sensitivity_level=ctx["sensitivity_level"],
            privacy_tags=ctx["privacy_tags"],
        )
        for obs in observations
    ]

    upserted = _bulk_upsert(rows)
    skipped  = 0   # superseded were already filtered in _get_normalized_observations

    log.info("Stored %d health observations for document %s", upserted, document_id)

    return StoreResult(
        document_id  = document_id,
        upserted     = upserted,
        skipped      = skipped,
        observations = rows,
    )


# ── Gap detection helper (used by API route) ───────────────────────────────────

def detect_gaps(
    user_email: str,
    canonical_metric_name: str,
    max_gap_days: int = 180,
) -> list[dict[str, Any]]:
    """
    Return a list of gap periods for a metric where no observation exists.
    A gap is any interval between consecutive observations that exceeds
    max_gap_days.

    Each gap dict: { from_date, to_date, gap_days }
    """
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT observation_date
                FROM   health_observations
                WHERE  user_email = %s
                  AND  canonical_metric_name = %s
                  AND  observation_date IS NOT NULL
                ORDER BY observation_date ASC
                """,
                (user_email, canonical_metric_name),
            )
            dates = [row[0] for row in cur.fetchall()]

    gaps: list[dict[str, Any]] = []
    for i in range(1, len(dates)):
        prev = dates[i - 1]
        curr = dates[i]
        # dates are strings (ISO) or date objects depending on driver config
        from datetime import date as dt_date
        if isinstance(prev, str):
            from datetime import datetime
            prev = datetime.fromisoformat(prev).date()
            curr = datetime.fromisoformat(curr).date()
        delta = (curr - prev).days
        if delta > max_gap_days:
            gaps.append({
                "from_date": str(prev),
                "to_date":   str(curr),
                "gap_days":  delta,
            })

    return gaps


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
        description="Store normalised observations into the longitudinal health_observations table."
    )
    parser.add_argument("document_id", help="UUID of document to store")
    args = parser.parse_args()

    try:
        result = store_observations(args.document_id)
        print(json.dumps(result.to_dict(), indent=2))
    except Exception as exc:
        import traceback
        log.error("Longitudinal store failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

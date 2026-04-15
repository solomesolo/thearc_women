#!/usr/bin/env python3.10
"""
Intervention planner — The Arc Woman
======================================
Analyses a user's longitudinal health_observations to produce:

  care_gap_flags[]          — metrics where observations are overdue or missing
  suggested_followups[]     — upcoming interventions due within due_soon_days
  next_expected_intervention — soonest single action item

All output is written (upserted) into the `care_gap_flags` table so the API
can serve it without re-computing on every request.

Gap status values
-----------------
  never_recorded  — metric is in the registry but user has no observations
  overdue         — last_observed_date + interval_days < today
  due_soon        — within interval_days but within due_soon_days of due date
  current         — observation is still within expected window

Usage (CLI)
-----------
  python3.10 workers/intervention_planner.py <user_email>
"""
from __future__ import annotations

import json
import logging
import sys
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [INTERVENTION] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Result types ───────────────────────────────────────────────────────────────

@dataclass
class CareGapFlag:
    canonical_metric_name:  str
    category:               str
    label:                  str
    gap_status:             str           # never_recorded | overdue | due_soon | current
    priority:               str           # routine | surveillance | urgent
    last_observed_date:     str | None    # ISO date or None
    expected_interval_days: int
    next_expected_date:     str | None    # ISO date
    days_overdue:           int | None    # positive = overdue; None = not overdue
    days_until_due:         int | None    # positive = not yet due; None = already due
    suggested_action:       str
    guideline_source:       str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PlannerResult:
    user_email:                  str
    computed_at:                 str
    care_gap_flags:              list[CareGapFlag] = field(default_factory=list)
    suggested_followups:         list[CareGapFlag] = field(default_factory=list)
    next_expected_intervention:  CareGapFlag | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_email":                 self.user_email,
            "computed_at":                self.computed_at,
            "care_gap_flags":             [f.to_dict() for f in self.care_gap_flags],
            "suggested_followups":        [f.to_dict() for f in self.suggested_followups],
            "next_expected_intervention": self.next_expected_intervention.to_dict()
                                          if self.next_expected_intervention else None,
        }


# ── DB helpers ─────────────────────────────────────────────────────────────────

def _get_last_observed_dates(user_email: str) -> dict[str, dict[str, Any]]:
    """
    Return the most recent observation per (canonical_metric_name, category)
    for the user.

    Returns: {canonical_metric_name: {last_date: date, category: str}}
    """
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    canonical_metric_name,
                    category,
                    MAX(observation_date) AS last_date
                FROM health_observations
                WHERE user_email = %s
                  AND canonical_metric_name IS NOT NULL
                  AND observation_date IS NOT NULL
                GROUP BY canonical_metric_name, category
                """,
                (user_email,),
            )
            rows = cur.fetchall()

    result: dict[str, dict[str, Any]] = {}
    for canonical, category, last_date in rows:
        result[canonical] = {
            "last_date": last_date if isinstance(last_date, date)
                         else datetime.fromisoformat(str(last_date)).date(),
            "category":  category,
        }
    return result


def _bulk_upsert_gaps(user_email: str, gaps: list[CareGapFlag]) -> None:
    """Upsert care gap flag rows into the DB."""
    if not gaps:
        return

    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            for gap in gaps:
                cur.execute(
                    """
                    INSERT INTO care_gap_flags (
                        user_email, canonical_metric_name, category, label,
                        gap_status, priority,
                        last_observed_date, expected_interval_days,
                        next_expected_date, days_overdue, days_until_due,
                        suggested_action, guideline_source
                    ) VALUES (
                        %(user_email)s, %(canonical_metric_name)s, %(category)s, %(label)s,
                        %(gap_status)s, %(priority)s,
                        %(last_observed_date)s, %(expected_interval_days)s,
                        %(next_expected_date)s, %(days_overdue)s, %(days_until_due)s,
                        %(suggested_action)s, %(guideline_source)s
                    )
                    ON CONFLICT (user_email, canonical_metric_name) DO UPDATE SET
                        category               = EXCLUDED.category,
                        label                  = EXCLUDED.label,
                        gap_status             = EXCLUDED.gap_status,
                        priority               = EXCLUDED.priority,
                        last_observed_date     = EXCLUDED.last_observed_date,
                        expected_interval_days = EXCLUDED.expected_interval_days,
                        next_expected_date     = EXCLUDED.next_expected_date,
                        days_overdue           = EXCLUDED.days_overdue,
                        days_until_due         = EXCLUDED.days_until_due,
                        suggested_action       = EXCLUDED.suggested_action,
                        guideline_source       = EXCLUDED.guideline_source,
                        computed_at            = NOW()
                    """,
                    {
                        "user_email":            user_email,
                        "canonical_metric_name": gap.canonical_metric_name,
                        "category":              gap.category,
                        "label":                 gap.label,
                        "gap_status":            gap.gap_status,
                        "priority":              gap.priority,
                        "last_observed_date":    gap.last_observed_date,
                        "expected_interval_days": gap.expected_interval_days,
                        "next_expected_date":    gap.next_expected_date,
                        "days_overdue":          gap.days_overdue,
                        "days_until_due":        gap.days_until_due,
                        "suggested_action":      gap.suggested_action,
                        "guideline_source":      gap.guideline_source,
                    },
                )


def _read_stored_gaps(user_email: str) -> list[dict[str, Any]]:
    """Read all care gap flags for a user from the DB (for API serving)."""
    from workers.db import get_conn
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    canonical_metric_name, category, label,
                    gap_status, priority,
                    last_observed_date, expected_interval_days,
                    next_expected_date, days_overdue, days_until_due,
                    suggested_action, guideline_source, computed_at
                FROM care_gap_flags
                WHERE user_email = %s
                ORDER BY
                    CASE priority WHEN 'urgent' THEN 0 WHEN 'surveillance' THEN 1 ELSE 2 END,
                    CASE gap_status WHEN 'overdue' THEN 0 WHEN 'never_recorded' THEN 1 WHEN 'due_soon' THEN 2 ELSE 3 END,
                    days_overdue DESC NULLS LAST
                """,
                (user_email,),
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]


# ── Core computation ───────────────────────────────────────────────────────────

def _compute_gap(
    canonical_metric_name: str,
    category: str,
    last_date: date | None,
    today: date,
    interval_cfg: dict,
) -> CareGapFlag:
    """
    Given the last observed date (or None) and an interval config entry,
    return a CareGapFlag with the correct status.
    """
    interval_days  = interval_cfg["interval_days"]
    due_soon_days  = interval_cfg["due_soon_days"]
    label          = interval_cfg["label"]
    suggested_action = interval_cfg["suggested_action"]
    guideline_source = interval_cfg["guideline_source"]
    priority       = interval_cfg["priority"]
    cat            = interval_cfg.get("category", category)

    if last_date is None:
        return CareGapFlag(
            canonical_metric_name  = canonical_metric_name,
            category               = cat,
            label                  = label,
            gap_status             = "never_recorded",
            priority               = priority,
            last_observed_date     = None,
            expected_interval_days = interval_days,
            next_expected_date     = None,
            days_overdue           = None,
            days_until_due         = None,
            suggested_action       = suggested_action,
            guideline_source       = guideline_source,
        )

    next_expected = last_date + timedelta(days=interval_days)
    delta = (next_expected - today).days  # positive = not yet due, negative = overdue

    if delta < 0:
        gap_status    = "overdue"
        days_overdue  = abs(delta)
        days_until_due = None
    elif delta <= due_soon_days:
        gap_status    = "due_soon"
        days_overdue  = None
        days_until_due = delta
    else:
        gap_status    = "current"
        days_overdue  = None
        days_until_due = delta

    return CareGapFlag(
        canonical_metric_name  = canonical_metric_name,
        category               = cat,
        label                  = label,
        gap_status             = gap_status,
        priority               = priority,
        last_observed_date     = str(last_date),
        expected_interval_days = interval_days,
        next_expected_date     = str(next_expected),
        days_overdue           = days_overdue,
        days_until_due         = days_until_due,
        suggested_action       = suggested_action,
        guideline_source       = guideline_source,
    )


# ── Public API ─────────────────────────────────────────────────────────────────

def plan_interventions(user_email: str) -> PlannerResult:
    """
    Full pipeline:
      1. Load last observed dates per metric from health_observations
      2. For every metric in METRIC_INTERVALS, compute gap status
         (including metrics the user has NEVER recorded)
      3. Upsert into care_gap_flags
      4. Return PlannerResult with care_gap_flags + suggested_followups +
         next_expected_intervention

    Only metrics actually observed by the user OR present in METRIC_INTERVALS
    are evaluated — we don't generate noise for unrelated tests.
    """
    from workers.screening_intervals import METRIC_INTERVALS, get_interval

    today = date.today()
    observed = _get_last_observed_dates(user_email)

    log.info(
        "Planning interventions for %s — %d distinct metrics observed",
        user_email, len(observed),
    )

    all_flags: list[CareGapFlag] = []

    # ── Evaluate all metrics in METRIC_INTERVALS ───────────────────────────────
    # This catches both observed metrics and registry-known metrics the user
    # has never had documented.
    seen_metrics: set[str] = set()

    for metric_name, interval_cfg in METRIC_INTERVALS.items():
        seen_metrics.add(metric_name)
        obs_info = observed.get(metric_name)
        last_date = obs_info["last_date"] if obs_info else None
        category  = obs_info["category"] if obs_info else interval_cfg.get("category", "other")

        flag = _compute_gap(
            canonical_metric_name = metric_name,
            category              = category,
            last_date             = last_date,
            today                 = today,
            interval_cfg          = interval_cfg,
        )
        all_flags.append(flag)

    # ── Also evaluate observed metrics NOT in METRIC_INTERVALS ────────────────
    # Use category fallback — ensures trending data for all user tests.
    for metric_name, obs_info in observed.items():
        if metric_name in seen_metrics:
            continue
        category = obs_info["category"] or "other"
        interval_cfg = get_interval(metric_name, category)
        if not interval_cfg:
            continue

        flag = _compute_gap(
            canonical_metric_name = metric_name,
            category              = category,
            last_date             = obs_info["last_date"],
            today                 = today,
            interval_cfg          = interval_cfg,
        )
        all_flags.append(flag)

    # ── Persist ───────────────────────────────────────────────────────────────
    _bulk_upsert_gaps(user_email, all_flags)
    log.info("Upserted %d care gap flags for %s", len(all_flags), user_email)

    # ── Build output sub-lists ────────────────────────────────────────────────
    care_gap_flags = [
        f for f in all_flags
        if f.gap_status in ("overdue", "never_recorded")
    ]
    suggested_followups = [
        f for f in all_flags
        if f.gap_status == "due_soon"
    ]

    # Sort care gaps: urgent first, then overdue before never_recorded
    _PRIORITY_ORDER = {"urgent": 0, "surveillance": 1, "routine": 2}
    _STATUS_ORDER   = {"overdue": 0, "never_recorded": 1, "due_soon": 2, "current": 3}

    def _sort_key(f: CareGapFlag) -> tuple:
        return (
            _PRIORITY_ORDER.get(f.priority, 9),
            _STATUS_ORDER.get(f.gap_status, 9),
            -(f.days_overdue or 0),
        )

    care_gap_flags.sort(key=_sort_key)
    suggested_followups.sort(key=lambda f: f.days_until_due or 9999)

    # next_expected_intervention: soonest actionable item (overdue > due_soon > never_recorded)
    actionable = [f for f in all_flags if f.gap_status in ("overdue", "due_soon")]
    actionable.sort(key=_sort_key)
    next_intervention = actionable[0] if actionable else None

    computed_at = datetime.utcnow().isoformat() + "Z"

    return PlannerResult(
        user_email                 = user_email,
        computed_at                = computed_at,
        care_gap_flags             = care_gap_flags,
        suggested_followups        = suggested_followups,
        next_expected_intervention = next_intervention,
    )


def get_stored_interventions(user_email: str) -> dict[str, Any]:
    """
    Read pre-computed care gap flags from the DB without re-running the planner.
    Useful for the API GET endpoint.
    """
    rows = _read_stored_gaps(user_email)

    care_gaps = [r for r in rows if r["gap_status"] in ("overdue", "never_recorded")]
    followups = [r for r in rows if r["gap_status"] == "due_soon"]
    next_item = rows[0] if rows and rows[0]["gap_status"] in ("overdue", "due_soon") else None

    return {
        "care_gap_flags":             care_gaps,
        "suggested_followups":        followups,
        "next_expected_intervention": next_item,
    }


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
        description="Compute care gap flags and intervention plan for a user."
    )
    parser.add_argument("user_email", help="User email address")
    args = parser.parse_args()

    try:
        result = plan_interventions(args.user_email)
        print(json.dumps(result.to_dict(), indent=2, default=str))
    except Exception as exc:
        import traceback
        log.error("Intervention planner failed: %s", exc)
        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)

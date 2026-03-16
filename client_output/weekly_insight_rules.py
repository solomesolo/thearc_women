"""
Weekly Biological Insights: rules-based translator from temporal and safety state
into WeeklyInsightVMs. Educational, observational language only.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from client_output.contracts import WeeklyInsightVM


MAX_WEEKLY_INSIGHTS = 3
CHANGE_THRESHOLD = 20.0
MIN_OBSERVATIONS_7D = 2
CONFIDENCE_THRESHOLD = 40.0


def _as_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _eligible_entry(entry: Dict[str, Any], change_key: str) -> Tuple[bool, float]:
    change = _as_float(entry.get(change_key))
    if change < CHANGE_THRESHOLD:
        return False, change
    observations = int(entry.get("observations_7d") or 0)
    if observations < MIN_OBSERVATIONS_7D:
        return False, change
    if entry.get("single_day"):
        return False, change
    confidence = _as_float(entry.get("confidence"))
    if confidence < CONFIDENCE_THRESHOLD:
        return False, change
    if entry.get("safety_override"):
        return False, change
    return True, change


def _safety_suppressed(safety_state: Any) -> bool:
    if isinstance(safety_state, dict):
        if safety_state.get("safety_override") or safety_state.get("suppress_weekly_insights"):
            return True
    return False


def _cluster_entry(temporal_state: Any, cluster_id: str) -> Optional[Dict[str, Any]]:
    clusters = temporal_state.get("clusters") if isinstance(temporal_state, dict) else None
    if isinstance(clusters, dict):
        entry = clusters.get(cluster_id)
        if isinstance(entry, dict):
            return entry
    return None


def _system_entry(temporal_state: Any, system_id: str) -> Optional[Dict[str, Any]]:
    systems = temporal_state.get("systems") if isinstance(temporal_state, dict) else None
    if isinstance(systems, dict):
        entry = systems.get(system_id)
        if isinstance(entry, dict):
            return entry
    return None


def _build_sleep_change_insight(entry: Dict[str, Any]) -> WeeklyInsightVM:
    return WeeklyInsightVM(
        headline="Sleep variability increased this week.",
        bullets=[
            "Sleep timing shifted later or varied more than usual this week.",
            "Signals of lighter or shorter sleep appeared more often than in prior weeks.",
        ],
        interpretation=(
            "Patterns like this sometimes appear when bedtime and wake times vary across the week "
            "or when recovery time is limited."
        ),
    )


def _build_stress_accum_insight(entry: Dict[str, Any]) -> WeeklyInsightVM:
    return WeeklyInsightVM(
        headline="Stress-related signals rose midweek.",
        bullets=[
            "Stress or tension-related signals appeared more often across several days.",
            "Unwinding or recovery periods were fewer or shorter than usual.",
        ],
        interpretation=(
            "Signals like this may reflect periods when demands stay high while recovery time is limited."
        ),
    )


def _build_recovery_variability_insight(entry: Dict[str, Any]) -> WeeklyInsightVM:
    return WeeklyInsightVM(
        headline="Recovery patterns varied this week.",
        bullets=[
            "Rest days or lighter-activity days were less frequent than in prior weeks.",
            "Higher-intensity days clustered more closely together.",
        ],
        interpretation=(
            "This pattern can occur during weeks when training or activity increases faster than recovery time."
        ),
    )


def _build_energy_stability_insight(entry: Dict[str, Any]) -> WeeklyInsightVM:
    change = _as_float(entry.get("score_change") or entry.get("strength_change"))
    if change >= 0:
        headline = "Energy levels were more stable this week."
        bullets = [
            "Energy dips appeared less often or were milder than in prior weeks.",
            "Daily energy patterns looked more even across the week.",
        ]
    else:
        headline = "Energy levels shifted this week."
        bullets = [
            "Afternoon or end-of-day fatigue appeared more often than usual.",
            "Daily energy patterns looked less even across the week.",
        ]
    return WeeklyInsightVM(
        headline=headline,
        bullets=bullets,
        interpretation=(
            "Patterns like this sometimes appear when sleep, meal timing, stress, or activity levels change."
        ),
    )


def _build_digestive_pattern_insight(entry: Dict[str, Any]) -> WeeklyInsightVM:
    return WeeklyInsightVM(
        headline="Digestive patterns shifted this week.",
        bullets=[
            "Bloating, discomfort, or bowel pattern changes appeared on multiple days.",
            "Meal timing or food choices varied compared with prior weeks.",
        ],
        interpretation=(
            "Signals like this may reflect changes in routine, meal patterns, or other day-to-day factors."
        ),
    )


def _build_cycle_rhythm_insight(entry: Dict[str, Any]) -> WeeklyInsightVM:
    return WeeklyInsightVM(
        headline="Cycle signals shifted this week.",
        bullets=[
            "Cycle-related symptoms appeared at a slightly different time than in recent cycles.",
            "Energy or mood changes clustered around a particular phase of the cycle.",
        ],
        interpretation=(
            "This pattern can occur during cycle transitions or when routines, stress, or sleep change across phases."
        ),
    )


def build_weekly_insights(temporal_state: Any, safety_state: Any) -> List[WeeklyInsightVM]:
    """
    Build up to MAX_WEEKLY_INSIGHTS weekly insights from temporal and safety state.

    Eligibility:
    - cluster_strength_change >= threshold OR system_score_change >= threshold
    - at least MIN_OBSERVATIONS_7D observations in 7 days
    - not from single-day signals
    - confidence >= CONFIDENCE_THRESHOLD
    - suppressed when safety overrides are present
    """
    if not temporal_state or _safety_suppressed(safety_state):
        return []

    insights: List[Tuple[str, float, WeeklyInsightVM]] = []

    # Highest cluster change: sleep, stress, energy, gut, recovery
    cluster_candidates: List[Tuple[str, float, WeeklyInsightVM]] = []
    for cid, builder in [
        ("CL_SLEEP_DISRUPT", _build_sleep_change_insight),
        ("CL_STRESS_ACCUM", _build_stress_accum_insight),
        ("CL_ENERGY_VAR", _build_energy_stability_insight),
        ("CL_GUT_PATTERN", _build_digestive_pattern_insight),
        ("CL_TRAIN_MISMATCH", _build_recovery_variability_insight),
    ]:
        entry = _cluster_entry(temporal_state, cid)
        if not entry:
            continue
        ok, change = _eligible_entry(entry, "strength_change")
        if not ok:
            continue
        cluster_candidates.append(("cluster", change, builder(entry)))

    if cluster_candidates:
        # pick the one with greatest change
        insights.append(max(cluster_candidates, key=lambda x: x[1]))

    # Strongest system change (if not already covered): sleep, stress, energy, gut
    system_candidates: List[Tuple[str, float, WeeklyInsightVM]] = []
    for sid, builder in [
        ("SYS_SLEEP", _build_sleep_change_insight),
        ("SYS_STRESS", _build_stress_accum_insight),
        ("SYS_METABOLIC", _build_energy_stability_insight),
        ("SYS_GUT", _build_digestive_pattern_insight),
    ]:
        entry = _system_entry(temporal_state, sid)
        if not entry:
            continue
        ok, change = _eligible_entry(entry, "score_change")
        if not ok:
            continue
        system_candidates.append(("system", change, builder(entry)))

    if system_candidates and len(insights) < MAX_WEEKLY_INSIGHTS:
        # select highest change system
        system_insight = max(system_candidates, key=lambda x: x[1])
        # avoid duplicate headline category (simple check via headline text)
        existing_headlines = {i[2].headline for i in insights}
        if system_insight[2].headline not in existing_headlines:
            insights.append(system_insight)

    # Cycle-context insight (low priority, added last if room)
    cycle_entry = _system_entry(temporal_state, "SYS_HORMONAL")
    if cycle_entry and len(insights) < MAX_WEEKLY_INSIGHTS:
        ok, change = _eligible_entry(cycle_entry, "score_change")
        if ok:
            cycle_insight = ("cycle", change, _build_cycle_rhythm_insight(cycle_entry))
            existing_headlines = {i[2].headline for i in insights}
            if cycle_insight[2].headline not in existing_headlines:
                insights.append(cycle_insight)

    # Sort final insights by change magnitude desc and take up to MAX_WEEKLY_INSIGHTS
    insights.sort(key=lambda x: x[1], reverse=True)
    result = [i[2] for i in insights[:MAX_WEEKLY_INSIGHTS]]

    # Ensure bullets limit
    for vm in result:
        if len(vm.bullets) > 3:
            vm.bullets = vm.bullets[:3]

    return result


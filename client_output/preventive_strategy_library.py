"""
Preventive Strategy cards: deterministic, educational strategies tied to root patterns
and systems. No treatment language; focus on exploring, learning about, observing,
and supporting patterns over time.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from client_output.contracts import PreventiveStrategyVM


MAX_STRATEGIES = 3
PATTERN_CONFIDENCE_THRESHOLD = 40.0


# ---------------------------------------------------------------------------
# Mappings from engine concepts to strategy identifiers
# ---------------------------------------------------------------------------

ROOT_PATTERN_TO_STRATEGY: Dict[str, str] = {
    "RP_BLOOD_SUGAR": "STR_MEAL_TIMING",
    "RP_STRESS_LOAD": "STR_STRESS_RECOVERY",
    "RP_IRON_DEPLETION": "STR_IRON_SUPPORT_CONTEXT",
    "RP_THYROID_SLOWING": "STR_METABOLIC_STABILITY",
    "RP_SLEEP_DEPRIVATION": "STR_SLEEP_RHYTHM",
    "RP_GUT_DYSBIOSIS": "STR_GUT_SUPPORT",
    "RP_MICRO_DEPLETION": "STR_NUTRIENT_SUPPORT",
    "RP_OVERTRAIN": "STR_RECOVERY_BALANCE",
    "RP_INFLAM_CTX": "STR_INFLAM_CONTEXT_SUPPORT",
    "RP_PERI_TRANSITION": "STR_PERIMENOPAUSE_CONTEXT",
}

SYSTEM_TO_STRATEGY: Dict[str, str] = {
    "SYS_SLEEP": "STR_SLEEP_ENVIRONMENT",
    "SYS_STRESS": "STR_NERVOUS_SYSTEM_BALANCE",
    "SYS_METABOLIC": "STR_METABOLIC_STABILITY",
    "SYS_GUT": "STR_DIGESTIVE_RHYTHM",
    "SYS_MICRO": "STR_NUTRIENT_SUPPORT",
    "SYS_HORMONAL": "STR_HORMONE_RHYTHM_SUPPORT",
    "SYS_INFLAM_CTX": "STR_INFLAM_CONTEXT_SUPPORT",
}


# ---------------------------------------------------------------------------
# Strategy content: id -> (title, focus_description, priority_area)
# Language uses exploring / learning / observing / supporting; avoids fix/treat/etc.
# ---------------------------------------------------------------------------

STRATEGY_CONTENT: Dict[str, Tuple[str, str, str]] = {
    "STR_SLEEP_RHYTHM": (
        "Consistent Sleep Rhythm",
        "Explore a consistent sleep and wake rhythm to support rest and recovery over time.",
        "Sleep",
    ),
    "STR_STRESS_RECOVERY": (
        "Stress Recovery Support",
        "Learn about ways to support recovery between stressors and observe how this affects your signals.",
        "Stress",
    ),
    "STR_MEAL_TIMING": (
        "Meal Timing Stability",
        "Explore meal timing and composition patterns that may support steadier energy through the day.",
        "Blood sugar",
    ),
    "STR_NUTRIENT_SUPPORT": (
        "Nutrient Reserve Support",
        "Learn about nutrient reserves and ways to support them through food, habits, and clinician guidance.",
        "Nutrients",
    ),
    "STR_IRON_SUPPORT_CONTEXT": (
        "Iron Support Context",
        "Explore iron reserve context and observe how energy and stamina respond over time.",
        "Iron",
    ),
    "STR_GUT_SUPPORT": (
        "Digestion Support Patterns",
        "Learn about gentle digestion-support patterns and observe how your gut comfort responds.",
        "Gut",
    ),
    "STR_RECOVERY_BALANCE": (
        "Training Recovery Balance",
        "Explore the balance between training load and recovery days and observe how this supports your energy.",
        "Recovery",
    ),
    "STR_HORMONE_RHYTHM_SUPPORT": (
        "Cycle Rhythm Awareness",
        "Learn about cycle rhythm patterns and observe how timing relates to your signals.",
        "Hormones",
    ),
    "STR_METABOLIC_STABILITY": (
        "Energy Stability Habits",
        "Explore everyday habits that may support metabolic stability and more even energy.",
        "Metabolic",
    ),
    "STR_SLEEP_ENVIRONMENT": (
        "Sleep Environment Optimization",
        "Learn about sleep environment factors and observe which changes most support your rest.",
        "Sleep",
    ),
    "STR_NERVOUS_SYSTEM_BALANCE": (
        "Nervous System Regulation",
        "Explore calming practices and routines that may support nervous system balance.",
        "Stress",
    ),
    "STR_INFLAM_CONTEXT_SUPPORT": (
        "Inflammation Context Awareness",
        "Learn about inflammation context and observe patterns that may support whole-system comfort.",
        "Inflammation",
    ),
    "STR_PERIMENOPAUSE_CONTEXT": (
        "Perimenopause Transition Awareness",
        "Explore perimenopause transition education and observe how cycle and symptom patterns evolve.",
        "Life stage",
    ),
    "STR_DIGESTIVE_RHYTHM": (
        "Daily Digestive Rhythm",
        "Learn about daily digestive rhythm and observe how meal timing and routines support gut comfort.",
        "Gut",
    ),
}


def _pattern_id(p: Any) -> Optional[str]:
    if isinstance(p, dict):
        pid = p.get("pattern_id") or p.get("id")
    else:
        pid = getattr(p, "pattern_id", None) or getattr(p, "id", None)
    return str(pid).strip() if pid else None


def _pattern_confidence(p: Any) -> float:
    if isinstance(p, dict):
        val = p.get("confidence") or p.get("support") or 0
    else:
        val = getattr(p, "confidence", None) or getattr(p, "support", None) or 0
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def _system_score(s: Any) -> Tuple[Optional[str], float]:
    if isinstance(s, dict):
        sid = s.get("system_id") or s.get("id")
        score = s.get("score") or s.get("status_score") or 0
    else:
        sid = getattr(s, "system_id", None) or getattr(s, "id", None)
        score = getattr(s, "score", None) or getattr(s, "status_score", None) or 0
    try:
        return (str(sid).strip() if sid else None, float(score))
    except (TypeError, ValueError):
        return (str(sid).strip() if sid else None, 0.0)


def _make_strategy(strategy_id: str) -> PreventiveStrategyVM:
    title, focus_description, priority_area = STRATEGY_CONTENT[strategy_id]
    return PreventiveStrategyVM(
        title=title,
        focus_description=focus_description,
        priority_area=priority_area,
    )


def build_preventive_strategies(
    patterns: List[Any],
    systems: List[Any],
) -> List[PreventiveStrategyVM]:
    """
    Build up to MAX_STRATEGIES preventive strategies from root patterns and systems.

    - Strategies are tied to root patterns (confidence >= PATTERN_CONFIDENCE_THRESHOLD).
    - Selection order: strongest root pattern, supporting pattern, system-context strategy.
    - Language uses exploring / learning about / observing / supporting; avoids fix/treat/etc.
    """
    result: List[PreventiveStrategyVM] = []
    used_ids: set[str] = set()

    # Root patterns sorted by confidence
    candidates: List[Tuple[str, float]] = []
    for p in patterns or []:
        pid = _pattern_id(p)
        if not pid or pid not in ROOT_PATTERN_TO_STRATEGY:
            continue
        conf = _pattern_confidence(p)
        if conf < PATTERN_CONFIDENCE_THRESHOLD:
            continue
        candidates.append((pid, conf))
    candidates.sort(key=lambda x: x[1], reverse=True)

    # 1) Strongest root pattern
    if candidates:
        primary_pid, _ = candidates[0]
        primary_sid = ROOT_PATTERN_TO_STRATEGY.get(primary_pid)
        if primary_sid and primary_sid in STRATEGY_CONTENT:
            used_ids.add(primary_sid)
            result.append(_make_strategy(primary_sid))

    if len(result) >= MAX_STRATEGIES:
        return result

    # 2) Supporting pattern (next strongest)
    if len(candidates) > 1:
        for pid, _ in candidates[1:]:
            sid = ROOT_PATTERN_TO_STRATEGY.get(pid)
            if not sid or sid in used_ids or sid not in STRATEGY_CONTENT:
                continue
            used_ids.add(sid)
            result.append(_make_strategy(sid))
            break

    if len(result) >= MAX_STRATEGIES:
        return result

    # 3) System context strategy: highest scoring mapped system
    best_system: Tuple[Optional[str], float] = (None, 0.0)
    for s in systems or []:
        sid, score = _system_score(s)
        if not sid or sid not in SYSTEM_TO_STRATEGY:
            continue
        if best_system[0] is None or score > best_system[1]:
            best_system = (sid, score)

    if best_system[0] is not None:
        strat_id = SYSTEM_TO_STRATEGY.get(best_system[0])
        if strat_id and strat_id not in used_ids and strat_id in STRATEGY_CONTENT:
            used_ids.add(strat_id)
            result.append(_make_strategy(strat_id))

    return result[:MAX_STRATEGIES]


"""
Recommended for You: selection from approved hierarchy (lens → root pattern → cluster → system → life stage).

Max 3 recommendations. No treatment language; preferred verbs: support, explore, understand, learn about.
Pattern confidence >= 40; suppressed patterns excluded.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Tuple

from client_output.contracts import RecommendationVM

MAX_RECOMMENDATIONS = 3
PATTERN_CONFIDENCE_THRESHOLD = 40
PriorityLabel = Literal["high", "medium", "low"]

# ---------------------------------------------------------------------------
# Entity ID -> content_tag (for lookup)
# ---------------------------------------------------------------------------

LENS_TO_TAG: Dict[str, str] = {
    "LENS_STRESS_RECOVERY": "stress_regulation",
    "LENS_ENERGY_METABOLIC": "energy_stability",
    "LENS_HORMONAL_RHYTHM": "cycle_health",
    "LENS_GUT_ABSORPTION": "gut_health",
    "LENS_NUTRIENT_RESERVES": "nutrient_support",
}

ROOT_PATTERN_TO_TAG: Dict[str, str] = {
    "RP_BLOOD_SUGAR": "blood_sugar_stability",
    "RP_STRESS_LOAD": "stress_load_management",
    "RP_IRON_DEPLETION": "iron_support",
    "RP_THYROID_SLOWING": "thyroid_health_context",
    "RP_SLEEP_DEPRIVATION": "sleep_recovery",
    "RP_GUT_DYSBIOSIS": "gut_microbiome_support",
    "RP_MICRO_DEPLETION": "nutrient_repletion",
    "RP_OVERTRAIN": "recovery_balance",
}

CLUSTER_TO_TAG: Dict[str, str] = {
    "CL_SLEEP_DISRUPT": "sleep_hygiene",
    "CL_ENERGY_VAR": "energy_rhythm",
    "CL_STRESS_ACCUM": "stress_management",
    "CL_SUGAR_INSTAB": "meal_timing",
    "CL_GUT_PATTERN": "digestive_support",
    "CL_CYCLE_VAR": "cycle_tracking",
    "CL_TRAIN_MISMATCH": "training_recovery",
}

SYSTEM_TO_TAG: Dict[str, str] = {
    "SYS_SLEEP": "sleep_rhythm",
    "SYS_STRESS": "nervous_system_regulation",
    "SYS_METABOLIC": "metabolic_balance",
    "SYS_GUT": "gut_health",
    "SYS_MICRO": "nutrient_reserves",
    "SYS_HORMONAL": "hormone_cycle_education",
}

# Life stage: engine may send LS_PERI, LS_POSTPARTUM, or derived_flags keys
LIFE_STAGE_TO_TAG: Dict[str, str] = {
    "perimenopause": "hormone_transition",
    "LS_PERI": "hormone_transition",
    "postpartum": "recovery_support",
    "LS_POSTPARTUM": "recovery_support",
    "LS_BREASTFEED": "recovery_support",
    "athlete_training": "recovery_balance",
    "contraceptive_use": "hormone_context",
    "LS_POST_HC": "hormone_context",
}

# ---------------------------------------------------------------------------
# content_tag -> (title, reason). Educational only; support, explore, understand, learn about.
# No fix, cure, treat, reverse.
# ---------------------------------------------------------------------------

RECOMMENDATION_CONTENT: Dict[str, Tuple[str, str]] = {
    # Lens
    "stress_regulation": ("Support stress & recovery", "Explore stress regulation and recovery patterns that may support your signals."),
    "energy_stability": ("Support energy stability", "Learn about energy and metabolic patterns that may support daily rhythm."),
    "cycle_health": ("Support cycle awareness", "Understand hormonal rhythm and cycle patterns that may support your context."),
    "gut_health": ("Support gut comfort", "Explore gut and absorption patterns that may support digestive comfort."),
    "nutrient_support": ("Support nutrient reserves", "Learn about nutrient reserves and vitality patterns that may support your signals."),
    # Root patterns
    "blood_sugar_stability": ("Support blood sugar stability", "Explore meal timing and blood sugar patterns that may support energy stability."),
    "stress_load_management": ("Support stress load management", "Understand stress load and recovery patterns that may support your signals."),
    "iron_support": ("Support iron reserve context", "Learn about iron reserve patterns that may support energy and vitality context."),
    "thyroid_health_context": ("Support thyroid health context", "Explore thyroid regulation context that may support metabolic and energy signals."),
    "sleep_recovery": ("Support sleep recovery", "Understand sleep and recovery patterns that may support rest and restoration."),
    "gut_microbiome_support": ("Support gut microbiome", "Learn about gut balance patterns that may support digestive comfort."),
    "nutrient_repletion": ("Support nutrient repletion", "Explore nutrient reserve patterns that may support vitality."),
    "recovery_balance": ("Support recovery balance", "Understand training and recovery balance that may support your signals."),
    # Clusters
    "sleep_hygiene": ("Support sleep hygiene", "Explore sleep timing and habits that may support rest quality."),
    "energy_rhythm": ("Support energy rhythm", "Learn about daily energy patterns that may support your rhythm."),
    "stress_management": ("Support stress management", "Explore stress management approaches that may support your signals."),
    "meal_timing": ("Support meal timing", "Understand meal timing patterns that may support energy and hunger signals."),
    "digestive_support": ("Support digestive comfort", "Learn about digestive patterns that may support gut comfort."),
    "cycle_tracking": ("Support cycle tracking", "Explore cycle tracking to understand timing and flow patterns."),
    "training_recovery": ("Support training recovery", "Understand recovery balance that may support training and fatigue signals."),
    # Systems
    "sleep_rhythm": ("Support sleep rhythm", "Explore sleep architecture patterns that may support rest."),
    "nervous_system_regulation": ("Support nervous system regulation", "Learn about stress response patterns that may support your signals."),
    "metabolic_balance": ("Support metabolic balance", "Understand metabolic patterns that may support energy and hunger."),
    "hormone_cycle_education": ("Support hormone cycle education", "Learn about hormone cycle patterns that may support your context."),
    "nutrient_reserves": ("Support nutrient reserves", "Explore micronutrient reserve patterns that may support vitality."),
    # Life stage
    "hormone_transition": ("Support hormone transition", "Learn about hormone transition context that may support your signals."),
    "recovery_support": ("Support recovery", "Explore recovery support patterns that may support your life stage context."),
    "hormone_context": ("Support hormone context", "Understand hormone context that may support your signals."),
}


def _get_primary_lens(engine_output: Any) -> Optional[str]:
    """Extract primary lens ID from engine output."""
    raw = engine_output if isinstance(engine_output, dict) else {}
    lens = raw.get("lens")
    if lens is None:
        lenses = raw.get("lenses") or []
        if lenses:
            first = lenses[0]
            if isinstance(first, dict):
                return first.get("lens_id") or first.get("primary_lens_id")
            return getattr(first, "primary_lens_id", None) or getattr(first, "lens_id", None)
        return None
    if isinstance(lens, dict):
        lid = lens.get("primary_lens_id") or lens.get("lens_id")
        return str(lid).strip() if lid else None
    return getattr(lens, "primary_lens_id", None) or getattr(lens, "lens_id", None)


def _get_root_patterns(engine_output: Any) -> List[Tuple[str, float]]:
    """Return list of (pattern_id, confidence) sorted by confidence desc. Excludes suppressed."""
    raw = engine_output if isinstance(engine_output, dict) else {}
    suppressed = set(raw.get("suppressed_pattern_ids") or [])
    patterns = raw.get("root_patterns") or []
    out: List[Tuple[str, float]] = []
    for p in patterns:
        if isinstance(p, dict):
            pid = p.get("pattern_id") or p.get("id")
            conf = float(p.get("confidence") or p.get("support") or 0)
            if p.get("suppressed") or (pid and str(pid).strip() in suppressed):
                continue
        else:
            pid = getattr(p, "pattern_id", None) or getattr(p, "id", None)
            conf = float(getattr(p, "confidence", 0) or getattr(p, "support", 0))
            if getattr(p, "suppressed", False) or (pid and str(pid).strip() in suppressed):
                continue
        if pid and str(pid).strip() in ROOT_PATTERN_TO_TAG:
            out.append((str(pid).strip(), conf))
    out.sort(key=lambda x: x[1], reverse=True)
    return out


def _get_top_cluster(engine_output: Any) -> Optional[Tuple[str, float]]:
    """Return (cluster_id, rank_score) for strongest qualifying cluster. Rank by strength then confidence."""
    raw = engine_output if isinstance(engine_output, dict) else {}
    clusters = raw.get("clusters") or []
    best: Optional[Tuple[str, float, float]] = None
    for c in clusters:
        if isinstance(c, dict):
            cid = c.get("cluster_id") or c.get("id")
            strength = float(c.get("strength") or 0)
            conf = float(c.get("confidence") or 0)
        else:
            cid = getattr(c, "cluster_id", None) or getattr(c, "id", None)
            strength = float(getattr(c, "strength", 0) or 0)
            conf = float(getattr(c, "confidence", 0) or 0)
        if not cid or str(cid).strip() not in CLUSTER_TO_TAG:
            continue
        score = (strength, conf)
        if best is None or score > (best[1], best[2]):
            best = (str(cid).strip(), strength, conf)
    return (best[0], best[1] + best[2] / 100.0) if best else None


def _get_top_system(engine_output: Any) -> Optional[Tuple[str, float]]:
    """Return (system_id, score) for strongest qualifying system."""
    raw = engine_output if isinstance(engine_output, dict) else {}
    systems = raw.get("systems") or []
    best: Optional[Tuple[str, float]] = None
    for s in systems:
        if isinstance(s, dict):
            sid = s.get("system_id") or s.get("id")
            score = float(s.get("score") or s.get("status_score") or 0)
        else:
            sid = getattr(s, "system_id", None) or getattr(s, "id", None)
            score = float(getattr(s, "score", 0) or getattr(s, "status_score", 0))
        if not sid or str(sid).strip() not in SYSTEM_TO_TAG:
            continue
        if best is None or score > best[1]:
            best = (str(sid).strip(), score)
    return best


def _get_life_stage_tag(engine_output: Any) -> Optional[str]:
    """Return content_tag for life stage if present. Low priority unless supported by signals."""
    raw = engine_output if isinstance(engine_output, dict) else {}
    life_stage = raw.get("life_stage")
    if life_stage and str(life_stage).strip() in LIFE_STAGE_TO_TAG:
        return LIFE_STAGE_TO_TAG[str(life_stage).strip()]
    flags = raw.get("derived_flags") or {}
    if isinstance(flags, dict):
        if flags.get("is_perimenopause"):
            return LIFE_STAGE_TO_TAG.get("perimenopause") or LIFE_STAGE_TO_TAG.get("LS_PERI")
        if flags.get("is_postpartum"):
            return LIFE_STAGE_TO_TAG.get("postpartum") or LIFE_STAGE_TO_TAG.get("LS_POSTPARTUM")
        if flags.get("athlete_training"):
            return LIFE_STAGE_TO_TAG.get("athlete_training")
        if flags.get("contraceptive_use"):
            return LIFE_STAGE_TO_TAG.get("contraceptive_use")
    return None


def _make_rec(content_tag: str, priority: PriorityLabel) -> RecommendationVM:
    title, reason = RECOMMENDATION_CONTENT.get(content_tag, (f"Explore {content_tag}", "Learn about patterns that may support your signals."))
    return RecommendationVM(content_tag=content_tag, title=title, reason=reason, priority=priority)


def _safety_suppressed(engine_output: Any) -> bool:
    """Return True if safety overrides should suppress non-essential recommendations."""
    if not isinstance(engine_output, dict):
        return False
    safety = engine_output.get("safety_state")
    if isinstance(safety, dict):
        if safety.get("safety_override") or safety.get("suppress_recommendations"):
            return True
    return False


def build_recommendations(engine_output: Any) -> List[RecommendationVM]:
    """
    Build up to MAX_RECOMMENDATIONS from hierarchy: lens → root pattern → cluster/system → life stage.

    - Always one lens recommendation when a non-baseline lens exists.
    - Strongest root pattern if pattern_confidence >= 40 (and not suppressed).
    - Strongest qualifying cluster or system.
    - Life stage is low priority; include only if slot remains.
    - Recommendations never imply treatment; language uses support, explore, understand, learn about.
    """
    if _safety_suppressed(engine_output):
        return []
    result: List[RecommendationVM] = []
    seen_tags: set[str] = set()

    # 1) Primary lens (first when present, skip LENS_BASELINE if it's the only one)
    primary_lens = _get_primary_lens(engine_output)
    if primary_lens and primary_lens != "LENS_BASELINE" and primary_lens in LENS_TO_TAG:
        tag = LENS_TO_TAG[primary_lens]
        if tag not in seen_tags:
            seen_tags.add(tag)
            result.append(_make_rec(tag, "high"))

    if len(result) >= MAX_RECOMMENDATIONS:
        return result

    # 2) Strongest root pattern with confidence >= 40
    for pid, conf in _get_root_patterns(engine_output):
        if conf < PATTERN_CONFIDENCE_THRESHOLD:
            continue
        tag = ROOT_PATTERN_TO_TAG.get(pid)
        if tag and tag not in seen_tags:
            seen_tags.add(tag)
            result.append(_make_rec(tag, "high" if len(result) == 0 else "medium"))
            if len(result) >= MAX_RECOMMENDATIONS:
                return result
        break  # only strongest

    # 3) Strongest cluster or system (one slot)
    top_cluster = _get_top_cluster(engine_output)
    top_system = _get_top_system(engine_output)
    cluster_score = top_cluster[1] if top_cluster else -1.0
    system_score = top_system[1] if top_system else -1.0
    if top_cluster and cluster_score >= system_score:
        tag = CLUSTER_TO_TAG.get(top_cluster[0])
        if tag and tag not in seen_tags:
            seen_tags.add(tag)
            result.append(_make_rec(tag, "medium"))
            if len(result) >= MAX_RECOMMENDATIONS:
                return result
    elif top_system:
        tag = SYSTEM_TO_TAG.get(top_system[0])
        if tag and tag not in seen_tags:
            seen_tags.add(tag)
            result.append(_make_rec(tag, "medium"))
            if len(result) >= MAX_RECOMMENDATIONS:
                return result

    # 4) Life stage (low priority)
    life_tag = _get_life_stage_tag(engine_output)
    if life_tag and life_tag not in seen_tags and len(result) < MAX_RECOMMENDATIONS:
        result.append(_make_rec(life_tag, "low"))

    return result[:MAX_RECOMMENDATIONS]

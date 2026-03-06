"""
Evaluate safety rules and return structured SafetyPrompt objects and escalation metadata.
Phase 9: safety before interpretation; structured rules only; no diagnosis.
"""

from typing import Any, Dict, List, Optional, Tuple

from engine.types import SafetyPrompt

SAFETY_RULES = [
    {"rule_id": "SAFE01", "trigger_signals": ["missed_period"], "condition_key": "missed_period_ge_3_months", "message_type": "clinical awareness", "priority": "medium", "escalation_suggestion": "consider discussing cycle changes with a healthcare provider"},
    {"rule_id": "SAFE02", "trigger_signals": ["heavy_bleeding", "dizziness"], "condition_key": "heavy_bleeding_and_dizziness_same_cycle", "message_type": "urgent attention", "priority": "high", "escalation_suggestion": "seek medical evaluation promptly if symptoms persist or worsen"},
    {"rule_id": "SAFE03", "trigger_signals": ["heavy_bleeding"], "condition_key": "bleeding_duration_ge_10_days", "message_type": "clinical awareness", "priority": "medium", "escalation_suggestion": "consider clinical evaluation for prolonged bleeding"},
    {"rule_id": "SAFE04", "trigger_signals": ["heavy_bleeding"], "condition_key": "very_heavy_flow_ge_2_cycles", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "discuss bleeding patterns with healthcare provider"},
    {"rule_id": "SAFE05", "trigger_signals": ["unexplained_weight_loss"], "condition_key": "weight_loss_ge_5_percent_3mo", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "consider medical evaluation to assess possible causes"},
    {"rule_id": "SAFE06", "trigger_signals": ["palpitations", "dizziness"], "condition_key": "palpitations_and_dizziness_sev_ge_3", "message_type": "urgent attention", "priority": "high", "escalation_suggestion": "seek prompt medical evaluation if symptoms continue"},
    {"rule_id": "SAFE07", "trigger_signals": ["palpitations", "exercise_intolerance"], "condition_key": "palpitations_and_ex_intol_moderate", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "consider cardiovascular assessment with clinician"},
    {"rule_id": "SAFE08", "trigger_signals": ["persistent_fatigue"], "condition_key": "fatigue_sev_ge_4_for_ge_8_weeks", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "clinician may consider lab evaluation for fatigue causes"},
    {"rule_id": "SAFE09", "trigger_signals": ["fatigue", "hair_loss", "dizziness"], "condition_key": "two_of_fatigue_hairloss_dizziness_persist_ge_4_weeks", "message_type": "clinical awareness", "priority": "medium", "escalation_suggestion": "clinician may evaluate nutrient or iron levels"},
    {"rule_id": "SAFE10", "trigger_signals": ["cold_intolerance", "fatigue", "dry_skin"], "condition_key": "cold_fatigue_dryskin_persist_ge_6_weeks", "message_type": "clinical awareness", "priority": "medium", "escalation_suggestion": "clinician may consider thyroid function evaluation"},
    {"rule_id": "SAFE11", "trigger_signals": ["night_sweats", "unexplained_weight_loss"], "condition_key": "night_sweats_and_weight_loss_persist_ge_4_weeks", "message_type": "urgent attention", "priority": "high", "escalation_suggestion": "medical evaluation recommended if symptoms continue"},
    {"rule_id": "SAFE12", "trigger_signals": ["persistent_diarrhea"], "condition_key": "diarrhea_ge_7_days", "message_type": "urgent attention", "priority": "high", "escalation_suggestion": "seek medical evaluation for persistent gastrointestinal symptoms"},
    {"rule_id": "SAFE13", "trigger_signals": ["severe_constipation"], "condition_key": "no_bowel_movement_ge_7_days", "message_type": "urgent attention", "priority": "high", "escalation_suggestion": "medical evaluation recommended if symptoms persist"},
    {"rule_id": "SAFE14", "trigger_signals": ["exercise_intolerance", "palpitations"], "condition_key": "ex_intol_and_palpitations_persist_ge_2_weeks", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "discuss cardiovascular symptoms with clinician"},
    {"rule_id": "SAFE15", "trigger_signals": ["irregular_cycles", "acne", "hair_loss"], "condition_key": "irregular_cycle_acne_hairloss_ge_3_cycles", "message_type": "clinical awareness", "priority": "medium", "escalation_suggestion": "clinician may assess hormonal balance"},
    {"rule_id": "SAFE16", "trigger_signals": ["low_mood", "insomnia"], "condition_key": "low_mood_and_insomnia_ge_4_weeks", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "consider mental health consultation with clinician"},
    {"rule_id": "SAFE17", "trigger_signals": ["night_sweats_menopause"], "condition_key": "menopause_night_sweats_sev_ge_4", "message_type": "informational", "priority": "low", "escalation_suggestion": "educational context about menopausal transition"},
    {"rule_id": "SAFE18", "trigger_signals": ["postpartum_fatigue"], "condition_key": "postpartum_under_6_months", "message_type": "informational", "priority": "low", "escalation_suggestion": "educational context for postpartum recovery"},
    {"rule_id": "SAFE19", "trigger_signals": ["new_hormonal_contraception_use"], "condition_key": "start_or_stop_hormonal_contraception_past_6_months", "message_type": "informational", "priority": "low", "escalation_suggestion": "cycle variability may occur during hormonal adjustment"},
    {"rule_id": "SAFE20", "trigger_signals": ["GLP1_medication_use"], "condition_key": "glp1_medication_reported", "message_type": "informational", "priority": "low", "escalation_suggestion": "metabolic patterns may be influenced by medication"},
    {"rule_id": "SAFE21", "trigger_signals": ["thyroid_medication_use"], "condition_key": "thyroid_medication_reported", "message_type": "informational", "priority": "low", "escalation_suggestion": "thyroid-related patterns should be interpreted with clinician guidance"},
    {"rule_id": "SAFE22", "trigger_signals": ["rapid_weight_gain"], "condition_key": "weight_gain_ge_5_percent_3mo", "message_type": "suggest clinician discussion", "priority": "medium", "escalation_suggestion": "consider discussing weight changes with healthcare provider"},
]

SAFETY_CLUSTER_OVERRIDES: Dict[str, List[str]] = {
    "SAFE02": ["CL_IRON_PATTERN"],
    "SAFE06": ["CL_STRESS_ACCUM"],
    "SAFE11": ["CL_INFLAM_LOAD"],
    "SAFE12": ["CL_GUT_PATTERN"],
    "SAFE13": ["CL_GUT_PATTERN"],
}


def gather_cluster_overrides(triggered_rule_ids: List[str]) -> List[str]:
    """Union all cluster overrides for triggered rules; deduplicate, stable order."""
    seen: set = set()
    out: List[str] = []
    for rid in triggered_rule_ids:
        for cid in SAFETY_CLUSTER_OVERRIDES.get(rid, []):
            if cid not in seen:
                seen.add(cid)
                out.append(cid)
    return out


def build_safety_meta(safety_prompts: List[SafetyPrompt]) -> Dict[str, Any]:
    """Build full safety_meta from triggered prompts (override metadata, caps, lens softening)."""
    triggered_ids = [p.safety_rule_id for p in safety_prompts]
    high_count = sum(1 for p in safety_prompts if p.priority == "high")
    urgent_attention = any(p.message_type == "urgent attention" for p in safety_prompts)
    priorities_seen = {p.priority for p in safety_prompts}
    highest: Optional[str] = None
    if "high" in priorities_seen:
        highest = "high"
    elif "medium" in priorities_seen:
        highest = "medium"
    elif "low" in priorities_seen:
        highest = "low"

    any_triggered = len(safety_prompts) > 0
    return {
        "triggered_rule_ids": triggered_ids,
        "highest_priority": highest,
        "urgent_attention_triggered": urgent_attention,
        "high_priority_count": high_count,
        "show_urgent_medical_guidance": high_count >= 2,
        "pattern_confidence_cap": 60 if any_triggered else None,
        "override_normal_pattern_explanation": urgent_attention,
        "soften_explanations": any_triggered,
        "lens_softened": any_triggered,
        "cluster_overrides": gather_cluster_overrides(triggered_ids),
    }


def build_signal_map(signal_scores: Any) -> Dict[str, float]:
    """Build symptom_id -> score map from list of SignalScore."""
    out: Dict[str, float] = {}
    for row in signal_scores or []:
        sid = getattr(row, "symptom_id", None)
        if sid:
            out[sid] = float(getattr(row, "score", 0) or 0)
    return out


def get_symptom_duration_days(normalized_survey: Any, symptom_id: str) -> Optional[int]:
    """Return duration_days for the given symptom from survey symptom_inputs; None if missing."""
    survey = normalized_survey
    if not survey:
        return None
    inputs = getattr(survey, "symptom_inputs", None) or []
    for inp in inputs:
        if getattr(inp, "symptom_id", None) == symptom_id:
            d = getattr(inp, "duration_days", None)
            if d is not None:
                try:
                    return int(d)
                except (TypeError, ValueError):
                    pass
            return None
    return None


def _raw(survey: Any, key: str, default: Any = None) -> Any:
    if not survey:
        return default
    raw = getattr(survey, "raw_fields", None) or {}
    return raw.get(key, default)


def safety_condition_passes(
    condition_key: str,
    normalized_survey: Any,
    signal_map: Dict[str, float],
    derived_flags: Dict[str, Any],
    clusters: Any = None,
) -> bool:
    """Evaluate a single condition key. Uses raw survey fields and signal scores."""
    survey = normalized_survey
    flags = derived_flags or {}

    def sig(symptom_id: str) -> float:
        return float(signal_map.get(symptom_id, 0.0))

    def dur(symptom_id: str) -> Optional[int]:
        return get_symptom_duration_days(survey, symptom_id)

    # missed_period_ge_3_months
    if condition_key == "missed_period_ge_3_months":
        if survey and getattr(survey, "missed_period_3mo", None) == "yes":
            return True
        return sig("SYM_MISSED_PERIOD") >= 40

    # heavy_bleeding_and_dizziness_same_cycle
    if condition_key == "heavy_bleeding_and_dizziness_same_cycle":
        return sig("SYM_HEAVY_BLEED") >= 50 and sig("SYM_DIZZINESS") >= 40

    # bleeding_duration_ge_10_days
    if condition_key == "bleeding_duration_ge_10_days":
        period_len = _raw(survey, "period_length_days")
        if period_len is not None:
            try:
                return int(period_len) >= 10
            except (TypeError, ValueError):
                pass
        return False

    # very_heavy_flow_ge_2_cycles
    if condition_key == "very_heavy_flow_ge_2_cycles":
        return survey and getattr(survey, "period_heaviness", None) == "very_heavy"

    # weight_loss_ge_5_percent_3mo
    if condition_key == "weight_loss_ge_5_percent_3mo":
        if survey and getattr(survey, "weight_change_3mo", None) == "loss_gt_5kg":
            return True
        pct = _raw(survey, "weight_loss_percent_3mo")
        if pct is not None:
            try:
                return float(pct) >= 5
            except (TypeError, ValueError):
                pass
        return False

    # palpitations_and_dizziness_sev_ge_3
    if condition_key == "palpitations_and_dizziness_sev_ge_3":
        return sig("SYM_PALPITATIONS") >= 60 and sig("SYM_DIZZINESS") >= 60

    # palpitations_and_ex_intol_moderate
    if condition_key == "palpitations_and_ex_intol_moderate":
        return sig("SYM_PALPITATIONS") >= 40 and sig("SYM_EX_INTOL") >= 40

    # fatigue_sev_ge_4_for_ge_8_weeks
    if condition_key == "fatigue_sev_ge_4_for_ge_8_weeks":
        if sig("SYM_FATIGUE") < 60:
            return False
        fd = dur("SYM_FATIGUE")
        if fd is not None:
            return fd >= 56
        return False

    # two_of_fatigue_hairloss_dizziness_persist_ge_4_weeks
    if condition_key == "two_of_fatigue_hairloss_dizziness_persist_ge_4_weeks":
        count = 0
        if sig("SYM_FATIGUE") >= 40:
            count += 1
        if sig("SYM_HAIR_LOSS") >= 40:
            count += 1
        if sig("SYM_DIZZINESS") >= 40:
            count += 1
        if count < 2:
            return False
        max_dur = None
        for sid in ("SYM_FATIGUE", "SYM_HAIR_LOSS", "SYM_DIZZINESS"):
            d = dur(sid)
            if d is not None and (max_dur is None or d > max_dur):
                max_dur = d
        if max_dur is not None:
            return max_dur >= 28
        return True

    # cold_fatigue_dryskin_persist_ge_6_weeks
    if condition_key == "cold_fatigue_dryskin_persist_ge_6_weeks":
        if sig("SYM_COLD_INTOL") < 50 or sig("SYM_FATIGUE") < 50 or sig("SYM_DRY_SKIN") < 45:
            return False
        for sid in ("SYM_COLD_INTOL", "SYM_FATIGUE", "SYM_DRY_SKIN"):
            d = dur(sid)
            if d is not None and d >= 42:
                return True
        return False

    # night_sweats_and_weight_loss_persist_ge_4_weeks
    if condition_key == "night_sweats_and_weight_loss_persist_ge_4_weeks":
        if sig("SYM_NIGHT_SWEATS") < 50:
            return False
        return safety_condition_passes("weight_loss_ge_5_percent_3mo", survey, signal_map, flags, clusters)

    # diarrhea_ge_7_days
    if condition_key == "diarrhea_ge_7_days":
        if sig("SYM_DIARRHEA") < 50:
            return False
        d = dur("SYM_DIARRHEA")
        if d is not None:
            return d >= 7
        return sig("SYM_DIARRHEA") >= 70

    # no_bowel_movement_ge_7_days
    if condition_key == "no_bowel_movement_ge_7_days":
        days = _raw(survey, "days_since_bowel_movement")
        if days is not None:
            try:
                return int(days) >= 7
            except (TypeError, ValueError):
                pass
        return sig("SYM_CONSTIP") >= 80

    # ex_intol_and_palpitations_persist_ge_2_weeks
    if condition_key == "ex_intol_and_palpitations_persist_ge_2_weeks":
        if sig("SYM_EX_INTOL") < 45 or sig("SYM_PALPITATIONS") < 45:
            return False
        d1, d2 = dur("SYM_EX_INTOL"), dur("SYM_PALPITATIONS")
        if d1 is not None and d1 >= 14:
            return True
        if d2 is not None and d2 >= 14:
            return True
        return True

    # irregular_cycle_acne_hairloss_ge_3_cycles
    if condition_key == "irregular_cycle_acne_hairloss_ge_3_cycles":
        return sig("SYM_IRREG_CYCLE") >= 50 and sig("SYM_ACNE") >= 45 and sig("SYM_HAIR_LOSS") >= 40

    # low_mood_and_insomnia_ge_4_weeks
    if condition_key == "low_mood_and_insomnia_ge_4_weeks":
        if sig("SYM_LOW_MOOD") < 45 or sig("SYM_INSOMNIA") < 45:
            return False
        d1, d2 = dur("SYM_LOW_MOOD"), dur("SYM_INSOMNIA")
        if d1 is not None and d1 >= 28:
            return True
        if d2 is not None and d2 >= 28:
            return True
        return True

    # menopause_night_sweats_sev_ge_4
    if condition_key == "menopause_night_sweats_sev_ge_4":
        life_stage = getattr(survey, "life_stage", None) if survey else None
        if life_stage not in ("LS_MENO", "LS_POSTMENO", "LS_SURG_MENO"):
            return False
        return sig("SYM_NIGHT_SWEATS") >= 80

    # postpartum_under_6_months
    if condition_key == "postpartum_under_6_months":
        life_stage = getattr(survey, "life_stage", None) if survey else None
        if life_stage != "LS_POSTPARTUM":
            return False
        months = _raw(survey, "postpartum_months")
        if months is not None:
            try:
                return float(months) < 6
            except (TypeError, ValueError):
                pass
        return True

    # start_or_stop_hormonal_contraception_past_6_months
    if condition_key == "start_or_stop_hormonal_contraception_past_6_months":
        if _raw(survey, "contraception_recent_change") is True:
            return True
        if survey and getattr(survey, "life_stage", None) == "LS_POST_HC":
            return True
        return _raw(survey, "hormonal_contraception_change_past_6_months") is not None

    # glp1_medication_reported
    if condition_key == "glp1_medication_reported":
        mod = getattr(survey, "modifier_flags", None) or {} if survey else {}
        return mod.get("glp1_medication_use") is True

    # thyroid_medication_reported
    if condition_key == "thyroid_medication_reported":
        mod = getattr(survey, "modifier_flags", None) or {} if survey else {}
        return mod.get("thyroid_medication_use") is True

    # weight_gain_ge_5_percent_3mo
    if condition_key == "weight_gain_ge_5_percent_3mo":
        if survey and getattr(survey, "weight_change_3mo", None) == "gain_gt_5kg":
            return True
        pct = _raw(survey, "weight_gain_percent_3mo")
        if pct is not None:
            try:
                return float(pct) >= 5
            except (TypeError, ValueError):
                pass
        return False

    return False


def priority_rank(priority: str) -> int:
    """low=1, medium=2, high=3."""
    if priority == "high":
        return 3
    if priority == "medium":
        return 2
    if priority == "low":
        return 1
    return 0


def evaluate_safety(
    normalized_survey: Any,
    signal_scores: Any,
    clusters: Any,
    root_patterns: Any,
    registry: Any,
    config: Any,
    derived_flags: Optional[Dict[str, Any]] = None,
    lens_result: Any = None,
) -> Tuple[List[SafetyPrompt], Dict[str, Any]]:
    """
    Evaluate all safety rules; return (safety_prompts, safety_meta).
    Does not mutate root patterns or lens (Task 9.2).
    """
    signal_map = build_signal_map(signal_scores)
    flags = derived_flags or {}

    triggered: List[Dict[str, Any]] = []
    for rule in SAFETY_RULES:
        ck = rule.get("condition_key")
        if not ck:
            continue
        if safety_condition_passes(ck, normalized_survey, signal_map, flags, clusters):
            triggered.append(rule)

    prompts = []
    for r in triggered:
        cluster_override = list(SAFETY_CLUSTER_OVERRIDES.get(r["rule_id"], []))
        prompts.append(
            SafetyPrompt(
                safety_rule_id=r["rule_id"],
                priority=r["priority"],
                message_type=r["message_type"],
                trigger_signals=list(r.get("trigger_signals", [])),
                escalation=r.get("escalation_suggestion"),
                cluster_override=cluster_override,
                reasoning_trace_id=None,
            )
        )

    prompts.sort(key=lambda p: (-priority_rank(p.priority), p.safety_rule_id))
    safety_meta = build_safety_meta(prompts)
    return prompts, safety_meta


def apply_safety_caps_to_patterns(
    root_patterns: Any,
    safety_meta: Dict[str, Any],
) -> None:
    """Optional: cap all root pattern confidences to pattern_confidence_cap in-place."""
    cap = safety_meta.get("pattern_confidence_cap")
    if cap is None:
        return
    for rp in root_patterns or []:
        if hasattr(rp, "confidence") and getattr(rp, "confidence") is not None:
            current = float(getattr(rp, "confidence", 0) or 0)
            if current > cap:
                setattr(rp, "confidence", min(current, float(cap)))

"""
Root pattern card translator: pattern -> clinically safe interpretation card (RootPatternCardVM).

Uses the root pattern explanation library only. Title/short_label from dictionary;
summary, expanded_explanation, evidence_label, caution_note from table; confidence
from confidence mapping. Educational and non-diagnostic; no rewriting into stronger
medical claims.
"""

from __future__ import annotations

from typing import Any

from client_output.contracts import RootPatternCardVM
from client_output.confidence import map_confidence_optional
from client_output.display_resolver import resolve_pattern


# ---------------------------------------------------------------------------
# Root pattern explanation library (explanation_short, explanation_long, evidence_label, caution_note)
# All fields required; wording is educational and non-diagnostic.
# ---------------------------------------------------------------------------

ROOT_PATTERN_EXPLANATIONS: dict[str, dict[str, str]] = {
    "RP_STRESS_LOAD": {
        "explanation_short": "Signals consistent with elevated stress load",
        "explanation_long": "Stress, sleep disruption, and fatigue clustering may reflect sustained demands or limited recovery.",
        "evidence_label": "High evidence",
        "caution_note": "Educational only; persistent symptoms may be worth discussing with a clinician.",
    },
    "RP_BLOOD_SUGAR": {
        "explanation_short": "Signals linked to blood sugar variability",
        "explanation_long": "Patterns in energy and meal timing may relate to blood sugar variability; context can help clarify.",
        "evidence_label": "High evidence",
        "caution_note": "These signals are educational only; clinical evaluation and testing may be needed for clarity.",
    },
    "RP_IRON_DEPLETION": {
        "explanation_short": "Signals consistent with reduced iron reserves",
        "explanation_long": "Fatigue and related signals sometimes align with iron reserve patterns; only laboratory testing can determine iron status.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Only laboratory testing can determine iron status.",
    },
    "RP_THYROID_SLOWING": {
        "explanation_short": "Signals that may relate to thyroid regulation context",
        "explanation_long": "Energy and metabolism signals can sometimes reflect thyroid-related context; clinical evaluation and lab testing can provide clarity.",
        "evidence_label": "Moderate evidence",
        "caution_note": "These signals alone do not diagnose thyroid conditions; clinical evaluation and lab testing are required.",
    },
    "RP_PROG_LOW": {
        "explanation_short": "Signals consistent with progesterone signal pattern",
        "explanation_long": "Cycle-related signals may sometimes reflect progesterone patterns; context and timing can help clarify.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; discuss persistent or disruptive symptoms with a clinician.",
    },
    "RP_ESTRO_DOM": {
        "explanation_short": "Signals consistent with estrogen signal pattern",
        "explanation_long": "Cycle and symptom patterns may sometimes align with estrogen-related signals; clinical context is important.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; persistent symptoms may be worth discussing with a clinician.",
    },
    "RP_ANDRO_EXCESS": {
        "explanation_short": "Signals that may relate to androgen pattern context",
        "explanation_long": "Some signals can align with androgen-related patterns; clinical evaluation can provide clarity.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; discuss persistent symptoms with a clinician.",
    },
    "RP_MICRO_DEPLETION": {
        "explanation_short": "Signals consistent with nutrient reserve pattern",
        "explanation_long": "Fatigue and vitality signals may sometimes reflect nutrient reserve context; diet and testing can clarify.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; lab testing can help assess nutrient status.",
    },
    "RP_OVERTRAIN": {
        "explanation_short": "Signals consistent with recovery strain pattern",
        "explanation_long": "Training load and recovery signals may reflect strain; rest and pacing often help clarify.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; persistent fatigue may be worth discussing with a clinician.",
    },
    "RP_SLEEP_DEPRIVATION": {
        "explanation_short": "Signals linked to sleep deprivation pattern",
        "explanation_long": "Sleep and energy signals often align with sleep deprivation context; improving sleep may help.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; persistent sleep issues may be worth discussing with a clinician.",
    },
    "RP_GUT_DYSBIOSIS": {
        "explanation_short": "Signals that may relate to gut balance pattern",
        "explanation_long": "Digestion and gut-related signals can sometimes reflect balance context; diet and context can clarify.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; persistent gut symptoms may be worth discussing with a clinician.",
    },
    "RP_NERVOUS_DYS": {
        "explanation_short": "Signals that may relate to nervous system pattern",
        "explanation_long": "Stress and recovery signals can sometimes align with nervous system context; relaxation and support may help.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; persistent symptoms may be worth discussing with a clinician.",
    },
    "RP_INFLAM_CTX": {
        "explanation_short": "Signals consistent with inflammation context pattern",
        "explanation_long": "Some signals may relate to inflammation context; lifestyle and clinical evaluation can clarify.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; clinical evaluation may be needed for persistent symptoms.",
    },
    "RP_VASOMOTOR_CTX": {
        "explanation_short": "Signals linked to vasomotor transition context",
        "explanation_long": "Temperature and transition-related signals may reflect vasomotor context; life stage can be relevant.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Educational only; persistent or disruptive symptoms may be worth discussing with a clinician.",
    },
    "RP_PERI_TRANSITION": {
        "explanation_short": "Signals consistent with perimenopause transition pattern",
        "explanation_long": "Cycle and symptom patterns may reflect perimenopause transition context; life stage is important.",
        "evidence_label": "Moderate evidence",
        "caution_note": "Life stage context is important; persistent or disruptive symptoms may be worth discussing with a clinician.",
    },
}


class RootPatternConfigError(LookupError):
    """Raised when a pattern_id has no entry in the explanation library."""

    def __init__(self, pattern_id: str) -> None:
        self.pattern_id = pattern_id
        super().__init__(f"Root pattern card: no explanation for pattern {pattern_id!r}")


def build_root_pattern_card(pattern: dict[str, Any]) -> RootPatternCardVM:
    """
    Build a RootPatternCardVM from raw pattern data.

    - title, short_label from display dictionary (resolve_pattern).
    - summary from explanation_short, expanded_explanation from explanation_long.
    - evidence_label and caution_note from the explanation table.
    - confidence_label and confidence_text from confidence mapping.
    - Never rewrites explanations into stronger medical claims; card is educational and non-diagnostic.
    """
    pattern_id = pattern.get("pattern_id") or pattern.get("id")
    if not pattern_id:
        raise RootPatternConfigError("<missing>")
    pattern_id = str(pattern_id).strip()

    if pattern_id not in ROOT_PATTERN_EXPLANATIONS:
        raise RootPatternConfigError(pattern_id)

    resolved = resolve_pattern(pattern_id)
    title = resolved["display_title"]
    short_label = resolved["short_label"]

    expl = ROOT_PATTERN_EXPLANATIONS[pattern_id]
    summary = expl["explanation_short"]
    expanded_explanation = expl["explanation_long"]
    evidence_label = expl["evidence_label"]
    caution_note = expl["caution_note"]

    band = map_confidence_optional(pattern.get("confidence"))

    return RootPatternCardVM(
        title=title,
        short_label=short_label,
        summary=summary,
        expanded_explanation=expanded_explanation,
        confidence_label=band.confidence_label,
        confidence_text=band.confidence_text,
        evidence_label=evidence_label,
        caution_note=caution_note,
    )

"""
JSON output enforcement for LLM responses: parse, validate with ArticleExtractionSchema,
optional retry with correction prompt, log and skip on failure.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Callable

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ArticleExtractionSchema(BaseModel):
    """Expected schema for article extraction LLM output (for DB insertion)."""

    summary: str = Field(default="", description="Article summary")
    key_findings: list[str] = Field(default_factory=list, description="Key findings")
    biological_systems: list[str] = Field(default_factory=list, description="Biological systems")
    symptoms: list[str] = Field(default_factory=list, description="Symptoms")
    biomarkers: list[str] = Field(default_factory=list, description="Biomarkers")
    root_causes: list[str] = Field(default_factory=list, description="Root causes")
    preventive_topics: list[str] = Field(default_factory=list, description="Preventive topics")
    intervention_types: list[str] = Field(default_factory=list, description="Intervention types")
    life_stages: list[str] = Field(default_factory=list, description="Life stages")
    evidence_level: str = Field(default="", description="Evidence level")


CORRECTION_PROMPT_TEMPLATE = """Your previous response was invalid for the following reason:
{error}

Original instruction: respond with a single valid JSON object only.

Required JSON keys (all strings or arrays of strings): summary, key_findings, biological_systems, symptoms, biomarkers, root_causes, preventive_topics, intervention_types, life_stages, evidence_level.

Provide the corrected JSON object only, no other text or markdown."""


def _parse_json(text: str) -> dict[str, Any] | None:
    """Extract a single JSON object from response text. Returns None if not a dict."""
    if not text or not text.strip():
        return None
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    for start, end in (("{", "}"),):
        i = text.find(start)
        if i == -1:
            continue
        depth = 0
        for j in range(i, len(text)):
            if text[j] == start:
                depth += 1
            elif text[j] == end:
                depth -= 1
                if depth == 0:
                    try:
                        parsed = json.loads(text[i : j + 1])
                    except json.JSONDecodeError:
                        return None
                    return parsed if isinstance(parsed, dict) else None
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def validate_llm_output(
    response: str,
    *,
    retry_with_correction: Callable[[str], str] | None = None,
) -> ArticleExtractionSchema | None:
    """
    Validate LLM response as JSON and against ArticleExtractionSchema.

    Steps:
      1. Attempt JSON parsing.
      2. If invalid or schema validation fails and retry_with_correction is provided,
         call it with a correction prompt and validate again.
      3. If still invalid, log error and return None (skip article).

    Args:
        response: Raw LLM response text.
        retry_with_correction: Optional callable that takes a correction prompt and
            returns a new LLM response string (e.g. lambda p: generate_completion(p)).

    Returns:
        Validated ArticleExtractionSchema instance, or None on failure.
    """
    error_msg: str | None = None

    for attempt in range(2):
        if attempt == 1 and retry_with_correction is not None and error_msg:
            logger.warning("Retrying LLM with correction prompt: %s", error_msg[:200])
            try:
                new_response = retry_with_correction(
                    CORRECTION_PROMPT_TEMPLATE.format(error=error_msg)
                )
                if isinstance(new_response, dict):
                    response = json.dumps(new_response)
                else:
                    response = str(new_response)
            except Exception as e:
                logger.exception("Correction retry failed: %s", e)
                return None
            error_msg = None

        parsed = _parse_json(response)
        if parsed is None:
            error_msg = "Response is not valid JSON or not a JSON object."
            logger.warning("validate_llm_output: %s", error_msg)
            if attempt == 1 or retry_with_correction is None:
                logger.error("Skipping article: invalid LLM output (not JSON).")
                return None
            continue

        try:
            return ArticleExtractionSchema.model_validate(parsed)
        except Exception as e:
            error_msg = str(e)
            logger.warning("validate_llm_output: schema validation failed: %s", error_msg)
            if attempt == 1 or retry_with_correction is None:
                logger.error("Skipping article: LLM output failed schema validation: %s", e)
                return None

    return None

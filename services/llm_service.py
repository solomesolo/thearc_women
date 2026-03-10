"""
LLM service: send prompts, receive responses, enforce JSON output,
with retries, rate-limit handling, and error logging.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any

# Load .env then .env.local from project root (.env.local overrides)
_project_root = Path(__file__).resolve().parent.parent
try:
    from dotenv import load_dotenv
    if (_project_root / ".env").exists():
        load_dotenv(_project_root / ".env")
    if (_project_root / ".env.local").exists():
        load_dotenv(_project_root / ".env.local", override=True)
except ImportError:
    pass

logger = logging.getLogger(__name__)

# Defaults; override via env or arguments
# Task 11: max_retries=3, exponential backoff; read from config if available
try:
    from config.llm_config import RETRY_ATTEMPTS
    MAX_RETRIES = RETRY_ATTEMPTS
except ImportError:
    MAX_RETRIES = int(os.environ.get("LLM_MAX_RETRIES", "3"))
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
DEFAULT_TEMPERATURE = float(os.environ.get("LLM_TEMPERATURE", "0.2"))
DEFAULT_MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "4096"))
INITIAL_BACKOFF_SEC = float(os.environ.get("LLM_BACKOFF_INITIAL", "1.0"))


def _get_client():
    """Lazy import to avoid requiring openai when not used."""
    try:
        from openai import OpenAI
    except ImportError:
        raise ImportError(
            "Install the openai package: pip install openai"
        ) from None
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")  # optional, e.g. Azure or local
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    return OpenAI(api_key=api_key, base_url=base_url or None)


def _extract_json(text: str) -> dict[str, Any]:
    """Extract a single JSON object from text (handles markdown code blocks). Returns a dict."""
    text = text.strip()
    # Strip optional markdown code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    # Find first { ... } or [ ... ]
    for start, end in (("{", "}"), ("[", "]")):
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
                    parsed = json.loads(text[i : j + 1])
                    if isinstance(parsed, list):
                        return {"result": parsed}
                    return parsed
    parsed = json.loads(text)
    return {"result": parsed} if isinstance(parsed, list) else parsed


def generate_completion(
    prompt: str,
    *,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> dict[str, Any]:
    """
    Send a prompt to the LLM and return the response as a parsed JSON dict.

    Input:
        prompt: The user/system prompt (will be wrapped to request JSON output).
        model: Model name (default: env LLM_MODEL or "gpt-4o-mini").
        temperature: Sampling temperature (default: env LLM_TEMPERATURE or 0.2).
        max_tokens: Max tokens to generate (default: env LLM_MAX_TOKENS or 4096).

    Output:
        parsed_json_response: The assistant reply parsed as a JSON object (dict).

    Raises:
        ValueError: If OPENAI_API_KEY is missing or response is not valid JSON.
        openai.APIError: On non-retryable API errors after retries.
    """
    model = model or DEFAULT_MODEL
    temperature = temperature if temperature is not None else DEFAULT_TEMPERATURE
    max_tokens = max_tokens if max_tokens is not None else DEFAULT_MAX_TOKENS

    json_instruction = (
        "Respond with a single valid JSON object only, no other text or markdown."
    )
    if "json" not in prompt.lower() and "JSON" not in prompt:
        prompt = f"{prompt}\n\n{json_instruction}"

    client = _get_client()
    backoff = INITIAL_BACKOFF_SEC

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            break
        except Exception as e:
            status = getattr(e, "status_code", None) or getattr(
                getattr(e, "response", None), "status_code", None
            )
            is_retryable = status in (429, 500, 502, 503) or "rate" in str(e).lower()
            if is_retryable and attempt < MAX_RETRIES - 1:
                logger.warning(
                    "LLM request failed (attempt %s/%s), retrying in %.1fs: %s",
                    attempt + 1,
                    MAX_RETRIES,
                    backoff,
                    e,
                )
                time.sleep(backoff)
                backoff = min(backoff * 2, 60.0)
            else:
                logger.exception("LLM request failed: %s", e)
                raise

    choice = (response.choices or [None])[0] if response else None
    content = getattr(getattr(choice, "message", None), "content", None) if choice else None
    if not content or not content.strip():
        logger.error("LLM returned empty content")
        raise ValueError("LLM returned empty content")

    try:
        return _extract_json(content)
    except json.JSONDecodeError as e:
        logger.exception("LLM response is not valid JSON: %s", content[:500])
        raise ValueError(f"LLM response is not valid JSON: {e}") from e

"""
LLM provider connection configuration.
All settings can be overridden via environment variables.
API key is read only from the environment (never hardcoded).
"""

from __future__ import annotations

import os
from pathlib import Path

# Load .env and .env.local from project root so env vars are available
_config_root = Path(__file__).resolve().parent.parent
try:
    from dotenv import load_dotenv
    if (_config_root / ".env").exists():
        load_dotenv(_config_root / ".env")
    if (_config_root / ".env.local").exists():
        load_dotenv(_config_root / ".env.local", override=True)
except ImportError:
    pass

# Provider identifier (e.g. "openai", "azure")
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai")

# API key — from environment only
API_KEY = os.environ.get("OPENAI_API_KEY") or os.environ.get("LLM_API_KEY") or ""

# Model and generation
MODEL_NAME = os.environ.get("LLM_MODEL", os.environ.get("MODEL_NAME", "gpt-4o"))
TEMPERATURE = float(os.environ.get("LLM_TEMPERATURE", os.environ.get("TEMPERATURE", "0.2")))
MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", os.environ.get("MAX_TOKENS", "2000")))

# Request timeout in seconds
TIMEOUT = int(os.environ.get("LLM_TIMEOUT", os.environ.get("TIMEOUT", "60")))

# Number of retries on retryable errors (e.g. rate limit, 5xx, timeout, malformed)
RETRY_ATTEMPTS = int(os.environ.get("LLM_MAX_RETRIES", os.environ.get("RETRY_ATTEMPTS", "3")))

# Optional: override API base URL (e.g. for Azure or custom endpoint)
BASE_URL = os.environ.get("OPENAI_BASE_URL") or os.environ.get("LLM_BASE_URL") or None

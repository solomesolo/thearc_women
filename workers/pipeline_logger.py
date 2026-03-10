"""Log pipeline events to pipeline_logs table (Task 22)."""
from __future__ import annotations

import json
import logging
from typing import Any

from workers.db import get_conn, uuid4_str

logger = logging.getLogger(__name__)

EVENT_SCRAPE_ERROR = "scrape_error"
EVENT_LLM_FAILURE = "llm_failure"
EVENT_JSON_PARSE_ERROR = "json_parse_error"
EVENT_DUPLICATE_ARTICLE = "duplicate_article"
EVENT_LABEL_MAPPING_FAILURE = "label_mapping_failure"


def log_event(event: str, message: str | None = None, payload: dict[str, Any] | None = None) -> None:
    """Insert one row into pipeline_logs."""
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO pipeline_logs (id, event, message, payload)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (uuid4_str(), event, message, json.dumps(payload) if payload else None),
                )
    except Exception as e:
        logger.exception("Failed to write pipeline_log: %s", e)

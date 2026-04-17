"""
Seed script: create llm_prompts table and insert the three article-generation prompts.
Run from project root: python scripts/seed_llm_prompts.py
"""
from __future__ import annotations

import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from workers.db import get_conn

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS llm_prompts (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    key         TEXT        NOT NULL,
    name        TEXT        NOT NULL,
    description TEXT,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT llm_prompts_pkey PRIMARY KEY (id),
    CONSTRAINT llm_prompts_key_unique UNIQUE (key)
);
"""

PROMPTS: list[dict] = [
    {
        "key": "article_extraction",
        "name": "Article Extraction",
        "description": (
            "Step 1 of the article pipeline. Reads raw PubMed research "
            "(title, abstract, full text) and extracts structured biomedical fields "
            "(summary, key_findings, biological_systems, symptoms, biomarkers, "
            "root_causes, evidence_level, etc.) as JSON."
        ),
        "content": (Path(_root) / "prompts" / "article_extraction_prompt.txt").read_text(),
    },
    {
        "key": "blog_article_from_research",
        "name": "Blog Article from Research",
        "description": (
            "Step 2 of the article pipeline. Takes the structured extraction output "
            "and generates a full 7-section blog article (Context → Implementation considerations) "
            "with title, excerpt, evidenceLevel, category, tags, sources, and section bodies "
            "as a single JSON object ready for DB insert."
        ),
        "content": (Path(_root) / "prompts" / "blog_article_from_research_prompt.txt").read_text(),
    },
    {
        "key": "action_protocol_and_tracking",
        "name": "Action Protocol and Tracking Framework",
        "description": (
            "Step 3 of the article pipeline. Takes the article title, summary and key findings "
            "and generates sections 8 (Action Protocol) and 9 (Tracking Framework) — "
            "structured, educational, non-diagnostic guidance for members."
        ),
        "content": (Path(_root) / "prompts" / "action_protocol_and_tracking_prompt.txt").read_text(),
    },
]

UPSERT = """
INSERT INTO llm_prompts (key, name, description, content, updated_at)
VALUES (%s, %s, %s, %s, NOW())
ON CONFLICT (key) DO UPDATE
    SET name        = EXCLUDED.name,
        description = EXCLUDED.description,
        content     = EXCLUDED.content,
        updated_at  = NOW();
"""


def main() -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(CREATE_TABLE)
            print("Table llm_prompts: ready.")

            for p in PROMPTS:
                cur.execute(UPSERT, (p["key"], p["name"], p["description"], p["content"]))
                print(f"  Upserted: {p['key']}")

        conn.commit()

    print("\nDone. All prompts are in Supabase.")


if __name__ == "__main__":
    main()

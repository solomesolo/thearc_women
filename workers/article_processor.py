"""
Article processing worker (Tasks 12–17).
Queries raw_medical_articles WHERE processed = false LIMIT 10,
runs LLM extraction → knowledge_articles, second LLM → knowledge_content,
assigns labels, marks processed.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

# Project root on path for services, config, prompts
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from workers.db import get_conn, uuid4_str
from workers.pipeline_logger import (
    log_event,
    EVENT_LLM_FAILURE,
    EVENT_JSON_PARSE_ERROR,
    EVENT_DUPLICATE_ARTICLE,
)
from workers.medical_filter import apply_medical_filter
from workers.label_mapper import assign_labels_for_article

logger = logging.getLogger(__name__)

PROMPTS_DIR = _root / "prompts"
EXTRACTION_PROMPT_PATH = PROMPTS_DIR / "article_extraction_prompt.txt"
KNOWLEDGE_PROMPT_PATH = PROMPTS_DIR / "knowledge_generation_prompt.txt"


def _load_prompt(path: Path, fallback: str = "", **kwargs: str) -> str:
    text = path.read_text() if path.exists() else fallback
    for k, v in kwargs.items():
        text = text.replace("{{" + k + "}}", v or "")
    return text


def process_unprocessed_articles(limit: int = 10) -> int:
    """
    Query raw_medical_articles WHERE processed = false LIMIT 10, process each:
    LLM extraction → knowledge_articles; second LLM → knowledge_content; labels; mark processed.
    Returns number processed successfully.
    """
    from services.llm_service import generate_completion
    from services.llm_validation import validate_llm_output, ArticleExtractionSchema

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, source, "sourceUrl", title, authors, journal, "publicationDate",
                       abstract, "fullText", keywords, doi
                FROM raw_medical_articles
                WHERE processed = false
                ORDER BY "scrapedAt" ASC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
            colnames = [d[0] for d in cur.description]
            articles = [dict(zip(colnames, row)) for row in rows]

    processed_count = 0
    for raw in articles:
        raw_id = raw["id"]
        title = raw["title"] or ""
        abstract = (raw["abstract"] or "")[:12000]
        full_text = (raw["fullText"] or "")[:8000]
        journal = raw["journal"] or ""

        # --- Task 13: LLM extraction ---
        extraction_template = EXTRACTION_PROMPT_PATH.read_text() if EXTRACTION_PROMPT_PATH.exists() else ""
        prompt = _load_prompt(
            EXTRACTION_PROMPT_PATH,
            fallback=extraction_template,
            title=title,
            abstract=abstract,
            full_text=full_text or "(not available)",
            journal=journal,
        )
        try:
            response = generate_completion(prompt)
            if isinstance(response, dict):
                response_str = json.dumps(response)
            else:
                response_str = str(response)
        except Exception as e:
            log_event(EVENT_LLM_FAILURE, str(e), {"raw_article_id": raw_id, "stage": "extraction"})
            logger.exception("LLM extraction failed for %s", raw_id)
            continue

        validated = validate_llm_output(
            response_str,
            retry_with_correction=lambda p: generate_completion(p),
        )
        if validated is None:
            log_event(EVENT_JSON_PARSE_ERROR, "Extraction output invalid", {"raw_article_id": raw_id})
            continue

        # Insert knowledge_articles (Task 13)
        ka_id = uuid4_str()
        try:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO knowledge_articles
                        (id, "rawArticleId", title, summary, "keyFindings", "biologicalSystems",
                         symptoms, biomarkers, "rootCauses", "preventiveTopics", "interventionTypes",
                         "lifeStages", "evidenceLevel")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            ka_id,
                            raw_id,
                            title,
                            validated.summary,
                            validated.key_findings,
                            validated.biological_systems,
                            validated.symptoms,
                            validated.biomarkers,
                            validated.root_causes,
                            validated.preventive_topics,
                            validated.intervention_types,
                            validated.life_stages,
                            validated.evidence_level or None,
                        ),
                    )
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                log_event(EVENT_DUPLICATE_ARTICLE, str(e), {"raw_article_id": raw_id})
            else:
                log_event(EVENT_LLM_FAILURE, str(e), {"raw_article_id": raw_id, "stage": "insert_knowledge_articles"})
            continue

        # --- Task 14: Second LLM → knowledge_content ---
        summary = validated.summary or ""
        key_findings_str = ", ".join(validated.key_findings[:10]) if validated.key_findings else ""
        biological_systems_str = ", ".join(validated.biological_systems[:10]) if validated.biological_systems else ""
        root_causes_str = ", ".join(validated.root_causes[:10]) if validated.root_causes else ""
        knowledge_template = KNOWLEDGE_PROMPT_PATH.read_text() if KNOWLEDGE_PROMPT_PATH.exists() else ""
        k_prompt = _load_prompt(
            KNOWLEDGE_PROMPT_PATH,
            fallback=knowledge_template,
            title=title,
            summary=summary,
            key_findings=key_findings_str,
            biological_systems=biological_systems_str,
            root_causes=root_causes_str,
        )
        try:
            k_response = generate_completion(k_prompt)
            if isinstance(k_response, dict):
                k_obj = k_response
            else:
                k_obj = json.loads(k_response)
        except Exception as e:
            log_event(EVENT_LLM_FAILURE, str(e), {"raw_article_id": raw_id, "stage": "knowledge_generation"})
            # Still mark processed; we have knowledge_article
        else:
            science = apply_medical_filter(k_obj.get("science_explained"))
            patterns = apply_medical_filter(k_obj.get("patterns_and_root_causes"))
            preventive = apply_medical_filter(k_obj.get("preventive_insights"))
            clinical = apply_medical_filter(k_obj.get("clinical_context"))
            kc_id = uuid4_str()
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO knowledge_content
                        (id, "articleId", "scienceExplained", "patternsAndRootCauses",
                         "preventiveInsights", "clinicalContext")
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (kc_id, ka_id, science or None, patterns or None, preventive or None, clinical or None),
                    )

        # --- Task 17: Assign labels ---
        try:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    assign_labels_for_article(
                        cur,
                        ka_id,
                        validated.symptoms,
                        validated.biomarkers,
                        validated.root_causes,
                        validated.life_stages,
                        validated.biological_systems,
                        uuid4_str,
                    )
        except Exception as e:
            log_event("label_mapping_failure", str(e), {"knowledge_article_id": ka_id})

        # --- Task 15: Mark processed ---
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE raw_medical_articles SET processed = true WHERE id = %s',
                    (raw_id,),
                )
        processed_count += 1
        logger.info("Processed raw_article %s -> knowledge_article %s", raw_id, ka_id)

    return processed_count


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    n = process_unprocessed_articles(limit=10)
    print(f"Processed {n} articles.")


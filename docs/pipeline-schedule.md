# Pipeline schedule (Task 21)

| Job | Schedule | How |
|-----|----------|-----|
| **Scraper** | Daily (or weekly) | GitHub Actions: `.github/workflows/scrape-weekly.yml` — runs `npm run scrape:pubmed` (or `scrape:pubmed:raw` for raw_medical_articles). Change cron to `0 2 * * *` for daily at 02:00 UTC. |
| **LLM processing + labels** | Hourly | GitHub Actions: `.github/workflows/process-articles-hourly.yml` — runs `workers/article_processor.py` (extraction → knowledge_articles → knowledge_content → article_labels → mark processed). |

For **Airflow / Prefect / Temporal**, add DAGs or workflows that call the same entrypoints:

- Scraper: `npm run scrape:pubmed:raw` (or the TS scraper).
- Processor: `PYTHONPATH=. python -m workers.article_processor`.

Secrets required: `DATABASE_URL`, `OPENAI_API_KEY`, optionally `OPENAI_BASE_URL`.

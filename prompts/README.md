# Prompt templates

Prompts are stored here so they can be updated without changing code.

- **article_extraction_prompt.txt** — Biomedical research interpreter: extract structured fields (summary, key_findings, biological_systems, symptoms, biomarkers, root_causes, etc.) from raw article text. Used as input for blog_article_from_research_prompt.
- **blog_article_from_research_prompt.txt** — Turns research + extraction into the exact blog article structure: title, excerpt, evidenceLevel, category, pillar, tags, sources, and 7 sections (Context, Why this is trending, What research says, What this means for women, When it might apply, When it might not, Implementation considerations). Sections 6–7 gated. Placeholders: `{{title}}`, `{{summary}}`, `{{key_findings}}`, `{{biological_systems}}`, `{{symptoms}}`, `{{biomarkers}}`, `{{root_causes}}`, `{{evidence_level}}`, `{{abstract}}`.
- **knowledge_generation_prompt.txt** — Legacy: narrative content for knowledge_content table.
- **label_alignment_prompt.txt** — Map extraction output to approved taxonomy.

Placeholders use double braces `{{name}}` and are replaced at runtime when loading the template.

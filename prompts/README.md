# Prompt templates

Prompts are stored here so they can be updated without changing code.

- **article_extraction_prompt.txt** — Biomedical research interpreter: extract structured fields (summary, key_findings, biological_systems, symptoms, biomarkers, root_causes, preventive_topics, intervention_types, life_stages, evidence_level) from raw article text. Placeholders: `{{title}}`, `{{journal}}`, `{{abstract}}`, `{{full_text}}`. Output is validated against `ArticleExtractionSchema`.
- **knowledge_generation_prompt.txt** — Medical science communicator: generate narrative content (science_explained, patterns_and_root_causes, preventive_insights, clinical_context) for the knowledge_content table. Placeholders: `{{summary}}`, `{{key_findings}}`, `{{biological_systems}}`, `{{root_causes}}`.
- **label_alignment_prompt.txt** — Map extraction output to approved taxonomy; outputs life_stage_labels, symptom_labels, body_system_labels, biomarker_labels, root_cause_labels, preventive_health_labels, goal_labels, intervention_type_labels. Placeholders: `{{summary}}`, `{{key_findings}}`, `{{biological_systems}}`, `{{symptoms}}`, `{{biomarkers}}`, `{{root_causes}}`, `{{preventive_topics}}`.

Placeholders use double braces `{{name}}` and are replaced at runtime when loading the template.

-- Add country field to profile_snapshots
ALTER TABLE "profile_snapshots"
  ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'DE';

-- Drop single-column unique constraints on coverage tables (if they exist from migration 000000)
DROP INDEX IF EXISTS "biomarker_coverage_ui_content_biomarker_name_normalized_key";
DROP INDEX IF EXISTS "biomarker_doctor_script_templates_biomarker_name_normalized_key";

-- Add composite unique constraints (biomarker + locale) on coverage tables
CREATE UNIQUE INDEX IF NOT EXISTS "biomarker_coverage_locale_unique"
  ON "biomarker_coverage_ui_content" ("biomarker_name_normalized", "locale");

CREATE UNIQUE INDEX IF NOT EXISTS "biomarker_doctor_script_locale_unique"
  ON "biomarker_doctor_script_templates" ("biomarker_name_normalized", "locale");

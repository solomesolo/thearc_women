-- Migration: biomarker coverage UI content and doctor script templates
-- Supports the Germany insurance/doctor guidance UX layer

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "biomarker_coverage_ui_content" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "biomarker_name_normalized" TEXT NOT NULL,
  "source_biomarker_name" TEXT NOT NULL,
  "source_category" TEXT,
  "source_sub_category" TEXT,
  "source_sample_type" TEXT,
  "gkv_raw_coverage" TEXT,
  "pkv_raw_coverage" TEXT,
  "gkv_raw_frequency" TEXT,
  "gkv_status_label" TEXT NOT NULL,
  "gkv_user_text" TEXT NOT NULL,
  "gkv_frequency_user_text" TEXT,
  "gkv_extra_note" TEXT,
  "pkv_status_label" TEXT NOT NULL,
  "pkv_user_text" TEXT NOT NULL,
  "pkv_extra_note" TEXT,
  "self_pay_note" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "content_version" TEXT NOT NULL DEFAULT 'v1',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "biomarker_coverage_ui_content_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "biomarker_coverage_ui_content_biomarker_name_normalized_key"
  ON "biomarker_coverage_ui_content" ("biomarker_name_normalized");

CREATE INDEX IF NOT EXISTS "biomarker_coverage_ui_content_source_category_idx"
  ON "biomarker_coverage_ui_content" ("source_category");

CREATE INDEX IF NOT EXISTS "biomarker_coverage_ui_content_source_sub_category_idx"
  ON "biomarker_coverage_ui_content" ("source_sub_category");

CREATE TABLE IF NOT EXISTS "biomarker_doctor_script_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "biomarker_name_normalized" TEXT NOT NULL,
  "source_biomarker_name" TEXT NOT NULL,
  "source_category" TEXT,
  "source_sub_category" TEXT,
  "source_sample_type" TEXT,
  "intro_template" TEXT NOT NULL,
  "symptom_template" TEXT,
  "coverage_question_template" TEXT,
  "followup_template" TEXT,
  "why_this_matters_template" TEXT NOT NULL,
  "private_option_template" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "content_version" TEXT NOT NULL DEFAULT 'v1',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "biomarker_doctor_script_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "biomarker_doctor_script_templates_biomarker_name_normalized_key"
  ON "biomarker_doctor_script_templates" ("biomarker_name_normalized");

CREATE INDEX IF NOT EXISTS "biomarker_doctor_script_templates_source_category_idx"
  ON "biomarker_doctor_script_templates" ("source_category");

CREATE INDEX IF NOT EXISTS "biomarker_doctor_script_templates_source_sub_category_idx"
  ON "biomarker_doctor_script_templates" ("source_sub_category");

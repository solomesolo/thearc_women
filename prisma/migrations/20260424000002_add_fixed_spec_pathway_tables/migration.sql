-- Migration: ARC Recommendation Engine fixed-spec pathway tables

CREATE TABLE IF NOT EXISTS "biomarker_priority_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "biomarker_id" TEXT NOT NULL,
  "biomarker_name" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL,
  "trigger_key" TEXT NOT NULL,
  "weight" INT NOT NULL,
  "max_priority_tier" TEXT NOT NULL,
  "reason_template" TEXT NOT NULL,
  "is_blood_marker" BOOLEAN NOT NULL DEFAULT TRUE,
  "is_screening" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "biomarker_priority_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "biomarker_priority_rules_check_key_idx" ON "biomarker_priority_rules"("check_key");
CREATE INDEX IF NOT EXISTS "biomarker_priority_rules_biomarker_id_idx" ON "biomarker_priority_rules"("biomarker_id");
CREATE INDEX IF NOT EXISTS "biomarker_priority_rules_check_trigger_idx" ON "biomarker_priority_rules"("check_key","trigger_type","trigger_key");

CREATE TABLE IF NOT EXISTS "canonical_check_biomarker_slots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "check_key" TEXT NOT NULL,
  "min_core" INT NOT NULL DEFAULT 1,
  "max_core" INT NOT NULL DEFAULT 4,
  "default_timeframe" TEXT NOT NULL,
  "overflow_strategy" TEXT NOT NULL DEFAULT 'downgrade_to_high_later',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "canonical_check_biomarker_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "canonical_check_biomarker_slots_check_key_unique" ON "canonical_check_biomarker_slots"("check_key");

CREATE TABLE IF NOT EXISTS "signal_check_explanation_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "signal_key" TEXT NOT NULL,
  "signal_label" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL,
  "priority_weight" INT NOT NULL DEFAULT 1,
  "content_priority" INT NOT NULL DEFAULT 5,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "signal_check_explanation_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "signal_check_expl_templates_signal_check_unique" ON "signal_check_explanation_templates"("signal_key","check_key");
CREATE INDEX IF NOT EXISTS "signal_check_expl_templates_check_key_idx" ON "signal_check_explanation_templates"("check_key");
CREATE INDEX IF NOT EXISTS "signal_check_expl_templates_signal_key_idx" ON "signal_check_explanation_templates"("signal_key");

CREATE TABLE IF NOT EXISTS "check_priority_explanations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "check_key" TEXT NOT NULL,
  "score_min" INT NOT NULL,
  "score_max" INT NOT NULL,
  "impact_tier" TEXT NOT NULL,
  "explanation_template" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "check_priority_explanations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "check_priority_explanations_check_key_idx" ON "check_priority_explanations"("check_key");

CREATE TABLE IF NOT EXISTS "recommendation_content_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "content_type" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "recommendation_content_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recommendation_content_templates_check_key_idx" ON "recommendation_content_templates"("check_key");
CREATE INDEX IF NOT EXISTS "recommendation_content_templates_content_type_idx" ON "recommendation_content_templates"("content_type");

CREATE TABLE IF NOT EXISTS "user_pathway_biomarker_selection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "biomarker_id" TEXT NOT NULL,
  "biomarker_name" TEXT NOT NULL,
  "priority_tier" TEXT NOT NULL,
  "timeframe" TEXT NOT NULL,
  "score" INT NOT NULL,
  "rank_within_check" INT NOT NULL,
  "rank_global" INT NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "user_pathway_biomarker_selection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_pathway_biomarker_selection_unique" ON "user_pathway_biomarker_selection"("user_id","check_key","biomarker_id");
CREATE INDEX IF NOT EXISTS "user_pathway_biomarker_selection_user_idx" ON "user_pathway_biomarker_selection"("user_id");
CREATE INDEX IF NOT EXISTS "user_pathway_biomarker_selection_user_timeframe_idx" ON "user_pathway_biomarker_selection"("user_id","timeframe");
CREATE INDEX IF NOT EXISTS "user_pathway_biomarker_selection_check_idx" ON "user_pathway_biomarker_selection"("check_key");

CREATE TABLE IF NOT EXISTS "user_pathway_schedule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "timeframe" TEXT NOT NULL,
  "calendar_start" DATE NOT NULL,
  "calendar_end" DATE NOT NULL,
  "priority_rank" INT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'MISSING',
  "timing_reason" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "user_pathway_schedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_pathway_schedule_unique" ON "user_pathway_schedule"("user_id","check_key");
CREATE INDEX IF NOT EXISTS "user_pathway_schedule_user_idx" ON "user_pathway_schedule"("user_id");
CREATE INDEX IF NOT EXISTS "user_pathway_schedule_user_time_idx" ON "user_pathway_schedule"("user_id","timeframe","priority_rank");


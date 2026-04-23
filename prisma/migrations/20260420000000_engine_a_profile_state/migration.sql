-- Engine A — Profile State Engine (questionnaire + snapshots + catalog bridge)

-- CreateTable
CREATE TABLE "questionnaire_definitions" (
  "id" UUID NOT NULL,
  "version" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "questionnaire_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_definitions_version_key" ON "questionnaire_definitions"("version");

-- CreateTable
CREATE TABLE "questionnaire_questions" (
  "id" UUID NOT NULL,
  "questionnaire_definition_id" UUID NOT NULL,
  "question_key" TEXT NOT NULL,
  "question_type" TEXT NOT NULL,
  "step_number" INTEGER NOT NULL,
  "display_order" INTEGER NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "conditional_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "ui_schema" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_questions_def_key_unique" ON "questionnaire_questions"("questionnaire_definition_id", "question_key");

-- CreateIndex
CREATE INDEX "questionnaire_questions_definition_step_idx" ON "questionnaire_questions"("questionnaire_definition_id", "step_number");

-- CreateIndex
CREATE INDEX "questionnaire_questions_definition_order_idx" ON "questionnaire_questions"("questionnaire_definition_id", "display_order");

-- CreateTable
CREATE TABLE "questionnaire_question_options" (
  "id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "option_key" TEXT NOT NULL,
  "label_en" TEXT NOT NULL,
  "label_de" TEXT,
  "display_order" INTEGER NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "questionnaire_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_question_options_q_opt_unique" ON "questionnaire_question_options"("question_id", "option_key");

-- CreateIndex
CREATE INDEX "questionnaire_question_options_question_order_idx" ON "questionnaire_question_options"("question_id", "display_order");

-- CreateTable
CREATE TABLE "questionnaire_sessions" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "questionnaire_definition_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "abandoned_at" TIMESTAMP(3),
  "last_step_number" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "questionnaire_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questionnaire_sessions_user_email_idx" ON "questionnaire_sessions"("user_email");

-- CreateIndex
CREATE INDEX "questionnaire_sessions_user_email_status_idx" ON "questionnaire_sessions"("user_email", "status");

-- CreateTable
CREATE TABLE "questionnaire_answers" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "question_key" TEXT NOT NULL,
  "answer_value" JSONB NOT NULL,
  "normalized_value" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "questionnaire_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_answers_session_q_unique" ON "questionnaire_answers"("session_id", "question_key");

-- CreateIndex
CREATE INDEX "questionnaire_answers_session_idx" ON "questionnaire_answers"("session_id");

-- CreateTable
CREATE TABLE "profile_snapshots" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "session_id" UUID,
  "questionnaire_version" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,

  "user_name" TEXT,
  "age_group" TEXT,
  "age_group_label" TEXT,
  "life_stage" TEXT,
  "life_stage_label" TEXT,

  "goal_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "goal_labels" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "risk_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "condition_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "medication_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "family_history_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "lifestyle_flags" JSONB NOT NULL DEFAULT '[]'::jsonb,

  "domain_affinities" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "bundle_affinities" JSONB NOT NULL DEFAULT '{}'::jsonb,

  "last_tests" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "recency_hints" JSONB NOT NULL DEFAULT '{}'::jsonb,

  "profile_completeness_percent" INTEGER NOT NULL DEFAULT 0,
  "retake_state" TEXT NOT NULL DEFAULT 'not_needed',

  "profile_summary" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "raw_profile" JSONB NOT NULL,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "profile_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_snapshots_user_email_idx" ON "profile_snapshots"("user_email");

-- CreateIndex
CREATE INDEX "profile_snapshots_user_email_active_idx" ON "profile_snapshots"("user_email", "is_active");

-- CreateIndex
CREATE INDEX "profile_snapshots_session_idx" ON "profile_snapshots"("session_id");

-- CreateTable
CREATE TABLE "profile_snapshot_diffs" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "previous_snapshot_id" UUID,
  "current_snapshot_id" UUID NOT NULL,
  "changed_fields" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "profile_snapshot_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_snapshot_diffs_user_email_idx" ON "profile_snapshot_diffs"("user_email");

-- CreateIndex
CREATE INDEX "profile_snapshot_diffs_current_snapshot_idx" ON "profile_snapshot_diffs"("current_snapshot_id");

-- CreateTable
CREATE TABLE "canonical_test_bundles" (
  "id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "display_name_en" TEXT NOT NULL,
  "display_name_de" TEXT,
  "category" TEXT NOT NULL,
  "default_interval_months" INTEGER,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "canonical_test_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canonical_test_bundles_bundle_key_key" ON "canonical_test_bundles"("bundle_key");

-- CreateTable
CREATE TABLE "bundle_biomarker_aliases" (
  "id" UUID NOT NULL,
  "bundle_id" UUID NOT NULL,
  "biomarker_name_normalized" TEXT NOT NULL,
  "biomarker_name_display" TEXT NOT NULL,
  "category" TEXT,

  CONSTRAINT "bundle_biomarker_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_biomarker_aliases_bundle_norm_unique" ON "bundle_biomarker_aliases"("bundle_id", "biomarker_name_normalized");

-- CreateIndex
CREATE INDEX "bundle_biomarker_aliases_bundle_idx" ON "bundle_biomarker_aliases"("bundle_id");

-- CreateTable
CREATE TABLE "catalog_products" (
  "id" UUID NOT NULL,
  "external_product_id" TEXT,
  "provider_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price_cents" INTEGER,
  "currency" TEXT DEFAULT 'EUR',
  "tags" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "about_text" TEXT,
  "help_check_text" TEXT,
  "audience_text" TEXT,
  "created_at_source" TIMESTAMP(3),
  "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_products_external_product_id_key" ON "catalog_products"("external_product_id");

-- CreateIndex
CREATE INDEX "catalog_products_available_idx" ON "catalog_products"("available");

-- CreateTable
CREATE TABLE "catalog_biomarkers" (
  "id" UUID NOT NULL,
  "external_code" TEXT,
  "name" TEXT NOT NULL,
  "normalized_name" TEXT NOT NULL,
  "category" TEXT,

  CONSTRAINT "catalog_biomarkers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_biomarkers_normalized_name_idx" ON "catalog_biomarkers"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_biomarkers_norm_code_unique" ON "catalog_biomarkers"("normalized_name", "external_code");

-- CreateTable
CREATE TABLE "catalog_product_biomarkers" (
  "product_id" UUID NOT NULL,
  "biomarker_id" UUID NOT NULL,

  CONSTRAINT "catalog_product_biomarkers_pkey" PRIMARY KEY ("product_id", "biomarker_id")
);

-- CreateIndex
CREATE INDEX "catalog_product_biomarkers_biomarker_idx" ON "catalog_product_biomarkers"("biomarker_id");

-- CreateTable
CREATE TABLE "bundle_product_mapping" (
  "id" UUID NOT NULL,
  "bundle_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "match_score" INTEGER NOT NULL DEFAULT 0,
  "match_reason" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "bundle_product_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_product_mapping_bundle_product_unique" ON "bundle_product_mapping"("bundle_id", "product_id");

-- CreateIndex
CREATE INDEX "bundle_product_mapping_bundle_idx" ON "bundle_product_mapping"("bundle_id");

-- CreateIndex
CREATE INDEX "bundle_product_mapping_product_idx" ON "bundle_product_mapping"("product_id");

-- AddForeignKey
ALTER TABLE "questionnaire_questions"
  ADD CONSTRAINT "questionnaire_questions_questionnaire_definition_id_fkey"
  FOREIGN KEY ("questionnaire_definition_id") REFERENCES "questionnaire_definitions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_question_options"
  ADD CONSTRAINT "questionnaire_question_options_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "questionnaire_questions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_sessions"
  ADD CONSTRAINT "questionnaire_sessions_questionnaire_definition_id_fkey"
  FOREIGN KEY ("questionnaire_definition_id") REFERENCES "questionnaire_definitions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_answers"
  ADD CONSTRAINT "questionnaire_answers_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "questionnaire_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_snapshots"
  ADD CONSTRAINT "profile_snapshots_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "questionnaire_sessions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_snapshot_diffs"
  ADD CONSTRAINT "profile_snapshot_diffs_previous_snapshot_id_fkey"
  FOREIGN KEY ("previous_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_snapshot_diffs"
  ADD CONSTRAINT "profile_snapshot_diffs_current_snapshot_id_fkey"
  FOREIGN KEY ("current_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_biomarker_aliases"
  ADD CONSTRAINT "bundle_biomarker_aliases_bundle_id_fkey"
  FOREIGN KEY ("bundle_id") REFERENCES "canonical_test_bundles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_biomarkers"
  ADD CONSTRAINT "catalog_product_biomarkers_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_biomarkers"
  ADD CONSTRAINT "catalog_product_biomarkers_biomarker_id_fkey"
  FOREIGN KEY ("biomarker_id") REFERENCES "catalog_biomarkers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_product_mapping"
  ADD CONSTRAINT "bundle_product_mapping_bundle_id_fkey"
  FOREIGN KEY ("bundle_id") REFERENCES "canonical_test_bundles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_product_mapping"
  ADD CONSTRAINT "bundle_product_mapping_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


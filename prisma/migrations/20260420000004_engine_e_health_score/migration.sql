-- Engine E — Health Score / Completeness Engine

-- CreateTable
CREATE TABLE "health_score_policies" (
  "id" UUID NOT NULL,
  "policy_key" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "status_weights" JSONB NOT NULL,
  "relevance_threshold" NUMERIC(6,3) NOT NULL DEFAULT 1.000,
  "allow_partial_coverage" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "health_score_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "health_score_policies_policy_key_unique" ON "health_score_policies"("policy_key");

-- CreateTable
CREATE TABLE "bundle_weight_policies" (
  "id" UUID NOT NULL,
  "policy_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "base_weight" NUMERIC(8,3) NOT NULL,
  "category" TEXT,

  CONSTRAINT "bundle_weight_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bundle_weight_policies_policy_bundle_unique" ON "bundle_weight_policies"("policy_id","bundle_key");
CREATE INDEX "bundle_weight_policies_policy_idx" ON "bundle_weight_policies"("policy_id");
CREATE INDEX "bundle_weight_policies_bundle_idx" ON "bundle_weight_policies"("bundle_key");

-- CreateTable
CREATE TABLE "bundle_coverage_requirements" (
  "id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "biomarker_normalized_name" TEXT NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "weight" NUMERIC(8,3) NOT NULL DEFAULT 1.000,

  CONSTRAINT "bundle_coverage_requirements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bundle_coverage_requirements_bundle_biomarker_unique" ON "bundle_coverage_requirements"("bundle_key","biomarker_normalized_name");
CREATE INDEX "bundle_coverage_requirements_bundle_idx" ON "bundle_coverage_requirements"("bundle_key");

-- CreateTable
CREATE TABLE "bundle_relevance_factors" (
  "id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "factor_type" TEXT NOT NULL,
  "factor_key" TEXT NOT NULL,
  "weight_delta" NUMERIC(8,3) NOT NULL,

  CONSTRAINT "bundle_relevance_factors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bundle_relevance_factors_bundle_type_key_unique" ON "bundle_relevance_factors"("bundle_key","factor_type","factor_key");
CREATE INDEX "bundle_relevance_factors_bundle_idx" ON "bundle_relevance_factors"("bundle_key");

-- CreateTable
CREATE TABLE "bundle_suppression_rules" (
  "id" UUID NOT NULL,
  "primary_bundle_key" TEXT NOT NULL,
  "suppressed_bundle_key" TEXT NOT NULL,
  "condition_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bundle_suppression_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bundle_suppression_rules_primary_idx" ON "bundle_suppression_rules"("primary_bundle_key");
CREATE INDEX "bundle_suppression_rules_suppressed_idx" ON "bundle_suppression_rules"("suppressed_bundle_key");

-- CreateTable
CREATE TABLE "user_health_scores" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID NOT NULL,
  "policy_id" UUID NOT NULL,
  "score" NUMERIC(6,2) NOT NULL,
  "denominator_total" NUMERIC(12,4) NOT NULL,
  "numerator_total" NUMERIC(12,4) NOT NULL,
  "bundle_count" INTEGER NOT NULL,
  "score_band" TEXT,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_health_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_health_scores_user_email_idx" ON "user_health_scores"("user_email");
CREATE INDEX "user_health_scores_profile_idx" ON "user_health_scores"("profile_snapshot_id");
CREATE INDEX "user_health_scores_created_at_idx" ON "user_health_scores"("created_at");

-- CreateTable
CREATE TABLE "user_bundle_score_instances" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID NOT NULL,
  "health_score_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "base_weight" NUMERIC(10,4) NOT NULL,
  "relevance_weight" NUMERIC(10,4) NOT NULL,
  "status_multiplier" NUMERIC(8,4) NOT NULL,
  "coverage_ratio" NUMERIC(8,4) NOT NULL,
  "denominator_weight" NUMERIC(10,4) NOT NULL,
  "numerator_value" NUMERIC(10,4) NOT NULL,
  "rationale" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_bundle_score_instances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_bundle_score_instances_user_email_idx" ON "user_bundle_score_instances"("user_email");
CREATE INDEX "user_bundle_score_instances_profile_idx" ON "user_bundle_score_instances"("profile_snapshot_id");
CREATE INDEX "user_bundle_score_instances_health_score_idx" ON "user_bundle_score_instances"("health_score_id");
CREATE INDEX "user_bundle_score_instances_bundle_idx" ON "user_bundle_score_instances"("bundle_key");

-- AddForeignKey
ALTER TABLE "bundle_weight_policies"
  ADD CONSTRAINT "bundle_weight_policies_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "health_score_policies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_health_scores"
  ADD CONSTRAINT "user_health_scores_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "health_score_policies"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_health_scores"
  ADD CONSTRAINT "user_health_scores_profile_snapshot_id_fkey"
  FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bundle_score_instances"
  ADD CONSTRAINT "user_bundle_score_instances_profile_snapshot_id_fkey"
  FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bundle_score_instances"
  ADD CONSTRAINT "user_bundle_score_instances_health_score_id_fkey"
  FOREIGN KEY ("health_score_id") REFERENCES "user_health_scores"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


-- Engine C — Recency & Status Engine (instances, evidence, actions, status snapshots)

-- CreateTable
CREATE TABLE "recommendation_instances" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "source_recommendation_result_id" UUID,
  "priority_score" INTEGER NOT NULL DEFAULT 0,
  "recommended_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "recommendation_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommendation_instances_user_email_idx" ON "recommendation_instances"("user_email");
CREATE INDEX "recommendation_instances_profile_snapshot_idx" ON "recommendation_instances"("profile_snapshot_id");
CREATE INDEX "recommendation_instances_bundle_key_idx" ON "recommendation_instances"("bundle_key");
CREATE UNIQUE INDEX "recommendation_instances_user_profile_bundle_unique" ON "recommendation_instances"("user_email","profile_snapshot_id","bundle_key");

-- CreateTable
CREATE TABLE "user_test_evidence" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "evidence_source" TEXT NOT NULL,
  "evidence_date" DATE,
  "raw_recency_code" TEXT,
  "biomarker_payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "confidence_score" NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  "source_reference_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_test_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_test_evidence_user_email_idx" ON "user_test_evidence"("user_email");
CREATE INDEX "user_test_evidence_user_bundle_idx" ON "user_test_evidence"("user_email","bundle_key");
CREATE INDEX "user_test_evidence_bundle_key_idx" ON "user_test_evidence"("bundle_key");

-- CreateTable
CREATE TABLE "user_recommendation_actions" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "recommendation_instance_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "action_metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "action_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_recommendation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_recommendation_actions_user_email_idx" ON "user_recommendation_actions"("user_email");
CREATE INDEX "user_recommendation_actions_instance_idx" ON "user_recommendation_actions"("recommendation_instance_id");
CREATE INDEX "user_recommendation_actions_bundle_key_idx" ON "user_recommendation_actions"("bundle_key");

-- CreateTable
CREATE TABLE "status_snapshots" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "recommendation_instance_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "recency_status" TEXT NOT NULL,
  "execution_status" TEXT NOT NULL,
  "final_status" TEXT NOT NULL,
  "state_group" TEXT NOT NULL,
  "effective_interval_months" INTEGER NOT NULL,
  "evidence_source_used" TEXT,
  "evidence_date_used" DATE,
  "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "engine_version" TEXT NOT NULL,
  "status_payload" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "status_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_snapshots_user_email_idx" ON "status_snapshots"("user_email");
CREATE INDEX "status_snapshots_instance_idx" ON "status_snapshots"("recommendation_instance_id");
CREATE INDEX "status_snapshots_bundle_key_idx" ON "status_snapshots"("bundle_key");

-- AddForeignKey
ALTER TABLE "recommendation_instances"
  ADD CONSTRAINT "recommendation_instances_profile_snapshot_id_fkey"
  FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_instances"
  ADD CONSTRAINT "recommendation_instances_source_recommendation_result_id_fkey"
  FOREIGN KEY ("source_recommendation_result_id") REFERENCES "recommendation_results"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendation_actions"
  ADD CONSTRAINT "user_recommendation_actions_recommendation_instance_id_fkey"
  FOREIGN KEY ("recommendation_instance_id") REFERENCES "recommendation_instances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_snapshots"
  ADD CONSTRAINT "status_snapshots_recommendation_instance_id_fkey"
  FOREIGN KEY ("recommendation_instance_id") REFERENCES "recommendation_instances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


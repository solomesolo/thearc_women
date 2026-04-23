-- Engine B — Deterministic Recommendation Engine (runs + results + audit events)

-- CreateTable
CREATE TABLE "recommendation_runs" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID NOT NULL,
  "engine_version" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recommendation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommendation_runs_user_email_idx" ON "recommendation_runs"("user_email");

-- CreateIndex
CREATE INDEX "recommendation_runs_profile_snapshot_idx" ON "recommendation_runs"("profile_snapshot_id");

-- CreateTable
CREATE TABLE "recommendation_results" (
  "id" UUID NOT NULL,
  "run_id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priority_score" INTEGER NOT NULL,
  "priority_rank" INTEGER,
  "reasons_json" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "matched_product_ids" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "explanation_seed_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recommendation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommendation_results_run_idx" ON "recommendation_results"("run_id");
CREATE INDEX "recommendation_results_user_email_idx" ON "recommendation_results"("user_email");
CREATE INDEX "recommendation_results_profile_snapshot_idx" ON "recommendation_results"("profile_snapshot_id");
CREATE INDEX "recommendation_results_bundle_key_idx" ON "recommendation_results"("bundle_key");

-- CreateTable
CREATE TABLE "recommendation_score_events" (
  "id" UUID NOT NULL,
  "recommendation_result_id" UUID NOT NULL,
  "rule_key" TEXT NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "score_delta" INTEGER NOT NULL,
  "reason_code" TEXT NOT NULL,
  "reason_payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recommendation_score_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommendation_score_events_result_idx" ON "recommendation_score_events"("recommendation_result_id");
CREATE INDEX "recommendation_score_events_bundle_key_idx" ON "recommendation_score_events"("bundle_key");

-- AddForeignKey
ALTER TABLE "recommendation_runs"
  ADD CONSTRAINT "recommendation_runs_profile_snapshot_id_fkey"
  FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_results"
  ADD CONSTRAINT "recommendation_results_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "recommendation_runs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_results"
  ADD CONSTRAINT "recommendation_results_profile_snapshot_id_fkey"
  FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_score_events"
  ADD CONSTRAINT "recommendation_score_events_recommendation_result_id_fkey"
  FOREIGN KEY ("recommendation_result_id") REFERENCES "recommendation_results"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;


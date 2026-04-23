-- Engine H — Dashboard Summary Engine (read-model aggregator)

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_recommendation_actions" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "recommendation_instance_id" UUID,
  "action_status" TEXT NOT NULL, -- planned, completed, dismissed
  "action_source" TEXT NOT NULL DEFAULT 'manual',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_recommendation_actions_pkey" PRIMARY KEY ("id")
);

-- Ensure columns exist (in case table pre-existed)
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "user_email" TEXT;
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "bundle_key" TEXT;
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "recommendation_instance_id" UUID;
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "action_status" TEXT;
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "action_source" TEXT;
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3);
ALTER TABLE "user_recommendation_actions" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "user_recommendation_actions_user_bundle_unique"
  ON "user_recommendation_actions"("user_email","bundle_key");

CREATE INDEX IF NOT EXISTS "user_recommendation_actions_user_email_idx" ON "user_recommendation_actions"("user_email");
CREATE INDEX IF NOT EXISTS "user_recommendation_actions_status_idx" ON "user_recommendation_actions"("action_status");

-- AddForeignKey (optional; keep nullable for early/dummy runs)
DO $$
BEGIN
  ALTER TABLE "user_recommendation_actions"
    ADD CONSTRAINT "user_recommendation_actions_recommendation_instance_id_fkey"
    FOREIGN KEY ("recommendation_instance_id") REFERENCES "recommendation_instances"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "dashboard_score_snapshots" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID,
  "score_value" INTEGER NOT NULL,
  "score_method" TEXT NOT NULL,
  "score_components" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dashboard_score_snapshots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dashboard_score_snapshots" ADD COLUMN IF NOT EXISTS "user_email" TEXT;
ALTER TABLE "dashboard_score_snapshots" ADD COLUMN IF NOT EXISTS "profile_snapshot_id" UUID;
ALTER TABLE "dashboard_score_snapshots" ADD COLUMN IF NOT EXISTS "score_value" INTEGER;
ALTER TABLE "dashboard_score_snapshots" ADD COLUMN IF NOT EXISTS "score_method" TEXT;
ALTER TABLE "dashboard_score_snapshots" ADD COLUMN IF NOT EXISTS "score_components" JSONB;
ALTER TABLE "dashboard_score_snapshots" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "dashboard_score_snapshots_user_email_idx" ON "dashboard_score_snapshots"("user_email");
CREATE INDEX IF NOT EXISTS "dashboard_score_snapshots_created_at_idx" ON "dashboard_score_snapshots"("created_at");

DO $$
BEGIN
  ALTER TABLE "dashboard_score_snapshots"
    ADD CONSTRAINT "dashboard_score_snapshots_profile_snapshot_id_fkey"
    FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_entries" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "recommendation_instance_id" UUID,
  "due_date" DATE,
  "due_bucket" TEXT NOT NULL, -- this_month, next_month, in_6_weeks, in_3_months, later
  "title" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "user_email" TEXT;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "bundle_key" TEXT;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "recommendation_instance_id" UUID;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "due_date" DATE;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "due_bucket" TEXT;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "active" BOOLEAN;
ALTER TABLE "timeline_entries" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "timeline_entries_user_email_idx" ON "timeline_entries"("user_email");
CREATE INDEX IF NOT EXISTS "timeline_entries_bucket_idx" ON "timeline_entries"("due_bucket");
CREATE INDEX IF NOT EXISTS "timeline_entries_due_date_idx" ON "timeline_entries"("due_date");

DO $$
BEGIN
  ALTER TABLE "timeline_entries"
    ADD CONSTRAINT "timeline_entries_recommendation_instance_id_fkey"
    FOREIGN KEY ("recommendation_instance_id") REFERENCES "recommendation_instances"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Optional materialized dashboard summary cache
CREATE TABLE IF NOT EXISTS "dashboard_summaries" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID,
  "version" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dashboard_summaries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "dashboard_summaries" ADD COLUMN IF NOT EXISTS "user_email" TEXT;
ALTER TABLE "dashboard_summaries" ADD COLUMN IF NOT EXISTS "profile_snapshot_id" UUID;
ALTER TABLE "dashboard_summaries" ADD COLUMN IF NOT EXISTS "version" TEXT;
ALTER TABLE "dashboard_summaries" ADD COLUMN IF NOT EXISTS "payload" JSONB;
ALTER TABLE "dashboard_summaries" ADD COLUMN IF NOT EXISTS "generated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_summaries_user_version_unique" ON "dashboard_summaries"("user_email","version");
CREATE INDEX IF NOT EXISTS "dashboard_summaries_generated_at_idx" ON "dashboard_summaries"("generated_at");

DO $$
BEGIN
  ALTER TABLE "dashboard_summaries"
    ADD CONSTRAINT "dashboard_summaries_profile_snapshot_id_fkey"
    FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- Engine G — Timeline / Upcoming Checks Engine

-- CreateTable
CREATE TABLE "timeline_policies" (
  "id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "timeline_category" TEXT NOT NULL,
  "default_lead_days" INTEGER NOT NULL,
  "outdated_lead_days" INTEGER NOT NULL,
  "follow_up_days" INTEGER,
  "max_follow_ups" INTEGER NOT NULL DEFAULT 1,
  "schedule_mode" TEXT NOT NULL,
  "title_check" TEXT NOT NULL,
  "title_follow_up" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timeline_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "timeline_policies_bundle_key_unique" ON "timeline_policies"("bundle_key");

-- CreateTable
CREATE TABLE "timeline_rule_overrides" (
  "id" UUID NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL,
  "trigger_value" TEXT NOT NULL,
  "urgency_boost" INTEGER NOT NULL DEFAULT 0,
  "max_bucket" TEXT,
  "follow_up_days_override" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timeline_rule_overrides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "timeline_rule_overrides_bundle_idx" ON "timeline_rule_overrides"("bundle_key");
CREATE INDEX "timeline_rule_overrides_trigger_idx" ON "timeline_rule_overrides"("trigger_type","trigger_value");

-- CreateTable
CREATE TABLE "user_plan_items" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "planned_date" DATE,
  "completed_date" DATE,
  "user_state" TEXT NOT NULL DEFAULT 'suggested',
  "source" TEXT NOT NULL DEFAULT 'system',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_plan_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_plan_items_user_email_idx" ON "user_plan_items"("user_email");
CREATE INDEX "user_plan_items_bundle_idx" ON "user_plan_items"("bundle_key");

-- CreateTable
CREATE TABLE "timeline_generation_runs" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "profile_snapshot_id" UUID,
  "engine_version" TEXT NOT NULL,
  "input_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timeline_generation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "timeline_generation_runs_user_email_idx" ON "timeline_generation_runs"("user_email");
CREATE INDEX "timeline_generation_runs_created_at_idx" ON "timeline_generation_runs"("created_at");

-- CreateTable
CREATE TABLE "timeline_events" (
  "id" UUID NOT NULL,
  "user_email" TEXT NOT NULL,
  "bundle_key" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "scheduled_date" DATE NOT NULL,
  "label_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "status" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "parent_event_id" UUID,
  "generation_run_id" UUID NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "timeline_events_user_email_idx" ON "timeline_events"("user_email");
CREATE INDEX "timeline_events_bundle_idx" ON "timeline_events"("bundle_key");
CREATE INDEX "timeline_events_scheduled_idx" ON "timeline_events"("scheduled_date");
CREATE INDEX "timeline_events_label_idx" ON "timeline_events"("label_key");
CREATE INDEX "timeline_events_run_idx" ON "timeline_events"("generation_run_id");

-- AddForeignKey
ALTER TABLE "timeline_generation_runs"
  ADD CONSTRAINT "timeline_generation_runs_profile_snapshot_id_fkey"
  FOREIGN KEY ("profile_snapshot_id") REFERENCES "profile_snapshots"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events"
  ADD CONSTRAINT "timeline_events_generation_run_id_fkey"
  FOREIGN KEY ("generation_run_id") REFERENCES "timeline_generation_runs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events"
  ADD CONSTRAINT "timeline_events_parent_event_id_fkey"
  FOREIGN KEY ("parent_event_id") REFERENCES "timeline_events"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;


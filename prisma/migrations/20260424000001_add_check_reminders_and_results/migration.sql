-- Migration: add per-user check reminders + linked results uploads

-- 1) Extend user_check_statuses
ALTER TABLE "user_check_statuses"
  ALTER COLUMN "status" SET DEFAULT 'missing';

ALTER TABLE "user_check_statuses"
  ADD COLUMN IF NOT EXISTS "selected_fulfillment_type" TEXT,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 2) Reminders table
CREATE TABLE IF NOT EXISTS "user_check_reminders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_email" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "remind_at" TIMESTAMPTZ NOT NULL,
  "timeframe" TEXT,
  "channel" TEXT NOT NULL DEFAULT 'app',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "user_check_reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_check_reminders_user_email_idx" ON "user_check_reminders"("user_email");
CREATE INDEX IF NOT EXISTS "user_check_reminders_user_email_check_key_idx" ON "user_check_reminders"("user_email", "check_key");

-- 3) Results table (links to health_uploads.document_id optionally)
CREATE TABLE IF NOT EXISTS "user_check_results" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_email" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "document_id" UUID,
  "file_name" TEXT,
  "file_type" TEXT,
  "source" TEXT,
  "test_date" DATE,
  "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "notes" TEXT,

  CONSTRAINT "user_check_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_check_results_user_email_idx" ON "user_check_results"("user_email");
CREATE INDEX IF NOT EXISTS "user_check_results_user_email_check_key_idx" ON "user_check_results"("user_email", "check_key");
CREATE INDEX IF NOT EXISTS "user_check_results_document_id_idx" ON "user_check_results"("document_id");


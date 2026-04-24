-- Migration: add user_check_statuses table for survey-driven check status tracking

CREATE TABLE "user_check_statuses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_email" TEXT NOT NULL,
  "check_key" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'MISSING',
  "planned_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "user_check_statuses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_check_status_unique" ON "user_check_statuses"("user_email", "check_key");
CREATE INDEX "user_check_statuses_user_email_idx" ON "user_check_statuses"("user_email");

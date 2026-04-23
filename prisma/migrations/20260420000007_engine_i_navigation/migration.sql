-- Engine I — Navigation State Engine

-- CreateTable
CREATE TABLE IF NOT EXISTS "onboarding_sessions" (
  "id" UUID NOT NULL,
  "user_email" TEXT,
  "anonymous_session_key" TEXT,
  "status" TEXT NOT NULL, -- not_started, in_progress, completed, abandoned
  "current_step" TEXT, -- start, basics, lifestyle, health_context, test_history
  "step_1_completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "step_2_completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "step_3_completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "step_4_completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_retake" BOOLEAN NOT NULL DEFAULT FALSE,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "abandoned_at" TIMESTAMP(3),
  "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "version" TEXT NOT NULL DEFAULT 'v1',
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "onboarding_sessions_user_email_idx" ON "onboarding_sessions"("user_email");
CREATE INDEX IF NOT EXISTS "onboarding_sessions_anon_key_idx" ON "onboarding_sessions"("anonymous_session_key");
CREATE INDEX IF NOT EXISTS "onboarding_sessions_status_idx" ON "onboarding_sessions"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "onboarding_step_answers" (
  "id" UUID NOT NULL,
  "onboarding_session_id" UUID NOT NULL,
  "step_key" TEXT NOT NULL,
  "question_key" TEXT NOT NULL,
  "answer_value" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "onboarding_step_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_step_answers_session_question_unique"
  ON "onboarding_step_answers"("onboarding_session_id","question_key");

CREATE INDEX IF NOT EXISTS "onboarding_step_answers_session_idx" ON "onboarding_step_answers"("onboarding_session_id");

DO $$
BEGIN
  ALTER TABLE "onboarding_step_answers"
    ADD CONSTRAINT "onboarding_step_answers_onboarding_session_id_fkey"
    FOREIGN KEY ("onboarding_session_id") REFERENCES "onboarding_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "onboarding_step_status" (
  "id" UUID NOT NULL,
  "onboarding_session_id" UUID NOT NULL,
  "step_key" TEXT NOT NULL,
  "is_accessible" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "completed_at" TIMESTAMP(3),
  "validation_errors" JSONB NOT NULL DEFAULT '[]'::jsonb,

  CONSTRAINT "onboarding_step_status_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_step_status_session_step_unique"
  ON "onboarding_step_status"("onboarding_session_id","step_key");

CREATE INDEX IF NOT EXISTS "onboarding_step_status_session_idx" ON "onboarding_step_status"("onboarding_session_id");

DO $$
BEGIN
  ALTER TABLE "onboarding_step_status"
    ADD CONSTRAINT "onboarding_step_status_onboarding_session_id_fkey"
    FOREIGN KEY ("onboarding_session_id") REFERENCES "onboarding_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_result_state" (
  "user_email" TEXT NOT NULL,
  "latest_profile_snapshot_id" UUID,
  "latest_recommendation_run_id" UUID,
  "results_seen_at" TIMESTAMP(3),
  "action_plan_seen_at" TIMESTAMP(3),
  "dashboard_seen_at" TIMESTAMP(3),
  "dashboard_ready" BOOLEAN NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_result_state_pkey" PRIMARY KEY ("user_email")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "navigation_events" (
  "id" UUID NOT NULL,
  "user_email" TEXT,
  "onboarding_session_id" UUID,
  "source_route" TEXT,
  "requested_route" TEXT,
  "resolved_state" TEXT NOT NULL,
  "target_route" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "is_blocking" BOOLEAN NOT NULL DEFAULT FALSE,
  "ui_mode" TEXT NOT NULL DEFAULT 'default',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "navigation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "navigation_events_user_email_idx" ON "navigation_events"("user_email");
CREATE INDEX IF NOT EXISTS "navigation_events_created_at_idx" ON "navigation_events"("created_at");

DO $$
BEGIN
  ALTER TABLE "navigation_events"
    ADD CONSTRAINT "navigation_events_onboarding_session_id_fkey"
    FOREIGN KEY ("onboarding_session_id") REFERENCES "onboarding_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "anonymous_browser_sessions" (
  "anonymous_session_key" TEXT NOT NULL,
  "onboarding_session_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "anonymous_browser_sessions_pkey" PRIMARY KEY ("anonymous_session_key")
);

DO $$
BEGIN
  ALTER TABLE "anonymous_browser_sessions"
    ADD CONSTRAINT "anonymous_browser_sessions_onboarding_session_id_fkey"
    FOREIGN KEY ("onboarding_session_id") REFERENCES "onboarding_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


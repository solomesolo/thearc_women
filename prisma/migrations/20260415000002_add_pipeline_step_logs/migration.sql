-- Extend ocr_jobs with step-level tracking fields
ALTER TABLE "ocr_jobs"
    ADD COLUMN "current_step"    TEXT,
    ADD COLUMN "completed_steps" TEXT[]  NOT NULL DEFAULT '{}',
    ADD COLUMN "retry_count"     INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "max_retries"     INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN "last_error"      TEXT;

-- Extend health_uploads.processing_status to carry the richer status set:
--   uploaded | processing | extracted | classified | completed | failed
-- (column already exists as TEXT — the default constraint covers new values)

-- CreateTable: pipeline_step_logs
-- One row per step attempt. A step can appear multiple times (retries).
CREATE TABLE "pipeline_step_logs" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"   UUID        NOT NULL,
    "step"          TEXT        NOT NULL,   -- ocr | classify | extract | bin_map | normalize | longitudinal | interventions
    "status"        TEXT        NOT NULL,   -- started | completed | failed | retrying | skipped
    "attempt"       INTEGER     NOT NULL DEFAULT 1,
    "duration_ms"   INTEGER,               -- NULL until completed/failed
    "error_message" TEXT,
    "error_detail"  TEXT,
    "started_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completed_at"  TIMESTAMPTZ,

    CONSTRAINT "pipeline_step_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pipeline_step_logs_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

CREATE INDEX "pipeline_step_logs_document_idx"
    ON "pipeline_step_logs"("document_id");

CREATE INDEX "pipeline_step_logs_document_step_idx"
    ON "pipeline_step_logs"("document_id", "step");

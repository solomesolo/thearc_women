-- CreateTable: health_uploads
CREATE TABLE "health_uploads" (
    "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"       UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_email"        TEXT        NOT NULL,
    "file_name"         TEXT        NOT NULL,
    "mime_type"         TEXT        NOT NULL,
    "file_size"         BIGINT      NOT NULL,
    "storage_path"      TEXT        NOT NULL,
    "upload_timestamp"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "processing_status" TEXT        NOT NULL DEFAULT 'pending',
    "page_count"        INTEGER,

    CONSTRAINT "health_uploads_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "health_uploads_document_id_key" UNIQUE ("document_id")
);

CREATE INDEX "health_uploads_user_email_idx" ON "health_uploads"("user_email");

-- CreateTable: ocr_jobs
CREATE TABLE "ocr_jobs" (
    "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID        NOT NULL,
    "status"      TEXT        NOT NULL DEFAULT 'queued',
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "error"       TEXT,

    CONSTRAINT "ocr_jobs_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "ocr_jobs_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "ocr_jobs_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

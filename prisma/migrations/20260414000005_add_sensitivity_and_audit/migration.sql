-- CreateTable: sensitivity_profiles
CREATE TABLE "sensitivity_profiles" (
    "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"       UUID        NOT NULL,
    "sensitivity_level" TEXT        NOT NULL,
    "privacy_tags"      TEXT[]      NOT NULL DEFAULT '{}',
    "flagged_bins"      TEXT[]      NOT NULL DEFAULT '{}',
    "tag_reasons"       JSONB       NOT NULL DEFAULT '{}',
    "tagged_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "sensitivity_profiles_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "sensitivity_profiles_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "sensitivity_profiles_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

-- CreateTable: document_access_logs
CREATE TABLE "document_access_logs" (
    "id"                SERIAL      NOT NULL,
    "document_id"       UUID        NOT NULL,
    "user_email"        TEXT        NOT NULL,
    "route"             TEXT        NOT NULL,
    "action"            TEXT        NOT NULL DEFAULT 'read',
    "sensitivity_level" TEXT        NOT NULL,
    "accessed_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "document_access_logs_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

CREATE INDEX "document_access_logs_document_id_idx" ON "document_access_logs"("document_id");
CREATE INDEX "document_access_logs_user_email_idx"  ON "document_access_logs"("user_email");
CREATE INDEX "document_access_logs_accessed_at_idx" ON "document_access_logs"("accessed_at");

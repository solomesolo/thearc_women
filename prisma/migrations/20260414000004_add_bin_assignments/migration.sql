-- CreateTable: bin_assignments
CREATE TABLE "bin_assignments" (
    "id"                       UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"              UUID        NOT NULL,
    "assigned_bins"            TEXT[]      NOT NULL DEFAULT '{}',
    "entity_bin_map"           JSONB       NOT NULL DEFAULT '[]',
    "classification_confidence" FLOAT      NOT NULL DEFAULT 0,
    "method_summary"           JSONB       NOT NULL DEFAULT '{}',
    "assigned_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "bin_assignments_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "bin_assignments_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "bin_assignments_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

CREATE INDEX "bin_assignments_document_id_idx"
    ON "bin_assignments"("document_id");

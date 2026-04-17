-- CreateTable: document_classifications
CREATE TABLE "document_classifications" (
    "id"                       UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"              UUID        NOT NULL,
    "document_type"            TEXT        NOT NULL,
    "secondary_document_types" TEXT[]      NOT NULL DEFAULT '{}',
    "confidence"               FLOAT       NOT NULL DEFAULT 0,
    "all_scores"               JSONB       NOT NULL DEFAULT '{}',
    "classified_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "document_classifications_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "document_classifications_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "document_classifications_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

CREATE INDEX "document_classifications_document_id_idx"
    ON "document_classifications"("document_id");

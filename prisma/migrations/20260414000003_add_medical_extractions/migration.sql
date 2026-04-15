-- CreateTable: medical_extractions
CREATE TABLE "medical_extractions" (
    "id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"          UUID        NOT NULL,
    "structured_entities"  JSONB       NOT NULL DEFAULT '[]',
    "extraction_confidence" FLOAT      NOT NULL DEFAULT 0,
    "missing_fields"       TEXT[]      NOT NULL DEFAULT '{}',
    "parsing_warnings"     TEXT[]      NOT NULL DEFAULT '{}',
    "extracted_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "medical_extractions_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "medical_extractions_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "medical_extractions_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

CREATE INDEX "medical_extractions_document_id_idx"
    ON "medical_extractions"("document_id");

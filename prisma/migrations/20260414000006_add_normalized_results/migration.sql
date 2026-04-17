-- CreateTable: normalized_results
CREATE TABLE "normalized_results" (
    "id"                      UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"             UUID        NOT NULL,
    "normalized_observations" JSONB       NOT NULL DEFAULT '[]',
    "total_observations"      INTEGER     NOT NULL DEFAULT 0,
    "active_observations"     INTEGER     NOT NULL DEFAULT 0,
    "superseded_count"        INTEGER     NOT NULL DEFAULT 0,
    "conversion_count"        INTEGER     NOT NULL DEFAULT 0,
    "missing_canonical"       INTEGER     NOT NULL DEFAULT 0,
    "normalized_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "normalized_results_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "normalized_results_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "normalized_results_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

CREATE INDEX "normalized_results_document_id_idx"
    ON "normalized_results"("document_id");

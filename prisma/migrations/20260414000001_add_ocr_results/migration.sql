-- CreateTable: ocr_results
CREATE TABLE "ocr_results" (
    "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
    "document_id"    UUID        NOT NULL,
    "ocr_status"     TEXT        NOT NULL,
    "raw_text"       TEXT        NOT NULL DEFAULT '',
    "page_count"     INTEGER     NOT NULL DEFAULT 0,
    "avg_confidence" FLOAT       NOT NULL DEFAULT 0,
    "processed_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "ocr_results_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "ocr_results_document_id_key" UNIQUE ("document_id"),
    CONSTRAINT "ocr_results_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

-- CreateTable: ocr_pages
CREATE TABLE "ocr_pages" (
    "id"          SERIAL      NOT NULL,
    "result_id"   UUID        NOT NULL,
    "page_number" INTEGER     NOT NULL,
    "raw_text"    TEXT        NOT NULL DEFAULT '',
    "confidence"  FLOAT       NOT NULL DEFAULT 0,
    "word_count"  INTEGER     NOT NULL DEFAULT 0,
    "is_low_conf" BOOLEAN     NOT NULL DEFAULT false,
    "blocks"      JSONB       NOT NULL DEFAULT '[]',

    CONSTRAINT "ocr_pages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ocr_pages_result_id_fkey"
        FOREIGN KEY ("result_id")
        REFERENCES "ocr_results"("id")
        ON DELETE CASCADE
);

CREATE INDEX "ocr_pages_result_id_idx" ON "ocr_pages"("result_id");

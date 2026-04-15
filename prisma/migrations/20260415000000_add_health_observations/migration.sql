-- CreateTable: health_observations (longitudinal time-series store)
-- One row per (document_id, observation_id) — deterministic upsert key.
-- observation_id is a 32-char SHA-256 prefix produced by normalizer.py:
--   SHA-256(document_id + canonical_name + date)[:32]
CREATE TABLE "health_observations" (
    "id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    "observation_id"       TEXT        NOT NULL,          -- 32-char hash from normalizer
    "document_id"          UUID        NOT NULL,
    "user_email"           TEXT        NOT NULL,
    "bin"                  TEXT        NOT NULL,          -- primary health bin slug
    "observation_date"     DATE,                          -- NULL if date not found in doc
    "metric_name"          TEXT,                          -- original test name as found
    "canonical_metric_name" TEXT,                         -- canonical slug from lookup table
    "display_name"         TEXT,                          -- human-friendly label
    "category"             TEXT        NOT NULL DEFAULT 'other',
    "value_text"           TEXT,                          -- raw string value
    "numeric_value"        DOUBLE PRECISION,              -- parsed float (NULL for text-only)
    "unit"                 TEXT,                          -- normalised unit (SI/standard)
    "original_unit"        TEXT,                          -- as printed in the source doc
    "reference_range"      TEXT,                          -- e.g. "70–100" in normalised unit
    "flag"                 TEXT,                          -- H | L | HH | LL | NULL
    "interpretation"       TEXT,                          -- brief clinical note
    "confidence_score"     DOUBLE PRECISION NOT NULL DEFAULT 0.5,  -- 0.0–1.0
    "sensitivity_level"    TEXT        NOT NULL DEFAULT 'standard', -- standard | sensitive | high_sensitivity
    "sensitivity_flag"     BOOLEAN     NOT NULL DEFAULT FALSE,
    "privacy_tags"         TEXT[]      NOT NULL DEFAULT '{}',
    "source_entity_index"  INTEGER,                       -- position in structured_entities[]
    "conversion_applied"   BOOLEAN     NOT NULL DEFAULT FALSE,
    "created_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "health_observations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "health_observations_doc_obs_key" UNIQUE ("document_id", "observation_id"),
    CONSTRAINT "health_observations_document_id_fkey"
        FOREIGN KEY ("document_id")
        REFERENCES "health_uploads"("document_id")
        ON DELETE CASCADE
);

-- Trend queries: metric over time for a user
CREATE INDEX "health_obs_user_metric_date_idx"
    ON "health_observations"("user_email", "canonical_metric_name", "observation_date");

-- Dashboard filters: user × bin
CREATE INDEX "health_obs_user_bin_idx"
    ON "health_observations"("user_email", "bin");

-- Privacy-aware queries
CREATE INDEX "health_obs_user_sensitivity_idx"
    ON "health_observations"("user_email", "sensitivity_level");

-- Gap detection scans
CREATE INDEX "health_obs_date_idx"
    ON "health_observations"("observation_date");

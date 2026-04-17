-- CreateTable: care_gap_flags
-- Stores computed intervention / care gap flags per (user_email, canonical_metric_name).
-- Regenerated each time the intervention planner runs for a user; ON CONFLICT replaces.
CREATE TABLE "care_gap_flags" (
    "id"                     UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_email"             TEXT        NOT NULL,
    "canonical_metric_name"  TEXT        NOT NULL,
    "category"               TEXT        NOT NULL,
    "label"                  TEXT        NOT NULL,    -- human-readable metric label
    "gap_status"             TEXT        NOT NULL,    -- never_recorded | overdue | due_soon | current
    "priority"               TEXT        NOT NULL DEFAULT 'routine', -- routine | surveillance | urgent
    "last_observed_date"     DATE,                   -- NULL if never_recorded
    "expected_interval_days" INTEGER     NOT NULL,
    "next_expected_date"     DATE,                   -- NULL if never_recorded
    "days_overdue"           INTEGER,                -- NULL unless gap_status = overdue
    "days_until_due"         INTEGER,                -- NULL unless gap_status = due_soon | current
    "suggested_action"       TEXT        NOT NULL,
    "guideline_source"       TEXT        NOT NULL DEFAULT '',
    "computed_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "care_gap_flags_pkey"             PRIMARY KEY ("id"),
    CONSTRAINT "care_gap_flags_user_metric_key"  UNIQUE ("user_email", "canonical_metric_name")
);

-- Fast per-user queries
CREATE INDEX "care_gap_flags_user_email_idx"
    ON "care_gap_flags"("user_email");

-- Dashboard: filter by status + priority
CREATE INDEX "care_gap_flags_user_status_idx"
    ON "care_gap_flags"("user_email", "gap_status", "priority");

-- Category-based queries
CREATE INDEX "care_gap_flags_user_category_idx"
    ON "care_gap_flags"("user_email", "category");

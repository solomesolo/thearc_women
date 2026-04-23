-- Performance: compound indexes on hot query paths
-- Reduces full-index-scan cost on every dashboard, status, progress, and health-score load.

-- recommendation_runs: status engine queries (userEmail, profileSnapshotId) together
CREATE INDEX IF NOT EXISTS "recommendation_runs_user_profile_idx"
  ON "recommendation_runs" ("user_email", "profile_snapshot_id");

-- status_snapshots: getDashboardSummary, calculateHealthScore, timelineEngine all filter
-- by (userEmail, bundleKey) and order by calculatedAt DESC
CREATE INDEX IF NOT EXISTS "status_snapshots_user_bundle_idx"
  ON "status_snapshots" ("user_email", "bundle_key");

CREATE INDEX IF NOT EXISTS "status_snapshots_user_calc_desc_idx"
  ON "status_snapshots" ("user_email", "calculated_at" DESC);

-- recommendation_progress: getDashboardSummary and progressService filter (userEmail, bundleKey)
CREATE INDEX IF NOT EXISTS "recommendation_progress_user_bundle_idx"
  ON "recommendation_progress" ("user_email", "bundle_key");

-- user_health_scores: findFirst by (userEmail) ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "user_health_scores_user_created_desc_idx"
  ON "user_health_scores" ("user_email", "created_at" DESC);

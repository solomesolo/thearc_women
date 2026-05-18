-- CreateTable: connected_calendars
CREATE TABLE "connected_calendars" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMPTZ,
    "ical_feed_token" TEXT,
    "calendar_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connected_calendars_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "connected_calendars_ical_feed_token_key" ON "connected_calendars"("ical_feed_token");
CREATE INDEX "connected_calendars_user_email_idx" ON "connected_calendars"("user_email");

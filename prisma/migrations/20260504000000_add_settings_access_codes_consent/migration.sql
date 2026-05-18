-- CreateTable: user_settings
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "email_reminders" BOOLEAN NOT NULL DEFAULT true,
    "calendar_reminders" BOOLEAN NOT NULL DEFAULT false,
    "weekly_summary" BOOLEAN NOT NULL DEFAULT true,
    "default_reminder_timing" TEXT NOT NULL DEFAULT 'next_week',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_settings_user_email_key" ON "user_settings"("user_email");

-- CreateTable: access_codes
CREATE TABLE "access_codes" (
    "id" TEXT NOT NULL,
    "owner_email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "used_by_email" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "access_codes_code_key" ON "access_codes"("code");
CREATE UNIQUE INDEX "access_codes_token_key" ON "access_codes"("token");
CREATE INDEX "access_codes_owner_email_idx" ON "access_codes"("owner_email");

-- CreateTable: user_consents
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "given_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_consents_user_email_key" ON "user_consents"("user_email");

-- CreateTable: deletion_requests
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "deletion_requests_user_email_key" ON "deletion_requests"("user_email");

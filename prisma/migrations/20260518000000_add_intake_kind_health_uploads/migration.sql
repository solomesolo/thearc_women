-- Add intake_kind column to health_uploads
-- Distinguishes lab uploads from screening uploads (used by health-wallet sync)
ALTER TABLE "health_uploads" ADD COLUMN "intake_kind" TEXT;

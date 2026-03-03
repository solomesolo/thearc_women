-- AlterTable Article: add admin/edit fields
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "studyTypes" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "consensusStatus" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "lensMapping" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable ArticleSection: add preview for gated
ALTER TABLE "ArticleSection" ADD COLUMN IF NOT EXISTS "preview" TEXT;

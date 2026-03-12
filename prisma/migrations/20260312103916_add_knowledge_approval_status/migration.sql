-- AlterTable
ALTER TABLE "knowledge_articles" ADD COLUMN     "approvalStatus" TEXT DEFAULT 'pending';

-- Existing articles: treat as already approved so they stay visible on the blog
UPDATE "knowledge_articles" SET "approvalStatus" = 'approved';

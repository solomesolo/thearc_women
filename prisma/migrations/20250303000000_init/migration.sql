-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TaxonomyType" AS ENUM ('lifeStage', 'symptom', 'bodySystem', 'preventiveFocus', 'trending', 'biomarker', 'hormone', 'goal');

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "pillar" TEXT,
    "category" TEXT,
    "evidenceLevel" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSection" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "sectionIndex" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "isGated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSource" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "evidenceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyTag" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "TaxonomyType" NOT NULL,

    CONSTRAINT "TaxonomyTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTagJoin" (
    "articleId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ArticleTagJoin_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "ArticleSection_articleId_sectionIndex_idx" ON "ArticleSection"("articleId", "sectionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyTag_slug_key" ON "TaxonomyTag"("slug");

-- CreateIndex
CREATE INDEX "ArticleTagJoin_tagId_idx" ON "ArticleTagJoin"("tagId");

-- AddForeignKey
ALTER TABLE "ArticleSection" ADD CONSTRAINT "ArticleSection_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSource" ADD CONSTRAINT "ArticleSource_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTagJoin" ADD CONSTRAINT "ArticleTagJoin_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTagJoin" ADD CONSTRAINT "ArticleTagJoin_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TaxonomyTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

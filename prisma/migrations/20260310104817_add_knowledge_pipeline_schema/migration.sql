-- CreateTable
CREATE TABLE "raw_medical_articles" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "journal" TEXT,
    "publicationDate" TIMESTAMP(3),
    "abstract" TEXT,
    "fullText" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doi" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "raw_medical_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" UUID NOT NULL,
    "rawArticleId" UUID,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "keyFindings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "biologicalSystems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "biomarkers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rootCauses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preventiveTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interventionTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lifeStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_content" (
    "id" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "scienceExplained" TEXT,
    "patternsAndRootCauses" TEXT,
    "preventiveInsights" TEXT,
    "clinicalContext" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_labels" (
    "id" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "labelType" TEXT NOT NULL,
    "labelValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_labels_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_rawArticleId_fkey" FOREIGN KEY ("rawArticleId") REFERENCES "raw_medical_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_content" ADD CONSTRAINT "knowledge_content_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_labels" ADD CONSTRAINT "article_labels_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

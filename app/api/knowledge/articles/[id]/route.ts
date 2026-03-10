/**
 * GET /api/knowledge/articles/[id]
 * Single knowledge_article with contents and labels.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: { contents: true, labels: true },
  });
  if (!article) return new Response(null, { status: 404 });

  return Response.json({
    id: article.id,
    rawArticleId: article.rawArticleId,
    title: article.title,
    summary: article.summary,
    keyFindings: article.keyFindings,
    biologicalSystems: article.biologicalSystems,
    symptoms: article.symptoms,
    biomarkers: article.biomarkers,
    rootCauses: article.rootCauses,
    preventiveTopics: article.preventiveTopics,
    interventionTypes: article.interventionTypes,
    lifeStages: article.lifeStages,
    evidenceLevel: article.evidenceLevel,
    createdAt: article.createdAt?.toISOString() ?? null,
    contents: article.contents.map((c) => ({
      id: c.id,
      scienceExplained: c.scienceExplained,
      patternsAndRootCauses: c.patternsAndRootCauses,
      preventiveInsights: c.preventiveInsights,
      clinicalContext: c.clinicalContext,
      qualityScore: c.qualityScore,
    })),
    labels: article.labels.map((l) => ({ type: l.labelType, value: l.labelValue })),
  });
}

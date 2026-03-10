/**
 * GET /api/knowledge/articles
 * List knowledge_articles. Query: ?label=symptom:Chronic Fatigue | ?life_stage=reproductive
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labelParam = searchParams.get("label"); // e.g. "symptom:Chronic Fatigue"
    const lifeStage = searchParams.get("life_stage");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (labelParam) {
      const [labelType, labelValue] = labelParam.split(":").map((s) => s?.trim());
      if (labelType && labelValue) {
        where.labels = { some: { labelType, labelValue } };
      }
    }

    if (lifeStage) {
      where.lifeStages = { has: lifeStage };
    }

    const [articles, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: { labels: true },
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);

    const data = articles.map((a) => ({
      id: a.id,
      rawArticleId: a.rawArticleId,
      title: a.title,
      summary: a.summary,
      keyFindings: a.keyFindings,
      biologicalSystems: a.biologicalSystems,
      symptoms: a.symptoms,
      biomarkers: a.biomarkers,
      rootCauses: a.rootCauses,
      preventiveTopics: a.preventiveTopics,
      interventionTypes: a.interventionTypes,
      lifeStages: a.lifeStages,
      evidenceLevel: a.evidenceLevel,
      createdAt: a.createdAt?.toISOString() ?? null,
      labels: a.labels.map((l) => ({ type: l.labelType, value: l.labelValue })),
    }));

    return Response.json({ articles: data, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/knowledge/articles]", err);
    return Response.json(
      { error: "Failed to list articles", message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge/personalized
 * Body: { life_stage?, symptoms?: string[], biomarkers?: string[], root_causes?: string[] }
 * Ranking: symptom × 3, root_cause × 4, life_stage × 2, biomarker × 1. Returns top relevant articles.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const WEIGHT = { symptom: 3, root_cause: 4, life_stage: 2, biomarker: 1 } as const;

export async function POST(request: NextRequest) {
  let body: { life_stage?: string; symptoms?: string[]; biomarkers?: string[]; root_causes?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const lifeStage = body.life_stage?.trim();
  const symptoms = Array.isArray(body.symptoms) ? body.symptoms.map((s) => String(s).trim()).filter(Boolean) : [];
  const biomarkers = Array.isArray(body.biomarkers) ? body.biomarkers.map((b) => String(b).trim()).filter(Boolean) : [];
  const rootCauses = Array.isArray(body.root_causes) ? body.root_causes.map((r) => String(r).trim()).filter(Boolean) : [];

  const articles = await prisma.knowledgeArticle.findMany({
    include: { labels: true },
  });

  const scored = articles.map((a) => {
    let score = 0;
    const labelSet = new Set(a.labels.map((l) => `${l.labelType}:${l.labelValue}`));
    for (const s of symptoms) {
      if (a.symptoms.some((x) => x.toLowerCase().includes(s.toLowerCase())) || labelSet.has(`symptom:${s}`)) score += WEIGHT.symptom;
    }
    for (const r of rootCauses) {
      if (a.rootCauses.some((x) => x.toLowerCase().includes(r.toLowerCase())) || labelSet.has(`root_cause:${r}`)) score += WEIGHT.root_cause;
    }
    if (lifeStage && (a.lifeStages.includes(lifeStage) || labelSet.has(`life_stage:${lifeStage}`))) score += WEIGHT.life_stage;
    for (const b of biomarkers) {
      if (a.biomarkers.some((x) => x.toLowerCase().includes(b.toLowerCase())) || labelSet.has(`biomarker:${b}`)) score += WEIGHT.biomarker;
    }
    return { article: a, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 20);

  const data = top.map(({ article: a, score }) => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    evidenceLevel: a.evidenceLevel,
    score,
    labels: a.labels.map((l) => ({ type: l.labelType, value: l.labelValue })),
  }));

  return Response.json({ articles: data });
}

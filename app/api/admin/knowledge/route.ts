/**
 * GET /api/admin/knowledge
 * List pipeline-generated blog articles (Article where rawArticleId is set).
 * status=pending (draft, need approval) | approved (published) | all
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return new Response(null, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    const where: { rawArticleId: { not: null }; isPublished?: boolean } = {
      rawArticleId: { not: null },
    };
    if (status === "pending") where.isPublished = false;
    else if (status === "approved") where.isPublished = true;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: { tagJoins: { include: { tag: true } } },
      }),
      prisma.article.count({ where }),
    ]);

    const data = articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      isPublished: a.isPublished,
      evidenceLevel: a.evidenceLevel,
      category: a.category,
      createdAt: a.createdAt?.toISOString() ?? null,
      tags: a.tagJoins.map((j) => ({ slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
    }));

    return Response.json({ articles: data, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/admin/knowledge]", err);
    return Response.json(
      { error: "Failed to list pipeline articles", message },
      { status: 500 }
    );
  }
}

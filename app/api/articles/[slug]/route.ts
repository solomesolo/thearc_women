import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/articles/[slug]
 * Returns single article with sections 1–7 and sources.
 * 404 if not published (preview + auth can be added later via query param).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, isPublished: true },
    include: {
      sections: { orderBy: { sectionIndex: "asc" } },
      sources: true,
      tagJoins: { include: { tag: true } },
    },
  });
  if (!article) return new Response(null, { status: 404 });

  const res = Response.json({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    pillar: article.pillar,
    category: article.category,
    evidenceLevel: article.evidenceLevel,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    readingTimeMinutes: article.readingTimeMinutes ?? null,
    sections: article.sections.map((s) => ({
      sectionIndex: s.sectionIndex,
      title: s.title,
      body: s.body,
      isGated: s.isGated,
    })),
    sources: article.sources.map((s) => ({
      label: s.label,
      url: s.url,
      evidenceNote: s.evidenceNote,
    })),
    tags: article.tagJoins.map((j) => ({
      slug: j.tag.slug,
      label: j.tag.label,
      type: j.tag.type,
    })),
  });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}

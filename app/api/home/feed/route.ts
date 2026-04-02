import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreArticle } from "@/lib/scoreArticle";

/**
 * GET /api/home/feed
 * Returns title + 3 articles for the homepage knowledge block.
 * If user has a profile with generatedTags → personalized title + recommended (sort=relevant).
 * Else → "Clarity in a world of health noise" + latest 3.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const profile = email
    ? await prisma.userProfile.findUnique({
        where: { email },
      })
    : null;
  const hasProfile = !!(profile?.generatedTags?.length);

  const where = { isPublished: true, isArchived: false };

  if (hasProfile && profile) {
    const all = await prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }],
      take: 50,
      include: {
        tagJoins: { include: { tag: true } },
        sections: { select: { isGated: true } },
      },
    });
    const scored = all.map((a) => ({
      article: a,
      score: scoreArticle(
        { tags: a.tagJoins.map((j) => ({ slug: j.tag.slug })) },
        { generatedTags: profile.generatedTags }
      ),
    }));
    scored.sort(
      (a, b) =>
        b.score - a.score ||
        (b.article.publishedAt?.getTime() ?? 0) - (a.article.publishedAt?.getTime() ?? 0)
    );
    const articles = scored.slice(0, 3).map((s) => s.article);
    const data = articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      evidenceLevel: a.evidenceLevel,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      readingTimeMinutes: a.readingTimeMinutes ?? null,
      hasGatedContent: a.sections?.some((s) => s.isGated) ?? false,
      tags: a.tagJoins.map((j) => ({ slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
    }));
    return Response.json({
      hasProfile: true,
      title: "My Health Dashboard — picks for you",
      articles: data,
    });
  }

  const articles = await prisma.article.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }],
    take: 3,
    include: {
      tagJoins: { include: { tag: true } },
      sections: { select: { isGated: true } },
    },
  });
  const data = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    evidenceLevel: a.evidenceLevel,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    readingTimeMinutes: a.readingTimeMinutes ?? null,
    hasGatedContent: a.sections?.some((s) => s.isGated) ?? false,
    tags: a.tagJoins.map((j) => ({ slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
  }));
  return Response.json({
    hasProfile: false,
    title: "Clarity in a world of health noise",
    articles: data,
  });
}

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreArticle } from "@/lib/scoreArticle";

const TAXONOMY_ARRAY_PARAMS = [
  "lifeStage",
  "symptom",
  "bodySystem",
  "preventiveFocus",
  "trending",
  "biomarker",
  "hormone",
  "goal",
  "rootCause",
  "interventionType",
  "evidenceLevel",
  "contentAccess",
] as const;

type SortOption = "latest" | "relevant";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const pillar = searchParams.get("pillar") || undefined;
  const category = searchParams.get("category") || undefined;
  const evidenceLevel = searchParams.getAll("evidenceLevel");
  const sort = (searchParams.get("sort") as SortOption) || "latest";
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const tagFilters: { type: string; slugs: string[] }[] = [];
  for (const type of TAXONOMY_ARRAY_PARAMS) {
    const slugs = searchParams.getAll(type);
    if (slugs.length) tagFilters.push({ type, slugs });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isPublished: true,
    isArchived: false,
  };

  if (pillar) where.pillar = pillar;
  if (category) where.category = category;
  if (evidenceLevel.length) where.evidenceLevel = { in: evidenceLevel };

  if (tagFilters.length > 0) {
    where.AND = (where.AND as object[]) || [];
    const tagType = (t: string) =>
      t as "lifeStage" | "symptom" | "bodySystem" | "preventiveFocus" | "trending" | "biomarker" | "hormone" | "goal" | "rootCause" | "interventionType" | "evidenceLevel" | "contentAccess";
    for (const { type, slugs } of tagFilters) {
      (where.AND as object[]).push({
        tagJoins: {
          some: { tag: { type: tagType(type), slug: { in: slugs } } },
        },
      });
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      {
        tagJoins: {
          some: {
            tag: {
              OR: [
                { label: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  const useRelevantSort = sort === "relevant";
  const session = useRelevantSort ? await getServerSession(authOptions) : null;
  const profile = session?.user?.email
    ? await prisma.userProfile.findUnique({
        where: { email: session.user.email },
      })
    : null;

  if (useRelevantSort && profile?.generatedTags?.length) {
    const all = await prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }],
      include: { tagJoins: { include: { tag: true } } },
    });
    const scored = all.map((a) => ({
      article: a,
      score: scoreArticle(
        { tags: a.tagJoins.map((j) => ({ slug: j.tag.slug })) },
        { generatedTags: profile.generatedTags }
      ),
    }));
    scored.sort((a, b) => b.score - a.score || (b.article.publishedAt?.getTime() ?? 0) - (a.article.publishedAt?.getTime() ?? 0));
    const total = scored.length;
    const paginated = scored.slice(offset, offset + limit).map((s) => s.article);
    const withSections = await prisma.article.findMany({
      where: { id: { in: paginated.map((x) => x.id) } },
      select: { id: true, sections: { select: { isGated: true } } },
    });
    const gatedMap = Object.fromEntries(
      withSections.map((x) => [x.id, x.sections?.some((s) => s.isGated) ?? false])
    );
    const data = paginated.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      pillar: a.pillar,
      category: a.category,
      evidenceLevel: a.evidenceLevel,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      readingTimeMinutes: a.readingTimeMinutes ?? null,
      hasGatedContent: gatedMap[a.id] ?? false,
      tags: a.tagJoins.map((j) => ({ slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
    }));
    return Response.json({ articles: data, total });
  }

  const orderBy = [{ publishedAt: "desc" as const }];
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        tagJoins: { include: { tag: true } },
        sections: { select: { isGated: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const data = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    pillar: a.pillar,
    category: a.category,
    evidenceLevel: a.evidenceLevel,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    readingTimeMinutes: a.readingTimeMinutes ?? null,
    hasGatedContent: a.sections?.some((s) => s.isGated) ?? false,
    tags: a.tagJoins.map((j) => ({ slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
  }));

  const res = Response.json({ articles: data, total });
  if (!useRelevantSort) {
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  }
  return res;
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/adminAuth";
import { slugify } from "@/lib/slugify";

type Status = "draft" | "published" | "archived";

/** GET /api/admin/articles — list all articles (any status) for admin. */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as Status | null;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status === "archived") where.isArchived = true;
  else if (status === "published") {
    where.isPublished = true;
    where.isArchived = false;
  } else if (status === "draft") {
    where.isPublished = false;
    where.isArchived = false;
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
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
    status: a.isArchived ? "archived" : a.isPublished ? "published" : "draft",
    pillar: a.pillar,
    evidenceLevel: a.evidenceLevel,
    updatedAt: a.updatedAt.toISOString(),
    publishedAt: a.publishedAt?.toISOString() ?? null,
    tags: a.tagJoins.map((j) => ({ slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
  }));

  return Response.json({ articles: data, total });
}

/** POST /api/admin/articles — create draft article. */
export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  let body: {
    title?: string;
    slug?: string;
    excerpt?: string;
    pillar?: string;
    category?: string;
    evidenceLevel?: string;
    studyTypes?: string;
    consensusStatus?: string;
    coverImageUrl?: string;
    tagIds?: number[];
    lensMapping?: string[];
    sources?: { label: string; url?: string; evidenceNote?: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim();
  if (!title || !excerpt) {
    return Response.json(
      { error: "title and excerpt are required" },
      { status: 400 }
    );
  }

  let rawSlug = body.slug?.trim() || slugify(title);
  rawSlug = rawSlug || "article";
  let slug = rawSlug;
  let exists = await prisma.article.findUnique({ where: { slug } });
  let suffix = 1;
  while (exists) {
    slug = `${rawSlug}-${suffix}`;
    suffix++;
    exists = await prisma.article.findUnique({ where: { slug } });
  }

  const tagIds = body.tagIds ?? [];
  const lensMapping = body.lensMapping ?? [];
  const sources = body.sources ?? [];

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      excerpt,
      pillar: body.pillar?.trim() || null,
      category: body.category?.trim() || null,
      evidenceLevel: body.evidenceLevel?.trim() || null,
      studyTypes: body.studyTypes?.trim() || null,
      consensusStatus: body.consensusStatus?.trim() || null,
      coverImageUrl: body.coverImageUrl?.trim() || null,
      lensMapping,
      isPublished: false,
      isArchived: false,
      tagJoins: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
      sources:
        sources.length > 0
          ? {
              create: sources.map((s) => ({
                label: s.label?.trim() ?? "",
                url: s.url?.trim() || null,
                evidenceNote: s.evidenceNote?.trim() || null,
              })),
            }
          : undefined,
    },
    include: {
      tagJoins: { include: { tag: true } },
      sources: true,
      sections: { orderBy: { sectionIndex: "asc" } },
    },
  });

  // Ensure 7 sections exist
  const existingSections = article.sections.length;
  if (existingSections < 7) {
    for (let i = existingSections; i < 7; i++) {
      await prisma.articleSection.create({
        data: {
          articleId: article.id,
          sectionIndex: i + 1,
          title: null,
          body: "",
          isGated: i >= 5,
          preview: null,
        },
      });
    }
  }

  const refreshed = await prisma.article.findUnique({
    where: { id: article.id },
    include: {
      tagJoins: { include: { tag: true } },
      sources: true,
      sections: { orderBy: { sectionIndex: "asc" } },
    },
  });

  return Response.json(refreshed);
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/adminAuth";
import { computeReadingTimeMinutes } from "@/lib/readingTime";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/articles/[id] — full article for edit (sections, sources, tags). */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 400 });

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { sectionIndex: "asc" } },
      sources: true,
      tagJoins: { include: { tag: true } },
    },
  });
  if (!article) return new Response(null, { status: 404 });

  return Response.json({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    pillar: article.pillar,
    category: article.category,
    evidenceLevel: article.evidenceLevel,
    studyTypes: article.studyTypes,
    consensusStatus: article.consensusStatus,
    coverImageUrl: article.coverImageUrl,
    lensMapping: article.lensMapping,
    isPublished: article.isPublished,
    isArchived: article.isArchived,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    sections: article.sections.map((s) => ({
      id: s.id,
      sectionIndex: s.sectionIndex,
      title: s.title,
      body: s.body,
      isGated: s.isGated,
      preview: s.preview,
    })),
    sources: article.sources.map((s) => ({
      id: s.id,
      label: s.label,
      url: s.url,
      evidenceNote: s.evidenceNote,
    })),
    tags: article.tagJoins.map((j) => ({ id: j.tag.id, slug: j.tag.slug, label: j.tag.label, type: j.tag.type })),
  });
}

/** PUT /api/admin/articles/[id] — update metadata (and tags/sources). */
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 400 });

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
    sources?: { id?: number; label: string; url?: string; evidenceNote?: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return new Response(null, { status: 404 });

  const title = body.title?.trim() ?? article.title;
  const excerpt = body.excerpt?.trim() ?? article.excerpt;
  if (!title || !excerpt) {
    return Response.json({ error: "title and excerpt are required" }, { status: 400 });
  }

  let slug = body.slug?.trim() ?? article.slug;
  if (slug !== article.slug) {
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      return Response.json({ error: "slug already in use" }, { status: 400 });
    }
  }

  // Replace tag joins
  const tagIds = body.tagIds ?? (await prisma.articleTagJoin.findMany({ where: { articleId: id } })).map((j) => j.tagId);
  await prisma.articleTagJoin.deleteMany({ where: { articleId: id } });
  if (tagIds.length > 0) {
    await prisma.articleTagJoin.createMany({
      data: tagIds.map((tagId) => ({ articleId: id, tagId })),
      skipDuplicates: true,
    });
  }

  // Replace sources: delete all, create from body
  const sources = body.sources ?? [];
  await prisma.articleSource.deleteMany({ where: { articleId: id } });
  if (sources.length > 0) {
    await prisma.articleSource.createMany({
      data: sources.map((s) => ({
        articleId: id,
        label: s.label?.trim() ?? "",
        url: s.url?.trim() || null,
        evidenceNote: s.evidenceNote?.trim() || null,
      })),
    });
  }

  await prisma.article.update({
    where: { id },
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
      lensMapping: body.lensMapping ?? article.lensMapping,
    },
  });

  const withSections = await prisma.article.findUnique({
    where: { id },
    include: { sections: { orderBy: { sectionIndex: "asc" } } },
  });
  if (withSections) {
    const minutes = computeReadingTimeMinutes(
      withSections.excerpt,
      withSections.sections.map((s) => s.body)
    );
    await prisma.article.update({ where: { id }, data: { readingTimeMinutes: minutes } });
  }

  const updated = await prisma.article.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { sectionIndex: "asc" } },
      sources: true,
      tagJoins: { include: { tag: true } },
    },
  });
  return Response.json(updated);
}

/** PATCH /api/admin/articles/[id] — publish, unpublish, archive, or duplicate. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 400 });

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { id },
    include: { sections: true, sources: true, tagJoins: true },
  });
  if (!article) return new Response(null, { status: 404 });

  const action = body.action as string | undefined;

  if (action === "publish") {
    const sectionBodies = article.sections.map((s) => s.body);
    const readingTime = computeReadingTimeMinutes(article.excerpt, sectionBodies);
    await prisma.article.update({
      where: { id },
      data: {
        isPublished: true,
        isArchived: false,
        publishedAt: new Date(),
        readingTimeMinutes: readingTime,
      },
    });
    const updated = await prisma.article.findUnique({ where: { id } });
    return Response.json(updated);
  }

  if (action === "unpublish") {
    await prisma.article.update({
      where: { id },
      data: { isPublished: false },
    });
    const updated = await prisma.article.findUnique({ where: { id } });
    return Response.json(updated);
  }

  if (action === "archive") {
    await prisma.article.update({
      where: { id },
      data: { isArchived: true, isPublished: false },
    });
    const updated = await prisma.article.findUnique({ where: { id } });
    return Response.json(updated);
  }

  if (action === "unarchive") {
    await prisma.article.update({
      where: { id },
      data: { isArchived: false },
    });
    const updated = await prisma.article.findUnique({ where: { id } });
    return Response.json(updated);
  }

  if (action === "duplicate") {
    const baseSlug = article.slug + "-copy";
    let slug = baseSlug;
    let n = 1;
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n}`;
      n++;
    }
    const created = await prisma.article.create({
      data: {
        slug,
        title: article.title + " (copy)",
        excerpt: article.excerpt,
        pillar: article.pillar,
        category: article.category,
        evidenceLevel: article.evidenceLevel,
        studyTypes: article.studyTypes,
        consensusStatus: article.consensusStatus,
        coverImageUrl: article.coverImageUrl,
        lensMapping: article.lensMapping,
        isPublished: false,
        isArchived: false,
        publishedAt: null,
      },
    });
    await prisma.articleSection.createMany({
      data: article.sections.map((s) => ({
        articleId: created.id,
        sectionIndex: s.sectionIndex,
        title: s.title,
        body: s.body,
        isGated: s.isGated,
        preview: s.preview,
      })),
    });
    await prisma.articleSource.createMany({
      data: article.sources.map((s) => ({
        articleId: created.id,
        label: s.label,
        url: s.url,
        evidenceNote: s.evidenceNote,
      })),
    });
    await prisma.articleTagJoin.createMany({
      data: article.tagJoins.map((j) => ({ articleId: created.id, tagId: j.tagId })),
    });
    const duplicated = await prisma.article.findUnique({
      where: { id: created.id },
      include: {
        sections: { orderBy: { sectionIndex: "asc" } },
        sources: true,
        tagJoins: { include: { tag: true } },
      },
    });
    return Response.json(duplicated);
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

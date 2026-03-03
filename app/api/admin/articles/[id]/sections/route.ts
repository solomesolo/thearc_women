import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/adminAuth";
import { computeReadingTimeMinutes } from "@/lib/readingTime";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/articles/[id]/sections — update one section by sectionIndex. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 400 });

  let body: { sectionIndex: number; title?: string | null; body?: string; isGated?: boolean; preview?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sectionIndex = Number(body.sectionIndex);
  if (!Number.isInteger(sectionIndex) || sectionIndex < 1 || sectionIndex > 7) {
    return Response.json({ error: "sectionIndex must be 1–7" }, { status: 400 });
  }

  const section = await prisma.articleSection.findFirst({
    where: { articleId: id, sectionIndex },
  });
  if (!section) return new Response(null, { status: 404 });

  const isGated = body.isGated ?? section.isGated;
  const preview = body.preview?.trim() ?? section.preview ?? null;
  if (isGated && !preview) {
    return Response.json(
      { error: "Preview text is required for gated sections (6–7)" },
      { status: 400 }
    );
  }

  const updated = await prisma.articleSection.update({
    where: { id: section.id },
    data: {
      ...(body.title !== undefined && { title: body.title?.trim() || null }),
      ...(body.body !== undefined && { body: body.body }),
      isGated,
      ...(body.preview !== undefined && { preview: body.preview?.trim() || null }),
    },
  });

  const article = await prisma.article.findUnique({
    where: { id },
    include: { sections: { orderBy: { sectionIndex: "asc" } } },
  });
  if (article) {
    const minutes = computeReadingTimeMinutes(
      article.excerpt,
      article.sections.map((s) => s.body)
    );
    await prisma.article.update({ where: { id }, data: { readingTimeMinutes: minutes } });
  }

  return Response.json(updated);
}

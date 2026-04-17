/**
 * GET /api/health-data/clinical-notes
 *
 * Clinical notes records (non-lab, non-imaging) for the authenticated user.
 * Supports pagination:
 *   ?page=1&pageSize=20
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10)));

  const prisma = getPrisma();
  const where = { userEmail: session.user.email };

  const [total, rows] = await Promise.all([
    prisma.clinicalNoteRecord.count({ where }),
    prisma.clinicalNoteRecord.findMany({
      where,
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        documentId: true,
        reportDate: true,
        documentType: true,
        summary: true,
        diagnoses: true,
        recommendations: true,
        medications: true,
        rawNotes: true,
        source: true,
        parsingWarnings: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    records: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * DELETE /api/health-data/clinical-notes
 *
 * Body:
 *   { documentIds: string[] }
 *
 * Deletes selected clinical note records for the authenticated user only.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const documentIds =
    typeof body === "object" && body && "documentIds" in body
      ? (body as { documentIds?: unknown }).documentIds
      : undefined;

  if (!Array.isArray(documentIds) || documentIds.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "documentIds must be an array of strings" },
      { status: 422 }
    );
  }

  if (documentIds.length === 0) {
    return NextResponse.json({ ok: true, deletedCount: 0 });
  }

  const prisma = getPrisma();
  const result = await prisma.clinicalNoteRecord.deleteMany({
    where: {
      userEmail: session.user.email,
      documentId: { in: documentIds },
    },
  });

  return NextResponse.json({ ok: true, deletedCount: result.count });
}


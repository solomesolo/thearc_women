/**
 * GET /api/health-data/clinical-notes/[documentId]
 *
 * Returns the clinical note record for a specific document (if present),
 * for the authenticated user only.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const prisma = getPrisma();
  const rec = await prisma.clinicalNoteRecord.findFirst({
    where: { documentId, userEmail: session.user.email },
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
  });

  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rec);
}


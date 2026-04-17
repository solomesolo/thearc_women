/**
 * GET /api/health-data/summary
 *
 * Small dashboard summary of extracted documents + trends entry points.
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
  const limit = Math.min(10, Math.max(1, parseInt(url.searchParams.get("limit") ?? "5", 10)));

  const prisma = getPrisma();
  const userEmail = session.user.email;

  const [uploads, observationsCount, imagingCount, lastObservation] = await Promise.all([
    prisma.healthUpload.findMany({
      where: { userEmail },
      orderBy: { uploadTimestamp: "desc" },
      take: limit,
      select: {
        documentId: true,
        fileName: true,
        mimeType: true,
        uploadTimestamp: true,
        processingStatus: true,
        classification: { select: { documentType: true, confidence: true } },
      },
    }),
    prisma.healthObservation.count({ where: { userEmail } }),
    prisma.imagingRecord.count({ where: { userEmail } }),
    prisma.healthObservation.findFirst({
      where: { userEmail, observationDate: { not: null } },
      orderBy: { observationDate: "desc" },
      select: { observationDate: true },
    }),
  ]);

  return NextResponse.json({
    observationsCount,
    imagingCount,
    lastObservationDate: lastObservation?.observationDate?.toISOString() ?? null,
    recentUploads: uploads.map((u) => ({
      documentId: u.documentId,
      fileName: u.fileName,
      mimeType: u.mimeType,
      uploadedAt: u.uploadTimestamp.toISOString(),
      processingStatus: u.processingStatus,
      documentType: u.classification?.documentType ?? null,
      documentTypeConfidence: u.classification?.confidence ?? null,
    })),
  });
}


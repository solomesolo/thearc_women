/**
 * GET /api/health-data/overview
 *
 * Dashboard-style overview:
 * - health score (simple heuristic)
 * - key alerts (recent flagged biomarkers)
 * - recent activity (uploads)
 * - last updated date
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const ALERT_FLAGS = ["H", "HH", "L", "LL", "CRITICAL", "PANIC"] as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limitAlerts = Math.min(10, Math.max(1, parseInt(url.searchParams.get("alerts") ?? "3", 10)));
  const limitUploads = Math.min(10, Math.max(1, parseInt(url.searchParams.get("uploads") ?? "5", 10)));

  const prisma = getPrisma();
  const userEmail = session.user.email;

  const [flagged, lastObservation, uploads] = await Promise.all([
    prisma.healthObservation.findMany({
      where: { userEmail, flag: { in: [...ALERT_FLAGS] } },
      orderBy: [{ observationDate: "desc" }, { updatedAt: "desc" }],
      take: limitAlerts,
      select: {
        canonicalMetricName: true,
        displayName: true,
        flag: true,
        numericValue: true,
        unit: true,
        referenceRange: true,
        observationDate: true,
        category: true,
      },
    }),
    prisma.healthObservation.findFirst({
      where: { userEmail, observationDate: { not: null } },
      orderBy: { observationDate: "desc" },
      select: { observationDate: true },
    }),
    prisma.healthUpload.findMany({
      where: { userEmail },
      orderBy: { uploadTimestamp: "desc" },
      take: limitUploads,
      select: {
        documentId: true,
        fileName: true,
        uploadTimestamp: true,
        processingStatus: true,
        classification: { select: { documentType: true } },
      },
    }),
  ]);

  const alertsCount = flagged.length;
  const healthScore = Math.max(40, 100 - alertsCount * 12); // simple, optional

  return NextResponse.json({
    healthScore,
    lastUpdatedDate: lastObservation?.observationDate?.toISOString() ?? null,
    keyAlerts: flagged.map((f) => ({
      label: `${(f.displayName ?? f.canonicalMetricName ?? "Metric").toString()}${f.flag ? ` (${f.flag})` : ""}`,
      metric: f.displayName ?? f.canonicalMetricName,
      flag: f.flag,
      value: f.numericValue,
      unit: f.unit,
      referenceRange: f.referenceRange,
      date: f.observationDate?.toISOString() ?? null,
      category: f.category,
    })),
    recentActivity: uploads.map((u) => ({
      documentId: u.documentId,
      fileName: u.fileName,
      uploadedAt: u.uploadTimestamp.toISOString(),
      processingStatus: u.processingStatus,
      documentType: u.classification?.documentType ?? null,
    })),
  });
}


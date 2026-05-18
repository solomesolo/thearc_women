import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const [user, profile, snapshot, settings, consent, checkStatuses, checkResults, reminders, uploads, observations, accessCodes] = await Promise.all([
    prisma.appUser.findUnique({ where: { email }, select: { email: true, name: true, createdAt: true } }),
    prisma.userProfile.findUnique({ where: { email } }),
    prisma.profileSnapshot.findFirst({ where: { userEmail: email, isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.userSettings.findUnique({ where: { userEmail: email } }),
    prisma.userConsent.findUnique({ where: { userEmail: email } }),
    prisma.userCheckStatus.findMany({ where: { userEmail: email } }),
    prisma.userCheckResult.findMany({ where: { userEmail: email }, select: { id: true, checkKey: true, fileName: true, fileType: true, source: true, testDate: true, uploadedAt: true, notes: true } }),
    prisma.userCheckReminder.findMany({ where: { userEmail: email } }),
    prisma.healthUpload.findMany({ where: { userEmail: email }, select: { documentId: true, fileName: true, mimeType: true, processingStatus: true, uploadTimestamp: true } }),
    prisma.healthObservation.findMany({ where: { userEmail: email }, select: { id: true, documentId: true, canonicalMetricName: true, displayName: true, numericValue: true, valueText: true, unit: true, flag: true, referenceRange: true, observationDate: true, bin: true } }),
    prisma.accessCode.findMany({ where: { ownerEmail: email }, select: { id: true, code: true, status: true, createdAt: true, usedAt: true, expiresAt: true } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: user,
    settings,
    consent,
    profile,
    activeProfileSnapshot: snapshot,
    checkStatuses,
    checkResults,
    reminders,
    uploadedDocuments: uploads,
    healthObservations: observations,
    accessCodes,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="arc-health-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

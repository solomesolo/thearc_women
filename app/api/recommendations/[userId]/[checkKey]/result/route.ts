import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getCallerEmail(request: NextRequest, sessionEmail: string | null | undefined) {
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  return sessionEmail ?? (anonHeader ? `anon:${anonHeader}` : null);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; checkKey: string }> },
) {
  const session = await getServerSession(authOptions);
  const callerEmail = getCallerEmail(request, session?.user?.email);
  if (!callerEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, checkKey } = await params;
  const targetEmail = decodeURIComponent(userId);
  if (callerEmail !== targetEmail && !targetEmail.startsWith("anon:")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // MVP: accept JSON metadata linking an existing uploaded document (from /api/upload)
  // or basic metadata without a documentId.
  let body: {
    documentId?: unknown;
    fileName?: unknown;
    fileType?: unknown;
    source?: unknown;
    testDate?: unknown;
    notes?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ck = decodeURIComponent(checkKey);
  const documentId = typeof body.documentId === "string" ? body.documentId : null;
  const fileName = typeof body.fileName === "string" ? body.fileName : null;
  const fileType = typeof body.fileType === "string" ? body.fileType : null;
  const source = typeof body.source === "string" ? body.source : null;
  const notes = typeof body.notes === "string" ? body.notes : null;
  const testDate =
    typeof body.testDate === "string" && body.testDate
      ? new Date(body.testDate)
      : null;

  const result = await prisma.userCheckResult.create({
    data: {
      userEmail: targetEmail,
      checkKey: ck,
      documentId,
      fileName,
      fileType,
      source,
      testDate: testDate && !Number.isNaN(testDate.getTime()) ? testDate : null,
      notes,
    },
  });

  // Mark status as result_uploaded (this also counts as completed for score)
  await prisma.userCheckStatus.upsert({
    where: { user_check_status_unique: { userEmail: targetEmail, checkKey: ck } },
    create: {
      userEmail: targetEmail,
      checkKey: ck,
      status: "result_uploaded",
      completedAt: new Date(),
    },
    update: { status: "result_uploaded", completedAt: new Date() },
  });

  return Response.json({
    id: result.id,
    documentId: result.documentId,
    fileName: result.fileName,
    fileType: result.fileType,
    source: result.source,
    testDate: result.testDate ? result.testDate.toISOString().slice(0, 10) : null,
    uploadedAt: result.uploadedAt.toISOString(),
  });
}


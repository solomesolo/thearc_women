import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getCallerEmail(request: NextRequest, sessionEmail: string | null | undefined) {
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  return sessionEmail ?? (anonHeader ? `anon:${anonHeader}` : null);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  const callerEmail = getCallerEmail(request, session?.user?.email);
  if (!callerEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const targetEmail = decodeURIComponent(userId);
  if (callerEmail !== targetEmail && !targetEmail.startsWith("anon:")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await prisma.userCheckResult.findMany({
    where: { userEmail: targetEmail },
    orderBy: { uploadedAt: "desc" },
    take: 500,
  });

  return Response.json({
    results: results.map((r) => ({
      id: r.id,
      checkKey: r.checkKey,
      documentId: r.documentId,
      fileName: r.fileName,
      fileType: r.fileType,
      source: r.source,
      testDate: r.testDate ? r.testDate.toISOString().slice(0, 10) : null,
      uploadedAt: r.uploadedAt.toISOString(),
      notes: r.notes,
    })),
  });
}


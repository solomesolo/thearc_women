/**
 * GET /api/ocr/[documentId]/sensitivity/audit
 *   Returns the access audit log for a document.
 *   Only the document owner can read their own audit log.
 *
 *   Query params:
 *     limit    — max entries (default 50, max 200)
 *     before   — cursor: return entries with id < before (for pagination)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getAuditLog } from "@/lib/sensitiveAccess";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    select: { documentId: true, fileName: true },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const rawLimit  = parseInt(url.searchParams.get("limit")  ?? "50", 10);
  const rawBefore = url.searchParams.get("before");
  const limit  = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 200);
  const before = rawBefore != null ? parseInt(rawBefore, 10) : undefined;

  const entries = await getAuditLog(documentId, limit, before);

  return NextResponse.json({
    documentId: upload.documentId,
    fileName:   upload.fileName,
    count:      entries.length,
    entries,
    // Pagination cursor — pass as `?before=<id>` to get older entries
    nextCursor: entries.length === limit ? entries[entries.length - 1].id : null,
  });
}

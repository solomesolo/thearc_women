/**
 * POST /api/ocr/[documentId]
 * Triggers the Python OCR worker for a given document.
 * The document must belong to the authenticated user and be in `queued` status.
 *
 * GET /api/ocr/[documentId]
 * Returns the current OCR result (pages + confidence) if processing is complete.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { checkAndAudit } from "@/lib/sensitiveAccess";
import { spawn } from "child_process";
import path from "path";

type Params = { params: Promise<{ documentId: string }> };

// ── POST — trigger OCR ────────────────────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: { ocrJob: true },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const jobStatus = upload.ocrJob?.status;
  if (jobStatus === "processing") {
    return NextResponse.json({ error: "Already processing" }, { status: 409 });
  }
  if (jobStatus === "completed") {
    return NextResponse.json({ error: "Already completed — fetch result via GET" }, { status: 409 });
  }

  // Ensure OCR job row exists (created by /api/upload, but guard anyway)
  if (!upload.ocrJob) {
    await prisma.ocrJob.create({ data: { documentId } });
  }

  // Spawn Python worker detached (fire-and-forget)
  const projectRoot = path.resolve(process.cwd());
  const python = "/opt/homebrew/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin/python3.10";
  const script = path.join(projectRoot, "workers", "ocr_processor.py");

  const child = spawn(python, [script, documentId], {
    detached: true,
    stdio: "ignore",
    cwd: projectRoot,
    env: { ...process.env },
  });
  child.unref();

  return NextResponse.json({
    ok: true,
    documentId,
    message: "OCR job started",
  });
}

// ── GET — fetch result ────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: {
      ocrJob: true,
      ocrResult: { include: { pages: { orderBy: { pageNumber: "asc" } } } },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const job = upload.ocrJob;
  const result = upload.ocrResult;

  if (!result) {
    return NextResponse.json({
      documentId,
      jobStatus: job?.status ?? "unknown",
      ocrStatus: null,
      message: job?.status === "processing" ? "OCR in progress" : "Not yet processed",
    });
  }

  // Audit log — raw OCR text is the most sensitive payload (fire-and-forget)
  await checkAndAudit(
    documentId,
    session.user.email,
    `/api/ocr/${documentId}`,
  );

  return NextResponse.json({
    documentId,
    jobStatus: job?.status ?? "completed",
    ocrStatus: result.ocrStatus,
    pageCount: result.pageCount,
    avgConfidence: result.avgConfidence,
    processedAt: result.processedAt.toISOString(),
    rawText: result.rawText,
    pages: result.pages.map((p) => ({
      pageNumber: p.pageNumber,
      confidence: p.confidence,
      wordCount: p.wordCount,
      isLowConf: p.isLowConf,
      rawText: p.rawText,
      blocks: p.blocks,
    })),
  });
}

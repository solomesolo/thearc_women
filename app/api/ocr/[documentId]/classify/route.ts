/**
 * GET  /api/ocr/[documentId]/classify
 *   Returns the stored document type classification.
 *
 * POST /api/ocr/[documentId]/classify
 *   Re-runs the Python classifier against the stored OCR text and updates the
 *   result.  Classification is fast (keyword scoring, no external API) so this
 *   call is synchronous — it waits for the Python process and returns the result.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { checkAndAudit } from "@/lib/sensitiveAccess";
import { spawn } from "child_process";
import path from "path";

type Params = { params: Promise<{ documentId: string }> };

const PYTHON =
  "/opt/homebrew/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin/python3.10";

// ── GET — read stored classification ─────────────────────────────────────────

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
    select: {
      documentId: true,
      fileName: true,
      classification: {
        select: {
          documentType: true,
          secondaryDocumentTypes: true,
          confidence: true,
          allScores: true,
          classifiedAt: true,
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!upload.classification) {
    return NextResponse.json(
      { error: "Classification not yet available — OCR may still be processing" },
      { status: 404 }
    );
  }

  // Audit log for sensitive/high-sensitivity documents (fire-and-forget)
  await checkAndAudit(
    documentId,
    session.user.email,
    `/api/ocr/${documentId}/classify`,
  );

  const c = upload.classification;
  return NextResponse.json({
    documentId: upload.documentId,
    fileName: upload.fileName,
    documentType: c.documentType,
    secondaryDocumentTypes: c.secondaryDocumentTypes,
    confidence: c.confidence,
    allScores: c.allScores,
    classifiedAt: c.classifiedAt.toISOString(),
  });
}

// ── POST — re-run classifier ──────────────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership and that OCR text exists
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: { ocrResult: { select: { rawText: true } } },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!upload.ocrResult?.rawText) {
    return NextResponse.json(
      { error: "No OCR text available — run OCR first" },
      { status: 409 }
    );
  }

  // Run classifier synchronously (it's fast — keyword matching only)
  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "document_classifier.py");

  const result = await new Promise<{
    ok: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }>((resolve) => {
    const child = spawn(PYTHON, [script, documentId], {
      cwd: projectRoot,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({ ok: false, error: stderr.trim() || "Classifier exited non-zero" });
        return;
      }
      try {
        const data = JSON.parse(stdout.trim());
        resolve({ ok: true, data });
      } catch {
        resolve({ ok: false, error: "Failed to parse classifier output" });
      }
    });

    child.on("error", (err) => {
      resolve({ ok: false, error: err.message });
    });

    // 30-second timeout (classification is never this slow, but guard anyway)
    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Classifier timed out" });
    }, 30_000);
  });

  if (!result.ok) {
    console.error("[classify] Python error:", result.error);
    return NextResponse.json(
      { error: "Classification failed", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    documentId,
    ...result.data,
  });
}

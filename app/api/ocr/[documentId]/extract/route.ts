/**
 * GET  /api/ocr/[documentId]/extract
 *   Returns the stored structured medical extraction.
 *
 * POST /api/ocr/[documentId]/extract
 *   Re-runs the Python extractor (calls Claude Haiku API) against the stored
 *   OCR text and updates the result.  Waits synchronously — typically 3–8 s.
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

// ── GET — read stored extraction ──────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    select: {
      documentId: true,
      fileName: true,
      extraction: {
        select: {
          structuredEntities: true,
          extractionConfidence: true,
          missingFields: true,
          parsingWarnings: true,
          extractedAt: true,
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!upload.extraction) {
    return NextResponse.json(
      { error: "Extraction not yet available — OCR may still be processing" },
      { status: 404 }
    );
  }

  // Audit log for sensitive/high-sensitivity documents (fire-and-forget)
  await checkAndAudit(
    documentId,
    session.user.email,
    `/api/ocr/${documentId}/extract`,
  );

  const e = upload.extraction;
  return NextResponse.json({
    documentId: upload.documentId,
    fileName: upload.fileName,
    structuredEntities: e.structuredEntities,
    extractionConfidence: e.extractionConfidence,
    missingFields: e.missingFields,
    parsingWarnings: e.parsingWarnings,
    extractedAt: e.extractedAt.toISOString(),
  });
}

// ── POST — re-run extractor ───────────────────────────────────────────────────

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

  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "medical_extractor.py");

  // Extractor calls the Claude API — wait up to 60 s
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
        resolve({ ok: false, error: stderr.trim() || "Extractor exited non-zero" });
        return;
      }
      try {
        const data = JSON.parse(stdout.trim());
        resolve({ ok: true, data });
      } catch {
        resolve({ ok: false, error: "Failed to parse extractor output" });
      }
    });

    child.on("error", (err) => resolve({ ok: false, error: err.message }));

    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Extractor timed out after 60 s" });
    }, 60_000);
  });

  if (!result.ok) {
    console.error("[extract] Python error:", result.error);
    return NextResponse.json(
      { error: "Extraction failed", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, documentId, ...result.data });
}

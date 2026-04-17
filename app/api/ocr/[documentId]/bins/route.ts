/**
 * GET  /api/ocr/[documentId]/bins
 *   Returns the stored health category bin assignment for the document.
 *
 * POST /api/ocr/[documentId]/bins
 *   Re-runs the bin mapper against the stored extraction entities.
 *   Rule-based matching is synchronous and fast (<100 ms).
 *   If unclassified entities exist, a Claude Haiku batch call is made (~2–4 s).
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

// ── GET — read stored bin assignment ─────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
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
      binAssignment: {
        select: {
          assignedBins: true,
          entityBinMap: true,
          classificationConfidence: true,
          methodSummary: true,
          assignedAt: true,
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!upload.binAssignment) {
    return NextResponse.json(
      { error: "Bin assignment not yet available — extraction may still be processing" },
      { status: 404 }
    );
  }

  // Audit log for sensitive/high-sensitivity documents (fire-and-forget)
  await checkAndAudit(
    documentId,
    session.user.email,
    `/api/ocr/${documentId}/bins`,
  );

  const b = upload.binAssignment;
  return NextResponse.json({
    documentId: upload.documentId,
    fileName: upload.fileName,
    assignedBins: b.assignedBins,
    entityBinMap: b.entityBinMap,
    classificationConfidence: b.classificationConfidence,
    methodSummary: b.methodSummary,
    assignedAt: b.assignedAt.toISOString(),
  });
}

// ── POST — re-run bin mapper ──────────────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership and that an extraction exists
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: {
      extraction: { select: { structuredEntities: true } },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!upload.extraction) {
    return NextResponse.json(
      { error: "No extraction available — run extraction first" },
      { status: 409 }
    );
  }

  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "bin_mapper.py");

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
        resolve({ ok: false, error: stderr.trim() || "Bin mapper exited non-zero" });
        return;
      }
      try {
        resolve({ ok: true, data: JSON.parse(stdout.trim()) });
      } catch {
        resolve({ ok: false, error: "Failed to parse bin mapper output" });
      }
    });

    child.on("error", (err) => resolve({ ok: false, error: err.message }));

    // 30 s — rule-based is instant; model fallback adds a few seconds at most
    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Bin mapper timed out after 30 s" });
    }, 30_000);
  });

  if (!result.ok) {
    console.error("[bins] Python error:", result.error);
    return NextResponse.json(
      { error: "Bin assignment failed", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, documentId, ...result.data });
}

/**
 * GET  /api/ocr/[documentId]/normalized
 *   Returns the stored normalised observations for a document.
 *   Supports optional query filters:
 *     ?category=haematology,lipids   — filter by category (comma-separated)
 *     ?active=true                   — exclude superseded observations (default true)
 *     ?flag=H,L                      — only flagged observations
 *
 * POST /api/ocr/[documentId]/normalized
 *   Re-runs the normaliser against the stored extraction entities.
 *   Purely rule-based — fast (<50 ms), no external API.
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

// ── GET — read stored normalised observations ─────────────────────────────────

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
      fileName:   true,
      normalizedResult: {
        select: {
          normalizedObservations: true,
          totalObservations:      true,
          activeObservations:     true,
          supersededCount:        true,
          conversionCount:        true,
          missingCanonical:       true,
          normalizedAt:           true,
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!upload.normalizedResult) {
    return NextResponse.json(
      { error: "Normalisation not yet available — extraction may still be processing" },
      { status: 404 }
    );
  }

  // Audit log for sensitive/high-sensitivity documents (fire-and-forget)
  await checkAndAudit(
    documentId,
    session.user.email,
    `/api/ocr/${documentId}/normalized`,
  );

  const n = upload.normalizedResult;
  const url = new URL(req.url);

  // Parse filters
  const rawCategories = url.searchParams.get("category");
  const categories = rawCategories
    ? new Set(rawCategories.split(",").map((c) => c.trim()))
    : null;

  const activeOnly = url.searchParams.get("active") !== "false";

  const rawFlags = url.searchParams.get("flag");
  const flags = rawFlags
    ? new Set(rawFlags.split(",").map((f) => f.trim().toUpperCase()))
    : null;

  // Filter observations
  type Obs = Record<string, unknown>;
  let observations = n.normalizedObservations as Obs[];

  if (activeOnly) {
    observations = observations.filter((o) => !o.superseded);
  }
  if (categories) {
    observations = observations.filter((o) => categories.has(o.category as string));
  }
  if (flags) {
    observations = observations.filter(
      (o) => o.flag != null && flags.has((o.flag as string).toUpperCase())
    );
  }

  return NextResponse.json({
    documentId:        upload.documentId,
    fileName:          upload.fileName,
    observations,
    filteredCount:     observations.length,
    totalObservations: n.totalObservations,
    activeObservations: n.activeObservations,
    supersededCount:   n.supersededCount,
    conversionCount:   n.conversionCount,
    missingCanonical:  n.missingCanonical,
    normalizedAt:      n.normalizedAt.toISOString(),
  });
}

// ── POST — re-run normaliser ──────────────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: { extraction: { select: { structuredEntities: true } } },
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
  const script = path.join(projectRoot, "workers", "normalizer.py");

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
        resolve({ ok: false, error: stderr.trim() || "Normaliser exited non-zero" });
        return;
      }
      try {
        resolve({ ok: true, data: JSON.parse(stdout.trim()) });
      } catch {
        resolve({ ok: false, error: "Failed to parse normaliser output" });
      }
    });

    child.on("error", (err) => resolve({ ok: false, error: err.message }));

    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Normaliser timed out" });
    }, 15_000);
  });

  if (!result.ok) {
    console.error("[normalized] Python error:", result.error);
    return NextResponse.json(
      { error: "Normalisation failed", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, documentId, ...result.data });
}

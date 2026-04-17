/**
 * GET  /api/ocr/[documentId]/longitudinal
 *   Returns the health_observations rows stored for this document.
 *   Supports optional query filters:
 *     ?bin=cardiovascular,general_labs  — filter by primary bin (comma-separated)
 *     ?flag=H,L                         — only flagged observations
 *     ?metric=hemoglobin                — canonical_metric_name filter
 *
 * POST /api/ocr/[documentId]/longitudinal
 *   Re-runs the longitudinal store step for this document (upserts into
 *   health_observations from the existing normalized_results row).
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

// ── GET — read stored longitudinal observations ────────────────────────────────

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

  // Audit log for sensitive documents
  await checkAndAudit(
    documentId,
    session.user.email,
    `/api/ocr/${documentId}/longitudinal`,
  );

  const url = new URL(req.url);

  // Parse filters
  const rawBins = url.searchParams.get("bin");
  const bins = rawBins ? new Set(rawBins.split(",").map((b) => b.trim())) : null;

  const rawFlags = url.searchParams.get("flag");
  const flags = rawFlags
    ? new Set(rawFlags.split(",").map((f) => f.trim().toUpperCase()))
    : null;

  const metricFilter = url.searchParams.get("metric") ?? undefined;

  // Build where clause
  const where: Record<string, unknown> = { documentId };
  if (bins) {
    where.bin = { in: Array.from(bins) };
  }
  if (metricFilter) {
    where.canonicalMetricName = metricFilter;
  }

  const rows = await prisma.healthObservation.findMany({
    where,
    orderBy: [{ observationDate: "asc" }, { canonicalMetricName: "asc" }],
    select: {
      observationId:       true,
      bin:                 true,
      observationDate:     true,
      metricName:          true,
      canonicalMetricName: true,
      displayName:         true,
      category:            true,
      valueText:           true,
      numericValue:        true,
      unit:                true,
      originalUnit:        true,
      referenceRange:      true,
      flag:                true,
      interpretation:      true,
      confidenceScore:     true,
      sensitivityLevel:    true,
      sensitivityFlag:     true,
      sourceEntityIndex:   true,
      conversionApplied:   true,
    },
  });

  // Apply flag filter in-memory (small result set)
  const observations = flags
    ? rows.filter((r) => r.flag != null && flags.has(r.flag.toUpperCase()))
    : rows;

  return NextResponse.json({
    documentId:    upload.documentId,
    fileName:      upload.fileName,
    observations,
    count:         observations.length,
  });
}

// ── POST — re-run longitudinal store ─────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership and that normalization exists
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: { normalizedResult: { select: { activeObservations: true } } },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!upload.normalizedResult) {
    return NextResponse.json(
      { error: "No normalised results — run normalisation first" },
      { status: 409 },
    );
  }

  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "longitudinal_store.py");

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
        resolve({ ok: false, error: stderr.trim() || "Longitudinal store exited non-zero" });
        return;
      }
      try {
        resolve({ ok: true, data: JSON.parse(stdout.trim()) });
      } catch {
        resolve({ ok: false, error: "Failed to parse longitudinal store output" });
      }
    });

    child.on("error", (err) => resolve({ ok: false, error: err.message }));

    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Longitudinal store timed out" });
    }, 30_000);
  });

  if (!result.ok) {
    console.error("[longitudinal] Python error:", result.error);
    return NextResponse.json(
      { error: "Longitudinal store failed", detail: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, documentId, ...result.data });
}

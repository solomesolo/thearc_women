/**
 * POST /api/ocr/[documentId]/retry
 *
 * Resumes a failed pipeline from the failed step.
 * Already-completed steps are skipped (stateful retry via completed_steps[]).
 *
 * Body (optional JSON):
 *   { "fromStep": "extract" }  — override which step to resume from.
 *   Omit to auto-resume from the step recorded in ocr_jobs.current_step.
 *
 * Rules:
 *   - Document must belong to the authenticated user.
 *   - Job must be in "failed" status (returns 409 if processing or completed).
 *   - Resets retry_count and last_error before spawning.
 *
 * Response:
 *   { ok: true, documentId, resumingFromStep }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { spawn } from "child_process";
import path from "path";

type Params = { params: Promise<{ documentId: string }> };

const PYTHON =
  "/opt/homebrew/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin/python3.10";

const VALID_STEPS = [
  "ocr",
  "classify",
  "extract",
  "bin_map",
  "normalize",
  "longitudinal",
  "interventions",
] as const;
type StepName = typeof VALID_STEPS[number];

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  // Verify ownership and fetch current job state
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    include: {
      ocrJob: {
        select: {
          status:      true,
          currentStep: true,
          retryCount:  true,
          maxRetries:  true,
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const job = upload.ocrJob;

  if (!job) {
    return NextResponse.json({ error: "No processing job found for this document" }, { status: 404 });
  }

  if (job.status === "processing") {
    return NextResponse.json(
      { error: "Pipeline is currently running — wait for it to complete or fail" },
      { status: 409 },
    );
  }

  if (job.status === "completed") {
    return NextResponse.json(
      { error: "Pipeline already completed successfully" },
      { status: 409 },
    );
  }

  // Determine which step to resume from
  let fromStep: StepName | null = null;

  // Check for explicit override in request body
  let body: { fromStep?: string } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // empty body is fine
  }

  if (body.fromStep) {
    if (!VALID_STEPS.includes(body.fromStep as StepName)) {
      return NextResponse.json(
        { error: `Invalid step. Must be one of: ${VALID_STEPS.join(", ")}` },
        { status: 400 },
      );
    }
    fromStep = body.fromStep as StepName;
  } else if (job.currentStep && VALID_STEPS.includes(job.currentStep as StepName)) {
    // Auto-resume from the step that was running when the job failed
    fromStep = job.currentStep as StepName;
  }

  // Reset job to queued so the runner can pick it up, clear last error
  await prisma.ocrJob.update({
    where: { documentId },
    data: {
      status:    "queued",
      lastError: null,
    },
  });

  // Spawn pipeline_runner.py with --from-step flag (detached)
  const projectRoot = path.resolve(process.cwd());
  const script      = path.join(projectRoot, "workers", "pipeline_runner.py");
  const args        = [script, documentId];
  if (fromStep) args.push("--from-step", fromStep);

  const child = spawn(PYTHON, args, {
    detached: true,
    stdio:    "ignore",
    cwd:      projectRoot,
    env:      { ...process.env },
  });
  child.unref();

  return NextResponse.json({
    ok:              true,
    documentId,
    resumingFromStep: fromStep ?? "ocr",
    message:         fromStep
      ? `Retrying pipeline from step: ${fromStep}`
      : "Restarting pipeline from beginning",
  });
}

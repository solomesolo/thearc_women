/**
 * GET /api/ocr/[documentId]/status
 *
 * Polling endpoint for the processing pipeline.
 * Returns the current job status, per-step progress, and result summary.
 *
 * Designed for UI polling until isComplete === true.
 *
 * Response shape
 * --------------
 * {
 *   documentId, fileName,
 *   jobStatus:        "queued" | "processing" | "completed" | "failed"
 *   processingStatus: "uploaded" | "processing" | "extracted" | "classified" | "completed" | "failed"
 *   currentStep:      string | null
 *   completedSteps:   string[]
 *   retryCount:       number
 *   lastError:        string | null
 *   progressPct:      number  (0–100)
 *   steps: [{
 *     step, status, attempt, durationMs, errorMessage, startedAt, completedAt
 *   }]
 *   ocrStatus, pageCount, avgConfidence, lowConfidencePages,
 *   isComplete: boolean
 *   isSuccess:  boolean
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type Params = { params: Promise<{ documentId: string }> };

// Ordered list of pipeline steps (mirrors pipeline_runner.py PIPELINE_STEPS)
const PIPELINE_STEP_ORDER = [
  "ocr",
  "classify",
  "extract",
  "bin_map",
  "normalize",
  "longitudinal",
  "interventions",
] as const;

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
      documentId:       true,
      fileName:         true,
      processingStatus: true,
      ocrJob: {
        select: {
          status:         true,
          currentStep:    true,
          completedSteps: true,
          retryCount:     true,
          maxRetries:     true,
          lastError:      true,
          updatedAt:      true,
        },
      },
      // Step logs are linked to HealthUpload, not OcrJob
      pipelineStepLogs: {
        orderBy: { startedAt: "asc" },
        select: {
          step:         true,
          status:       true,
          attempt:      true,
          durationMs:   true,
          errorMessage: true,
          startedAt:    true,
          completedAt:  true,
        },
      },
      ocrResult: {
        select: {
          ocrStatus:     true,
          pageCount:     true,
          avgConfidence: true,
          processedAt:   true,
          pages: {
            select:  { pageNumber: true, isLowConf: true },
            orderBy: { pageNumber: "asc" },
          },
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const job      = upload.ocrJob;
  const stepLogs = upload.pipelineStepLogs ?? [];
  const result   = upload.ocrResult;

  const lowConfidencePages = result?.pages
    .filter((p) => p.isLowConf)
    .map((p) => p.pageNumber) ?? [];

  // Build one summary entry per step with the latest log row for that step
  const stepSummary = PIPELINE_STEP_ORDER.map((stepName) => {
    const logs = stepLogs.filter((l) => l.step === stepName);
    if (logs.length === 0) {
      const alreadyDone = job?.completedSteps.includes(stepName) ?? false;
      return {
        step:         stepName,
        status:       alreadyDone ? "completed" : "pending",
        attempt:      0,
        durationMs:   null as number | null,
        errorMessage: null as string | null,
        startedAt:    null as string | null,
        completedAt:  null as string | null,
      };
    }
    const latest = logs[logs.length - 1];
    return {
      step:         latest.step,
      status:       latest.status,
      attempt:      latest.attempt,
      durationMs:   latest.durationMs,
      errorMessage: latest.errorMessage,
      startedAt:    latest.startedAt?.toISOString() ?? null,
      completedAt:  latest.completedAt?.toISOString() ?? null,
    };
  });

  const completedCount = job?.completedSteps.length ?? 0;
  const progressPct    = Math.round((completedCount / PIPELINE_STEP_ORDER.length) * 100);
  const isComplete     = job?.status === "completed" || job?.status === "failed";

  return NextResponse.json({
    documentId:       upload.documentId,
    fileName:         upload.fileName,

    // Job-level fields
    jobStatus:        job?.status        ?? "queued",
    processingStatus: upload.processingStatus,
    currentStep:      job?.currentStep   ?? null,
    completedSteps:   job?.completedSteps ?? [],
    retryCount:       job?.retryCount    ?? 0,
    maxRetries:       job?.maxRetries    ?? 2,
    lastError:        job?.lastError     ?? null,
    progressPct,
    lastUpdatedAt:    job?.updatedAt?.toISOString() ?? null,

    // Step-level progress (one entry per step, latest attempt)
    steps: stepSummary,

    // OCR result summary (populated once ocr step completes)
    ocrStatus:          result?.ocrStatus     ?? null,
    pageCount:          result?.pageCount      ?? null,
    avgConfidence:      result?.avgConfidence  ?? null,
    processedAt:        result?.processedAt?.toISOString() ?? null,
    lowConfidencePages,

    // Completion flags
    isComplete,
    isSuccess: job?.status === "completed",
  });
}

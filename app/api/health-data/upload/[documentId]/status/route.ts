/**
 * GET /api/health-data/upload/[documentId]/status
 *
 * Pipeline status for the processing screen.
 * Polls until isComplete === true.
 *
 * Returns: job status, per-step progress, OCR summary.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type Params = { params: Promise<{ documentId: string }> };

const PIPELINE_STEPS = [
  { key: "ocr",           label: "Reading document" },
  { key: "classify",      label: "Identifying document type" },
  { key: "extract",       label: "Extracting health data" },
  { key: "imaging_store", label: "Saving imaging report" },
  { key: "clinical_notes_store", label: "Saving clinical notes" },
  { key: "bin_map",       label: "Categorising results" },
  { key: "normalize",     label: "Normalising values" },
  { key: "longitudinal",  label: "Saving to your health record" },
  { key: "interventions", label: "Updating care plan" },
] as const;

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        select:  {
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
          pages: { select: { pageNumber: true, isLowConf: true }, orderBy: { pageNumber: "asc" } },
        },
      },
    },
  });

  if (!upload)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const job      = upload.ocrJob;
  const stepLogs = upload.pipelineStepLogs ?? [];
  const result   = upload.ocrResult;

  const completedSet   = new Set(job?.completedSteps ?? []);
  const completedCount = completedSet.size;
  const progressPct    = Math.round((completedCount / PIPELINE_STEPS.length) * 100);

  const steps = PIPELINE_STEPS.map(({ key, label }) => {
    const logs   = stepLogs.filter((l) => l.step === key);
    const latest = logs[logs.length - 1];
    const done   = completedSet.has(key);
    const active = job?.currentStep === key;

    return {
      key,
      label,
      status:       done ? "completed" : latest?.status ?? "pending",
      isActive:     active,
      attempt:      latest?.attempt ?? 0,
      durationMs:   latest?.durationMs ?? null,
      errorMessage: latest?.errorMessage ?? null,
    };
  });

  const lowConfPages = result?.pages.filter((p) => p.isLowConf).map((p) => p.pageNumber) ?? [];

  return NextResponse.json({
    documentId: upload.documentId,
    fileName:   upload.fileName,

    jobStatus:        job?.status         ?? "queued",
    processingStatus: upload.processingStatus,
    currentStep:      job?.currentStep    ?? null,
    completedSteps:   job?.completedSteps ?? [],
    retryCount:       job?.retryCount     ?? 0,
    lastError:        job?.lastError      ?? null,
    progressPct,
    lastUpdatedAt:    job?.updatedAt?.toISOString() ?? null,

    steps,

    ocrStatus:          result?.ocrStatus                  ?? null,
    pageCount:          result?.pageCount                   ?? null,
    avgConfidence:      result?.avgConfidence               ?? null,
    processedAt:        result?.processedAt?.toISOString()  ?? null,
    lowConfidencePages: lowConfPages,

    isComplete: job?.status === "completed" || job?.status === "failed",
    isSuccess:  job?.status === "completed",
  });
}

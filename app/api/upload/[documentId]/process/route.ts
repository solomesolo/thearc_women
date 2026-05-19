/**
 * POST /api/upload/[documentId]/process
 *
 * Free document processing pipeline — no Claude, no API costs.
 * Works on Vercel and locally.
 *
 * PDF  → pdf-parse extracts text directly (free, pure JS)
 * Image → tesseract.js OCR (free, pure JS Tesseract port)
 * Text  → regex lab-value extractor + TEST_MAP normalisation
 *
 * Steps (mirrors Python pipeline step keys for UI compatibility):
 *   ocr          → download file, extract text
 *   classify     → identify document type (heuristic)
 *   extract      → regex lab value extraction
 *   bin_map      → assign health category bins
 *   normalize    → already done in extraction step
 *   longitudinal → persist HealthObservations to DB
 *   interventions→ mark job complete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getEngineSupabaseClient } from "@/lib/repositories/supabaseEngine";
import { extractLabValues } from "@/lib/lab-ocr/extractLabValues";
import crypto from "crypto";

export const maxDuration = 300; // Vercel Pro: 5 minutes

type Params = { params: Promise<{ documentId: string }> };

// ── Helpers ───────────────────────────────────────────────────────────────────

function deterministic_id(documentId: string, name: string, date: string | null): string {
  return crypto
    .createHash("sha256")
    .update(`${documentId}:${name}:${date ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

async function markStep(
  prisma: ReturnType<typeof getPrisma>,
  documentId: string,
  step: string,
  completedSteps: string[],
) {
  const next = completedSteps.includes(step)
    ? completedSteps
    : [...completedSteps, step];
  await prisma.ocrJob.update({
    where: { documentId },
    data: { currentStep: step, completedSteps: next, updatedAt: new Date() },
  });
  return next;
}

// ── Text extraction ───────────────────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  // PDFParse v2: pass { data: buffer } as constructor options
  const parser = new (PDFParse as any)({ data: buffer });
  const result = await parser.getText();
  return (result?.text ?? "") as string;
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractTextFromPdf(buffer);
  }
  if (mimeType.startsWith("image/")) {
    return extractTextFromImage(buffer);
  }
  throw new Error(`Unsupported mime type: ${mimeType}`);
}

// ── Main handler ──────────────────────────────────────────────────────────────

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
    select: { documentId: true, fileName: true, mimeType: true, storagePath: true },
  });
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotency: skip if already processing/completed
  const job = await prisma.ocrJob.findUnique({ where: { documentId } });
  if (!job) return NextResponse.json({ error: "OCR job not found" }, { status: 404 });
  if (job.status === "completed") return NextResponse.json({ ok: true, alreadyComplete: true });
  if (job.status === "processing") return NextResponse.json({ ok: true, alreadyProcessing: true });

  // Mark as processing
  await prisma.ocrJob.update({
    where: { documentId },
    data: { status: "processing", currentStep: "ocr", updatedAt: new Date() },
  });
  await prisma.healthUpload.update({
    where: { documentId },
    data: { processingStatus: "processing" },
  });

  let completedSteps: string[] = [];

  try {
    const supabase = getEngineSupabaseClient();

    // ── Step: ocr — download + extract text ───────────────────────────────────
    const buckets = process.env.HEALTH_UPLOADS_BUCKET
      ? [process.env.HEALTH_UPLOADS_BUCKET]
      : ["health0uploads", "health-uploads"];

    let fileBuffer: Buffer | null = null;
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.from(bucket).download(upload.storagePath);
      if (!error && data) {
        fileBuffer = Buffer.from(await data.arrayBuffer());
        break;
      }
    }
    if (!fileBuffer) throw new Error("Could not download file from storage");

    const rawText = await extractText(fileBuffer, upload.mimeType);
    completedSteps = await markStep(prisma, documentId, "ocr", completedSteps);

    // ── Step: classify ────────────────────────────────────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "classify" } });
    // Heuristic classification
    const textLower = rawText.toLowerCase();
    const documentType =
      textLower.includes("radiology") || textLower.includes("imaging") ? "imaging"
      : textLower.includes("assessment") || textLower.includes("clinical notes") ? "clinical_notes"
      : "lab_report";

    completedSteps = await markStep(prisma, documentId, "classify", completedSteps);

    // ── Step: extract — regex lab value extraction ────────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "extract" } });
    const extraction = extractLabValues(rawText);

    // Store raw OCR result
    await prisma.ocrResult.upsert({
      where: { documentId },
      create: {
        documentId,
        ocrStatus: "success",
        rawText,
        pageCount: 1,
        avgConfidence: extraction.results.length > 0
          ? Math.round((extraction.results.reduce((s, r) => s + r.confidence, 0) / extraction.results.length) * 100)
          : 50,
        processedAt: new Date(),
      },
      update: {
        ocrStatus: "success",
        rawText,
        avgConfidence: extraction.results.length > 0
          ? Math.round((extraction.results.reduce((s, r) => s + r.confidence, 0) / extraction.results.length) * 100)
          : 50,
        processedAt: new Date(),
      },
    });

    completedSteps = await markStep(prisma, documentId, "extract", completedSteps);

    // ── Step: bin_map + normalize (done during extraction) ────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "bin_map" } });
    completedSteps = await markStep(prisma, documentId, "bin_map", completedSteps);
    completedSteps = await markStep(prisma, documentId, "normalize", completedSteps);

    // ── Step: longitudinal — write HealthObservations ─────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "longitudinal" } });

    const observations = extraction.results.filter((r) => r.value !== null);
    const userEmail = session.user.email;
    const reportDate = extraction.report_date;

    for (let i = 0; i < observations.length; i++) {
      const r = observations[i]!;
      const obsDate = r.report_date ?? reportDate ?? null;
      const observationId = deterministic_id(documentId, r.canonical_name, obsDate);

      await prisma.healthObservation.upsert({
        where: {
          health_observations_doc_obs_key: { documentId, observationId },
        },
        create: {
          observationId,
          documentId,
          userEmail,
          bin: r.bin,
          observationDate: obsDate ? new Date(obsDate) : null,
          metricName: r.test_name,
          canonicalMetricName: r.canonical_name,
          displayName: r.display_name,
          category: r.category,
          valueText: r.value,
          numericValue: r.numeric_value ?? null,
          unit: r.unit,
          originalUnit: r.unit,
          referenceRange: r.reference_range,
          flag: r.flag,
          interpretation: null,
          confidenceScore: r.confidence,
          sourceEntityIndex: i,
        },
        update: {
          valueText: r.value,
          numericValue: r.numeric_value ?? null,
          unit: r.unit,
          flag: r.flag,
          confidenceScore: r.confidence,
          updatedAt: new Date(),
        },
      });
    }

    // Store normalized results summary
    await prisma.normalizedResult.upsert({
      where: { documentId },
      create: {
        documentId,
        normalizedObservations: observations as any,
        totalObservations: observations.length,
        activeObservations: observations.length,
        supersededCount: 0,
        conversionCount: 0,
        missingCanonical: extraction.warnings.length > 0 ? 1 : 0,
      },
      update: {
        normalizedObservations: observations as any,
        totalObservations: observations.length,
        activeObservations: observations.length,
        normalizedAt: new Date(),
      },
    });

    completedSteps = await markStep(prisma, documentId, "longitudinal", completedSteps);

    // ── Step: interventions — finalise ────────────────────────────────────────
    completedSteps = await markStep(prisma, documentId, "interventions", completedSteps);

    await prisma.ocrJob.update({
      where: { documentId },
      data: { status: "completed", currentStep: null, completedSteps, updatedAt: new Date() },
    });
    await prisma.healthUpload.update({
      where: { documentId },
      data: { processingStatus: "completed" },
    });

    return NextResponse.json({
      ok: true,
      documentType,
      observationsExtracted: observations.length,
      warnings: extraction.warnings,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload/process] failed:", message, err);
    await prisma.ocrJob
      .update({ where: { documentId }, data: { status: "failed", lastError: message, updatedAt: new Date() } })
      .catch(() => {});
    await prisma.healthUpload
      .update({ where: { documentId }, data: { processingStatus: "failed" } })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

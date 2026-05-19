/**
 * POST /api/upload/[documentId]/process
 *
 * Free document processing pipeline — no Claude, no API costs.
 * Works on Vercel and locally.
 *
 * PDF  → pdf-parse extracts text directly (free, pure JS)
 * Image → tesseract.js OCR (free, pure JS Tesseract port)
 *
 * Lab reports  → regex lab-value extractor (TEST_MAP normalisation)
 * Screening /
 * Imaging docs → screening score extractor (BI-RADS, DEXA T-score, PHQ-9, etc.)
 *                raw text stored in OcrResult for sync route to serve screening drafts
 *
 * Steps (mirrors Python pipeline step keys for UI compatibility):
 *   ocr          → download file, extract text
 *   classify     → identify document type
 *   extract      → regex extraction (lab or screening depending on type)
 *   bin_map      → assign health category bins
 *   normalize    → already done in extraction step
 *   longitudinal → persist HealthObservations to DB
 *   interventions→ compute care gaps, mark job complete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getEngineSupabaseClient } from "@/lib/repositories/supabaseEngine";
import { extractLabValues } from "@/lib/lab-ocr/extractLabValues";
import { extractScreeningScores } from "@/lib/lab-ocr/extractScreeningScores";
import { classifyDocument } from "@/lib/lab-ocr/classifyDocument";
import { planInterventions } from "@/lib/health-wallet/interventionPlanner";
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

async function preprocessImageForOcr(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    // Resize to max 2000px wide, convert to greyscale PNG — reduces OCR time from
    // minutes to ~15s on large camera photos and avoids memory exhaustion.
    return await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .grayscale()
      .png({ compressionLevel: 1 })
      .toBuffer();
  } catch {
    // sharp unavailable or failed — pass original buffer
    return buffer;
  }
}

async function runTesseract(imageBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (val: string | Error) => {
      if (settled) return;
      settled = true;
      val instanceof Error ? reject(val) : resolve(val);
    };

    // Tesseract.js v7 can throw via process.nextTick bypassing try/catch —
    // capture uncaught exceptions for the duration of this call.
    const uncaughtHandler = (err: Error) => done(err);
    process.once("uncaughtException", uncaughtHandler);

    const timeout = setTimeout(() => {
      process.removeListener("uncaughtException", uncaughtHandler);
      done(new Error("Tesseract OCR timed out after 120 seconds"));
    }, 120_000);

    import("tesseract.js").then(({ createWorker }) =>
      createWorker("eng", 1, {
        cachePath: "/tmp",
        logger: () => {},
      })
    ).then((worker) =>
      worker.recognize(imageBuffer).then(({ data }) => {
        clearTimeout(timeout);
        process.removeListener("uncaughtException", uncaughtHandler);
        worker.terminate().catch(() => {});
        done(data.text ?? "");
      }).catch((err: Error) => {
        clearTimeout(timeout);
        process.removeListener("uncaughtException", uncaughtHandler);
        worker.terminate().catch(() => {});
        done(err);
      })
    ).catch((err: Error) => {
      clearTimeout(timeout);
      process.removeListener("uncaughtException", uncaughtHandler);
      done(err);
    });
  });
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const preprocessed = await preprocessImageForOcr(buffer);
  return runTesseract(preprocessed);
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

    // ── Step: classify — document type detection ──────────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "classify" } });
    const classification = classifyDocument(rawText);
    const documentType = classification.documentType;
    const isLabReport = documentType === "lab_report";
    completedSteps = await markStep(prisma, documentId, "classify", completedSteps);

    // ── Step: extract — type-aware extraction ─────────────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "extract" } });

    // Always extract lab values (many documents have both)
    const labExtraction = extractLabValues(rawText);

    // For imaging/screening documents, also extract scores
    const screeningScores =
      !isLabReport || labExtraction.results.length === 0
        ? extractScreeningScores(rawText)
        : [];

    // Merge: lab values take priority; add screening scores not already captured
    const labKeys = new Set(labExtraction.results.map((r) => r.canonical_name));
    const uniqueScreeningScores = screeningScores.filter((s) => !labKeys.has(s.canonical_name));

    const allResults = [
      ...labExtraction.results,
      ...uniqueScreeningScores.map((s) => ({
        test_name: s.display_name,
        canonical_name: s.canonical_name,
        display_name: s.display_name,
        category: s.category,
        bin: s.bin,
        value: s.value,
        numeric_value: s.numeric_value,
        unit: s.unit,
        reference_range: null as string | null,
        flag: null as string | null,
        report_date: s.report_date,
        confidence: s.confidence,
      })),
    ];

    const reportDate = labExtraction.report_date;
    const avgConfidence =
      allResults.length > 0
        ? Math.round((allResults.reduce((s, r) => s + r.confidence, 0) / allResults.length) * 100)
        : 50;

    // Store raw OCR result (rawText is essential for screening sync route)
    await prisma.ocrResult.upsert({
      where: { documentId },
      create: {
        documentId,
        ocrStatus: "success",
        rawText,
        pageCount: 1,
        avgConfidence,
        processedAt: new Date(),
      },
      update: {
        ocrStatus: "success",
        rawText,
        avgConfidence,
        processedAt: new Date(),
      },
    });

    completedSteps = await markStep(prisma, documentId, "extract", completedSteps);

    // ── Step: bin_map + normalize ─────────────────────────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "bin_map" } });
    completedSteps = await markStep(prisma, documentId, "bin_map", completedSteps);
    completedSteps = await markStep(prisma, documentId, "normalize", completedSteps);

    // ── Step: longitudinal — write HealthObservations ─────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "longitudinal" } });

    const observations = allResults.filter((r) => r.value !== null);
    const userEmail = session.user.email;

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
        missingCanonical: labExtraction.warnings.length > 0 ? 1 : 0,
      },
      update: {
        normalizedObservations: observations as any,
        totalObservations: observations.length,
        activeObservations: observations.length,
        normalizedAt: new Date(),
      },
    });

    completedSteps = await markStep(prisma, documentId, "longitudinal", completedSteps);

    // ── Step: interventions — compute care gaps + finalise ────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "interventions" } });

    // Compute care gaps in the background (non-blocking — don't fail the job if this errors)
    planInterventions(userEmail).catch((err) =>
      console.warn("[upload/process] care gap computation failed (non-critical):", err)
    );

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
      classificationConfidence: classification.confidence,
      observationsExtracted: observations.length,
      labValues: labExtraction.results.length,
      screeningScores: uniqueScreeningScores.length,
      warnings: labExtraction.warnings,
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

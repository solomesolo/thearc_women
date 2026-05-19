/**
 * POST /api/upload/[documentId]/process
 *
 * Claude-based document processing pipeline — works on Vercel and locally.
 * Replaces the Python pipeline_runner.py for Vercel deployments.
 *
 * Steps (mirrors Python pipeline step keys for UI compatibility):
 *   ocr          → download file, read content via Claude vision
 *   classify     → identify document type
 *   extract      → extract structured biomarker data via Claude
 *   bin_map      → assign health category bins
 *   normalize    → normalise names and units
 *   longitudinal → persist HealthObservations to DB
 *   interventions→ mark job complete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getEngineSupabaseClient } from "@/lib/repositories/supabaseEngine";
import crypto from "crypto";

export const maxDuration = 300; // Vercel Pro: 5 minutes

type Params = { params: Promise<{ documentId: string }> };

// ── Bin / category helpers ────────────────────────────────────────────────────

const CATEGORY_TO_BIN: Record<string, string> = {
  haematology: "general_labs",
  metabolic: "general_labs",
  vitamins: "general_labs",
  iron: "general_labs",
  inflammation: "general_labs",
  thyroid: "general_labs",
  lipids: "cardiovascular",
  cardiac: "cardiovascular",
  hormones: "gynecology",
  reproductive: "gynecology",
  fertility: "gynecology",
  oncology: "oncology",
  mental_health: "mental_health",
  respiratory: "respiratory",
  gastroenterology: "gastroenterology",
  musculoskeletal: "musculoskeletal",
  other: "general_labs",
};

function categoryToBin(category: string): string {
  return CATEGORY_TO_BIN[category.toLowerCase()] ?? "general_labs";
}

function deterministic_id(documentId: string, name: string, date: string | null): string {
  return crypto
    .createHash("sha256")
    .update(`${documentId}:${name}:${date ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

// ── Step tracker ──────────────────────────────────────────────────────────────

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
    data: {
      currentStep: step,
      completedSteps: next,
      updatedAt: new Date(),
    },
  });
  return next;
}

// ── Extraction schema returned by Claude ─────────────────────────────────────

interface ExtractedResult {
  test_name: string;
  canonical_name: string;
  display_name: string;
  category: string;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
  interpretation: string | null;
  report_date: string | null;
  confidence: number;
}

interface ExtractionResponse {
  document_type: string;
  report_date: string | null;
  patient_info: { name?: string; dob?: string; gender?: string } | null;
  results: ExtractedResult[];
  extraction_confidence: number;
  warnings: string[];
}

// ── Claude extraction ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precise medical document parser. Extract all test results from the provided lab report or medical document.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "document_type": "lab_report | imaging | clinical_notes | other",
  "report_date": "YYYY-MM-DD or null",
  "patient_info": { "name": null, "dob": null, "gender": null },
  "results": [
    {
      "test_name": "raw name from document",
      "canonical_name": "standardised snake_case key e.g. hemoglobin, tsh, vitamin_d_25oh",
      "display_name": "Human readable name e.g. Hemoglobin, TSH, Vitamin D (25-OH)",
      "category": "haematology | metabolic | lipids | thyroid | iron | vitamins | hormones | inflammation | cardiac | reproductive | fertility | oncology | mental_health | respiratory | gastroenterology | musculoskeletal | other",
      "value": "raw value string from document",
      "numeric_value": 6.5,
      "unit": "g/dL",
      "reference_range": "12.0-16.0 or null",
      "flag": "H | L | HH | LL | null",
      "interpretation": "brief interpretation if provided, else null",
      "report_date": "YYYY-MM-DD or null (use document-level date if per-result date absent)",
      "confidence": 0.95
    }
  ],
  "extraction_confidence": 0.92,
  "warnings": []
}

Rules:
- One entry per individual measurement — never group results.
- numeric_value: extract just the number, no units. null if non-numeric.
- canonical_name: lowercase, underscores, no spaces. Use standard names (e.g. hba1c, ferritin, free_t4).
- flag: set to "H" if marked high, "L" if marked low, "HH"/"LL" for critical values. null otherwise.
- Never invent values not present in the document.
- extraction_confidence: 0.0–1.0 weighted average across results.`;

async function extractWithClaude(
  apiKey: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<ExtractionResponse> {
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");
  const b64 = fileBuffer.toString("base64");

  let contentBlock: unknown;
  if (isPdf) {
    contentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } };
  } else if (isImage) {
    const imgType = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
    contentBlock = { type: "image", source: { type: "base64", media_type: imgType, data: b64 } };
  } else {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  const body = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: [contentBlock, { type: "text", text: "Extract all test results from this medical document." }] }],
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json() as { content: Array<{ type: string; text?: string }> };
  const text = json.content.find((c) => c.type === "text")?.text ?? "";
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned) as ExtractionResponse;
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
    select: { documentId: true, fileName: true, mimeType: true, storagePath: true, processingStatus: true },
  });
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotency: skip if already processing/completed
  const job = await prisma.ocrJob.findUnique({ where: { documentId } });
  if (!job) return NextResponse.json({ error: "OCR job not found" }, { status: 404 });
  if (job.status === "completed") return NextResponse.json({ ok: true, alreadyComplete: true });
  if (job.status === "processing") return NextResponse.json({ ok: true, alreadyProcessing: true });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No API key — let the local Python pipeline handle it.
    // Do NOT touch job status so polling continues waiting for Python.
    console.warn("[upload/process] ANTHROPIC_API_KEY not set — skipping TypeScript pipeline, Python pipeline will run");
    return NextResponse.json({ ok: true, skipped: true, reason: "no_api_key" });
  }

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

    // ── Step: ocr — download file ─────────────────────────────────────────────
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
    completedSteps = await markStep(prisma, documentId, "ocr", completedSteps);

    // ── Step: classify + extract — single Claude call ─────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "classify" } });
    const extraction = await extractWithClaude(apiKey, fileBuffer, upload.mimeType);

    // Store raw OCR result
    await prisma.ocrResult.upsert({
      where: { documentId },
      create: {
        documentId,
        ocrStatus: "success",
        rawText: extraction.results.map((r) => `${r.test_name}: ${r.value ?? ""} ${r.unit ?? ""}`).join("\n"),
        pageCount: 1,
        avgConfidence: Math.round((extraction.extraction_confidence ?? 0.8) * 100),
        processedAt: new Date(),
      },
      update: {
        ocrStatus: "success",
        avgConfidence: Math.round((extraction.extraction_confidence ?? 0.8) * 100),
        processedAt: new Date(),
      },
    });

    completedSteps = await markStep(prisma, documentId, "classify", completedSteps);
    completedSteps = await markStep(prisma, documentId, "extract", completedSteps);

    // ── Step: bin_map + normalize ─────────────────────────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "bin_map" } });
    const reportDate = extraction.report_date ?? null;
    completedSteps = await markStep(prisma, documentId, "bin_map", completedSteps);
    completedSteps = await markStep(prisma, documentId, "normalize", completedSteps);

    // ── Step: longitudinal — write HealthObservations ────────────────────────
    await prisma.ocrJob.update({ where: { documentId }, data: { currentStep: "longitudinal" } });

    const observations = extraction.results.filter((r) => r.value !== null);
    const userEmail = session.user.email;

    for (let i = 0; i < observations.length; i++) {
      const r = observations[i]!;
      const obsDate = r.report_date ?? reportDate ?? null;
      const observationId = deterministic_id(documentId, r.canonical_name, obsDate);
      const bin = categoryToBin(r.category ?? "other");

      await prisma.healthObservation.upsert({
        where: {
          health_observations_doc_obs_key: { documentId, observationId },
        },
        create: {
          observationId,
          documentId,
          userEmail,
          bin,
          observationDate: obsDate ? new Date(obsDate) : null,
          metricName: r.test_name,
          canonicalMetricName: r.canonical_name,
          displayName: r.display_name,
          category: r.category ?? "other",
          valueText: r.value,
          numericValue: r.numeric_value ?? null,
          unit: r.unit,
          originalUnit: r.unit,
          referenceRange: r.reference_range,
          flag: r.flag,
          interpretation: r.interpretation,
          confidenceScore: r.confidence ?? 0.8,
          sourceEntityIndex: i,
        },
        update: {
          valueText: r.value,
          numericValue: r.numeric_value ?? null,
          unit: r.unit,
          flag: r.flag,
          confidenceScore: r.confidence ?? 0.8,
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
        missingCanonical: 0,
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

    // Mark job and upload as completed
    await prisma.ocrJob.update({
      where: { documentId },
      data: {
        status: "completed",
        currentStep: null,
        completedSteps,
        updatedAt: new Date(),
      },
    });
    await prisma.healthUpload.update({
      where: { documentId },
      data: { processingStatus: "completed" },
    });

    return NextResponse.json({ ok: true, observationsExtracted: observations.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload/process] failed:", message, err);
    await prisma.ocrJob
      .update({
        where: { documentId },
        data: { status: "failed", lastError: message, updatedAt: new Date() },
      })
      .catch(() => {});
    await prisma.healthUpload
      .update({ where: { documentId }, data: { processingStatus: "failed" } })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

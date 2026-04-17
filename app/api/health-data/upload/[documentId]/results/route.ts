/**
 * GET /api/health-data/upload/[documentId]/results
 *
 * Aggregated extraction results for a completed document.
 * Returns classification, bins, sensitivity, and active observations.
 * Designed for the results summary screen shown after processing.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { checkAndAudit } from "@/lib/sensitiveAccess";

type Params = { params: Promise<{ documentId: string }> };

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
      mimeType:         true,
      uploadTimestamp:  true,
      processingStatus: true,
      ocrResult: {
        select: { ocrStatus: true, pageCount: true, avgConfidence: true, processedAt: true },
      },
      classification: {
        select: { documentType: true, confidence: true, secondaryDocumentTypes: true },
      },
      binAssignment: {
        select: { assignedBins: true, classificationConfidence: true },
      },
      sensitivityProfile: {
        select: { sensitivityLevel: true, privacyTags: true, flaggedBins: true },
      },
      normalizedResult: {
        select: {
          normalizedObservations: true,
          totalObservations:      true,
          activeObservations:     true,
          supersededCount:        true,
          conversionCount:        true,
          missingCanonical:       true,
        },
      },
    },
  });

  if (!upload)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (upload.processingStatus !== "completed")
    return NextResponse.json(
      { error: "Processing not yet complete", processingStatus: upload.processingStatus },
      { status: 202 },
    );

  await checkAndAudit(documentId, session.user.email, `/api/health-data/upload/${documentId}/results`);

  // Filter to active (non-superseded) observations and group by category
  type Obs = Record<string, unknown>;
  const allObs = (upload.normalizedResult?.normalizedObservations as Obs[] | null) ?? [];
  const active = allObs.filter((o) => !o.superseded);

  const byCategory: Record<string, Obs[]> = {};
  for (const obs of active) {
    const cat = (obs.category as string) ?? "other";
    (byCategory[cat] ??= []).push(obs);
  }

  // Flag count: observations with flag H, L, HH, LL, CRITICAL, PANIC
  const flaggedObs = active.filter((o) => o.flag && o.flag !== null && o.flag !== "");

  return NextResponse.json({
    documentId:       upload.documentId,
    fileName:         upload.fileName,
    uploadTimestamp:  upload.uploadTimestamp.toISOString(),
    processingStatus: upload.processingStatus,

    ocr: upload.ocrResult
      ? {
          status:        upload.ocrResult.ocrStatus,
          pageCount:     upload.ocrResult.pageCount,
          avgConfidence: upload.ocrResult.avgConfidence,
          processedAt:   upload.ocrResult.processedAt?.toISOString(),
        }
      : null,

    classification: upload.classification
      ? {
          documentType:            upload.classification.documentType,
          confidence:              upload.classification.confidence,
          secondaryDocumentTypes:  upload.classification.secondaryDocumentTypes,
        }
      : null,

    bins: upload.binAssignment
      ? {
          assignedBins:              upload.binAssignment.assignedBins,
          classificationConfidence:  upload.binAssignment.classificationConfidence,
        }
      : null,

    sensitivity: upload.sensitivityProfile
      ? {
          sensitivityLevel: upload.sensitivityProfile.sensitivityLevel,
          privacyTags:      upload.sensitivityProfile.privacyTags,
          flaggedBins:      upload.sensitivityProfile.flaggedBins,
        }
      : null,

    observations: {
      total:            upload.normalizedResult?.totalObservations   ?? 0,
      active:           upload.normalizedResult?.activeObservations  ?? 0,
      superseded:       upload.normalizedResult?.supersededCount     ?? 0,
      converted:        upload.normalizedResult?.conversionCount     ?? 0,
      missingCanonical: upload.normalizedResult?.missingCanonical    ?? 0,
      flagged:          flaggedObs.length,
      byCategory:       Object.fromEntries(
        Object.entries(byCategory).map(([cat, obs]) => [cat, obs.length])
      ),
    },

    // Top-level observations for display (active, sorted by date desc)
    recentObservations: active
      .sort((a, b) => {
        const da = (a.observation_date as string) ?? "";
        const db = (b.observation_date as string) ?? "";
        return db.localeCompare(da);
      })
      .slice(0, 12)
      .map((o) => ({
        name:         o.display_name ?? o.canonical_test_name ?? o.original_test_name,
        value:        o.normalized_value,
        unit:         o.normalized_unit,
        flag:         o.flag,
        category:     o.category,
        date:         o.observation_date,
        reference:    o.reference_range_normalized,
      })),
  });
}

/**
 * GET /api/health-data/observations
 *
 * All health observations for the authenticated user across all documents.
 * Designed for the observations list/table view.
 *
 * Filters (query params):
 *   ?category=haematology,lipids    — one or more categories
 *   ?bin=cardiovascular,general_labs
 *   ?flag=H,L                       — flagged observations only
 *   ?metric=Hemoglobin              — canonical_metric_name filter
 *   ?from=2024-01-01                — observation_date >= from (ISO date)
 *   ?to=2025-12-31                  — observation_date <= to
 *   ?documentId=uuid                — single document
 *   ?page=1&pageSize=50
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = session.user.email;
  const url = new URL(req.url);

  const categories  = url.searchParams.get("category")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const bins        = url.searchParams.get("bin")?.split(",").map((s) => s.trim()).filter(Boolean)      ?? [];
  const flags       = url.searchParams.get("flag")?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) ?? [];
  const metric      = url.searchParams.get("metric")   ?? undefined;
  const fromDate    = url.searchParams.get("from")     ?? undefined;
  const toDate      = url.searchParams.get("to")       ?? undefined;
  const documentId  = url.searchParams.get("documentId") ?? undefined;
  const page        = Math.max(1, parseInt(url.searchParams.get("page")     ?? "1", 10));
  const pageSize    = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "50", 10)));

  const prisma = getPrisma();

  const where: Record<string, unknown> = { userEmail };
  if (categories.length)  where.category           = { in: categories };
  if (bins.length)        where.bin                = { in: bins };
  if (flags.length)       where.flag               = { in: flags };
  if (metric)             where.canonicalMetricName = metric;
  if (documentId)         where.documentId          = documentId;
  if (fromDate || toDate) {
    where.observationDate = {
      ...(fromDate ? { gte: new Date(fromDate) } : {}),
      ...(toDate   ? { lte: new Date(toDate)   } : {}),
    };
  }

  const [total, rows] = await Promise.all([
    prisma.healthObservation.count({ where }),
    prisma.healthObservation.findMany({
      where,
      orderBy: [{ observationDate: "desc" }, { canonicalMetricName: "asc" }],
      skip:  (page - 1) * pageSize,
      take:  pageSize,
      select: {
        observationId:       true,
        documentId:          true,
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
        conversionApplied:   true,
      },
    }),
  ]);

  return NextResponse.json({
    observations: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/**
 * DELETE /api/health-data/observations
 *
 * Body:
 *   { observationIds: string[] }
 *
 * Deletes selected observations for the authenticated user only.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const observationIds =
    typeof body === "object" && body && "observationIds" in body
      ? (body as { observationIds?: unknown }).observationIds
      : undefined;

  if (!Array.isArray(observationIds) || observationIds.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "observationIds must be an array of strings" },
      { status: 422 }
    );
  }

  if (observationIds.length === 0) {
    return NextResponse.json({ ok: true, deletedCount: 0 });
  }

  const prisma = getPrisma();
  const result = await prisma.healthObservation.deleteMany({
    where: {
      userEmail: session.user.email,
      observationId: { in: observationIds },
    },
  });

  return NextResponse.json({ ok: true, deletedCount: result.count });
}

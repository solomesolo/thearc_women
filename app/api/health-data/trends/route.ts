/**
 * GET /api/health-data/trends
 *
 * Longitudinal trend data grouped by canonical metric name.
 * Returns one series per metric, each series is an array of { date, value, flag, unit }.
 * Designed for time-series chart consumption.
 *
 * Filters:
 *   ?metric=Hemoglobin,Ferritin    — limit to specific metrics (comma-separated)
 *   ?category=haematology,iron
 *   ?bin=general_labs
 *   ?from=2023-01-01&to=2025-12-31
 *   ?minPoints=2                   — only include metrics with >= N data points (default 2)
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

  const metrics    = url.searchParams.get("metric")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const categories = url.searchParams.get("category")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const bins       = url.searchParams.get("bin")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const fromDate   = url.searchParams.get("from") ?? undefined;
  const toDate     = url.searchParams.get("to")   ?? undefined;
  const minPoints  = Math.max(1, parseInt(url.searchParams.get("minPoints") ?? "2", 10));

  const prisma = getPrisma();

  const where: Record<string, unknown> = {
    userEmail,
    observationDate:     { not: null },
    canonicalMetricName: { not: null },
  };

  if (metrics.length)    where.canonicalMetricName = { in: metrics };
  if (categories.length) where.category             = { in: categories };
  if (bins.length)       where.bin                  = { in: bins };

  if (fromDate || toDate) {
    where.observationDate = {
      ...(fromDate ? { gte: new Date(fromDate) } : {}),
      ...(toDate   ? { lte: new Date(toDate)   } : {}),
      not: null,
    };
  }

  const rows = await prisma.healthObservation.findMany({
    where,
    orderBy: [{ canonicalMetricName: "asc" }, { observationDate: "asc" }],
    select: {
      canonicalMetricName: true,
      displayName:         true,
      category:            true,
      bin:                 true,
      observationDate:     true,
      numericValue:        true,
      valueText:           true,
      unit:                true,
      referenceRange:      true,
      flag:                true,
      documentId:          true,
    },
  });

  // Group into per-metric series
  const seriesMap = new Map<string, {
    metric:    string;
    label:     string;
    category:  string;
    bin:       string;
    unit:      string | null;
    referenceRange: string | null;
    points:    { date: string; value: number | null; valueText: string | null; flag: string | null; documentId: string }[];
  }>();

  for (const row of rows) {
    const key = row.canonicalMetricName!;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        metric:         key,
        label:          row.displayName ?? key,
        category:       row.category,
        bin:            row.bin,
        unit:           row.unit,
        referenceRange: row.referenceRange,
        points:         [],
      });
    }
    const series = seriesMap.get(key)!;
    // Use the most recent reference range seen
    if (row.referenceRange) series.referenceRange = row.referenceRange;

    series.points.push({
      date:       row.observationDate!.toISOString().slice(0, 10),
      value:      row.numericValue,
      valueText:  row.valueText,
      flag:       row.flag,
      documentId: row.documentId,
    });
  }

  // Filter to series with >= minPoints data points
  const series = Array.from(seriesMap.values())
    .filter((s) => s.points.length >= minPoints)
    .sort((a, b) => a.category.localeCompare(b.category) || a.metric.localeCompare(b.metric));

  return NextResponse.json({
    series,
    totalMetrics: series.length,
    totalPoints:  series.reduce((acc, s) => acc + s.points.length, 0),
  });
}

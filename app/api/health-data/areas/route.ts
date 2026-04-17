/**
 * GET /api/health-data/areas
 *
 * Returns core health-domain cards for navigation.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type AreaKey =
  | "general_metabolic"
  | "cardiovascular"
  | "gynecology_reproductive"
  | "musculoskeletal"
  | "oncology"
  | "mental_health"
  | "respiratory"
  | "gastroenterology";

const AREAS: { key: AreaKey; title: string; categories: string[]; keyMetrics: string[] }[] = [
  {
    key: "general_metabolic",
    title: "General & Metabolic",
    categories: ["metabolic", "lipids", "thyroid", "iron", "vitamins", "inflammation", "other", "haematology"],
    keyMetrics: ["HbA1c", "Glucose", "Ferritin", "TSH", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides"],
  },
  {
    key: "cardiovascular",
    title: "Cardiovascular",
    categories: ["cardiac", "lipids"],
    keyMetrics: ["LDL Cholesterol", "Non-HDL Cholesterol", "ApoB", "Lp(a)", "Triglycerides"],
  },
  {
    key: "gynecology_reproductive",
    title: "Gynecology & Reproductive",
    categories: ["hormones"],
    keyMetrics: ["Progesterone", "Estradiol", "LH", "FSH", "Testosterone"],
  },
  {
    key: "musculoskeletal",
    title: "Musculoskeletal",
    categories: ["musculoskeletal"],
    keyMetrics: ["Vitamin D", "Calcium", "DEXA T-score"],
  },
  {
    key: "oncology",
    title: "Oncology",
    categories: ["oncology"],
    keyMetrics: ["CA-125", "CEA", "PSA"],
  },
  {
    key: "mental_health",
    title: "Mental Health",
    categories: ["mental_health"],
    keyMetrics: ["PHQ-9", "GAD-7"],
  },
  {
    key: "respiratory",
    title: "Respiratory",
    categories: ["respiratory"],
    keyMetrics: ["FEV1", "Peak Flow"],
  },
  {
    key: "gastroenterology",
    title: "Gastroenterology",
    categories: ["gastroenterology"],
    keyMetrics: ["ALT", "AST", "ALP", "GGT", "Bilirubin Total"],
  },
];

const ALERT_FLAGS = ["H", "HH", "L", "LL", "CRITICAL", "PANIC"] as const;

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const userEmail = session.user.email;

  // Pull recent observations once (bounded) for computing card status quickly.
  const recentObs = await prisma.healthObservation.findMany({
    where: { userEmail },
    orderBy: [{ observationDate: "desc" }, { updatedAt: "desc" }],
    take: 1200,
    select: {
      canonicalMetricName: true,
      displayName: true,
      category: true,
      flag: true,
      observationDate: true,
      numericValue: true,
      unit: true,
    },
  });

  const cards = AREAS.map((a) => {
    const inArea = recentObs.filter((o) => a.categories.includes(o.category));
    const flagged = inArea.find((o) => o.flag && ALERT_FLAGS.includes(o.flag as any));
    const latest = inArea.find((o) => o.observationDate != null) ?? null;

    const keyMetric =
      inArea.find((o) => o.canonicalMetricName && a.keyMetrics.includes(o.canonicalMetricName)) ??
      flagged ??
      latest;

    const status = flagged
      ? "Needs attention"
      : inArea.length > 0
      ? "Good"
      : "Unknown";

    return {
      key: a.key,
      title: a.title,
      status,
      lastTestDate: latest?.observationDate?.toISOString() ?? null,
      keyMetric: keyMetric
        ? {
            name: (keyMetric.displayName ?? keyMetric.canonicalMetricName) ?? null,
            value: keyMetric.numericValue,
            unit: keyMetric.unit ?? null,
            flag: keyMetric.flag ?? null,
          }
        : null,
    };
  });

  return NextResponse.json({ areas: cards });
}


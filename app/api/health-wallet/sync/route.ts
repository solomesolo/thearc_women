/**
 * POST /api/health-wallet/sync
 * Body: { documentId: string }
 *
 * Reads HealthObservation rows for the given document, maps them to
 * BiomarkerWalletEntry objects (for localStorage) and upserts UserCheckResult
 * + UserCheckStatus DB records.
 *
 * Returns: { walletEntries: WalletSyncEntry[], checkKeys: string[], summary: UploadSummary }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type BiomarkerResultStatus = "in_range" | "borderline" | "out_of_range" | "unknown";

export interface WalletSyncEntry {
  biomarkerKey: string;
  biomarkerName: string;
  date: string;
  value: string;
  numericValue: number | null;
  notes: string;
  fileName: string | null;
  fileType: string | null;
  status: BiomarkerResultStatus;
  /** Months since the test date. null if no date on file. */
  monthsSinceTest: number | null;
  /** True if monthsSinceTest > recommended retesting interval for this bin */
  isOverdue: boolean;
  /** How many months overdue (0 if not overdue) */
  overdueByMonths: number;
  savedAt: string;
}

export interface UploadSummary {
  totalAdded: number;
  outOfRange: { name: string; value: string; date: string }[];
  borderline: { name: string; value: string; date: string }[];
  overdue: { name: string; monthsOverdue: number; recommendedEveryMonths: number }[];
}

// Coarse bin slug → canonical check_key mapping
const BIN_TO_CHECK_KEY: Record<string, string> = {
  general_labs:         "preventive_baseline",
  haematology:          "preventive_baseline",
  lipids:               "preventive_baseline",
  metabolic:            "preventive_baseline",
  liver:                "preventive_baseline",
  kidney:               "preventive_baseline",
  thyroid:              "thyroid_panel",
  iron:                 "iron_panel",
  hormones:             "hormone_panel",
  reproductive:         "hormone_panel",
  vitamins:             "preventive_baseline",
  inflammatory:         "preventive_baseline",
  cardiovascular:       "cardiovascular_panel",
  diabetes:             "metabolic_health_panel",
  glucose:              "metabolic_health_panel",
  std:                  "std_sti_screen",
  sti:                  "std_sti_screen",
  sexually_transmitted: "std_sti_screen",
  cervical:             "cervical_screening",
  pap:                  "cervical_screening",
  breast:               "breast_health_check",
  colon:                "colorectal_cancer_screen",
  bowel:                "colorectal_cancer_screen",
  bone:                 "bone_density_scan",
  dexa:                 "bone_density_scan",
  mental:               "mental_health_assessment",
  sleep:                "sleep_assessment",
  skin:                 "dermatology_screening",
  dental:               "dental_health_check",
  vision:               "eye_health_check",
  hearing:              "hearing_test",
};

// Recommended retesting interval in months per bin
const BIN_RETEST_MONTHS: Record<string, number> = {
  general_labs:         12,
  haematology:          12,
  lipids:               12,
  metabolic:            12,
  liver:                12,
  kidney:               12,
  thyroid:              12,
  iron:                 6,
  hormones:             6,
  reproductive:         6,
  vitamins:             12,
  inflammatory:         12,
  cardiovascular:       12,
  diabetes:             6,
  glucose:              6,
  std:                  12,
  sti:                  12,
  sexually_transmitted: 12,
  cervical:             36,
  pap:                  36,
  breast:               24,
  colon:                120,
  bowel:                120,
  bone:                 24,
  dexa:                 24,
  mental:               12,
  sleep:                12,
  skin:                 12,
  dental:               6,
  vision:               24,
  hearing:              24,
};

function flagToStatus(flag: string | null | undefined): BiomarkerResultStatus {
  if (!flag) return "unknown";
  const f = flag.toUpperCase();
  if (f === "HH" || f === "LL") return "out_of_range";
  if (f === "H" || f === "L") return "borderline";
  return "unknown";
}

function toKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  let documentId: string;
  try {
    const body = await req.json();
    documentId = body.documentId;
    if (!documentId) throw new Error("missing");
  } catch {
    return NextResponse.json({ error: "documentId required" }, { status: 400 });
  }

  const prisma = getPrisma();

  // Verify ownership
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail },
    select: { documentId: true, fileName: true, mimeType: true },
  });
  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Fetch observations
  const observations = await prisma.healthObservation.findMany({
    where: { documentId, userEmail },
    orderBy: [{ observationDate: "desc" }, { canonicalMetricName: "asc" }],
  });

  if (!observations.length) {
    return NextResponse.json({
      walletEntries: [],
      checkKeys: [],
      summary: { totalAdded: 0, outOfRange: [], borderline: [], overdue: [] },
    });
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const walletEntries: WalletSyncEntry[] = [];
  const checkKeySet = new Set<string>();

  // Summary accumulators
  const outOfRange: UploadSummary["outOfRange"] = [];
  const borderlineList: UploadSummary["borderline"] = [];
  const overdueList: UploadSummary["overdue"] = [];
  const seenOverdueBins = new Set<string>();

  for (const obs of observations) {
    const metricName = obs.canonicalMetricName ?? obs.displayName ?? obs.metricName ?? "unknown";
    const biomarkerKey = toKey(metricName);
    const dateStr = obs.observationDate
      ? obs.observationDate.toISOString().slice(0, 10)
      : "";
    const valueStr = obs.valueText ?? (obs.numericValue != null ? String(obs.numericValue) : "");
    const status = flagToStatus(obs.flag);
    const binKey = obs.bin?.toLowerCase() ?? "";

    // Staleness
    const retestMonths = BIN_RETEST_MONTHS[binKey] ?? 12;
    let monthsSinceTest: number | null = null;
    let isOverdue = false;
    let overdueByMonths = 0;

    if (obs.observationDate) {
      monthsSinceTest = monthsBetween(obs.observationDate, now);
      if (monthsSinceTest > retestMonths) {
        isOverdue = true;
        overdueByMonths = monthsSinceTest - retestMonths;
      }
    }

    walletEntries.push({
      biomarkerKey,
      biomarkerName: obs.displayName ?? metricName,
      date: dateStr,
      value: valueStr + (obs.unit ? ` ${obs.unit}` : ""),
      numericValue: obs.numericValue ?? null,
      notes: obs.referenceRange ? `Ref: ${obs.referenceRange}` : "",
      fileName: upload.fileName,
      fileType: upload.mimeType,
      status,
      monthsSinceTest,
      isOverdue,
      overdueByMonths,
      savedAt: nowISO,
    });

    // Map bin → checkKey
    const ckRaw = BIN_TO_CHECK_KEY[binKey] ?? "preventive_baseline";
    checkKeySet.add(ckRaw);

    // Summary: out of range / borderline
    const bioName = obs.displayName ?? metricName;
    const valLabel = valueStr + (obs.unit ? ` ${obs.unit}` : "");
    if (status === "out_of_range") {
      outOfRange.push({ name: bioName, value: valLabel, date: dateStr });
    } else if (status === "borderline") {
      borderlineList.push({ name: bioName, value: valLabel, date: dateStr });
    }

    // Summary: overdue — one entry per bin (avoid repeating for each biomarker in the same panel)
    if (isOverdue && !seenOverdueBins.has(binKey)) {
      seenOverdueBins.add(binKey);
      overdueList.push({ name: bioName, monthsOverdue: overdueByMonths, recommendedEveryMonths: retestMonths });
    }
  }

  const checkKeys = Array.from(checkKeySet);

  // Upsert UserCheckStatus → result_uploaded for each matched check
  const firstObs = observations.find((o) => o.observationDate != null);
  const testDate = firstObs?.observationDate ?? null;

  for (const checkKey of checkKeys) {
    try {
      await prisma.userCheckStatus.upsert({
        where: { user_check_status_unique: { userEmail, checkKey } },
        update: { status: "result_uploaded", updatedAt: new Date() },
        create: { userEmail, checkKey, status: "result_uploaded" },
      });

      await prisma.userCheckResult.create({
        data: {
          userEmail,
          checkKey,
          documentId,
          fileName: upload.fileName,
          fileType: upload.mimeType,
          source: "lab",
          testDate,
          notes: `Synced from ${upload.fileName}`,
        },
      });
    } catch (err) {
      console.error(`[wallet-sync] error upserting checkKey=${checkKey}:`, err);
    }
  }

  const summary: UploadSummary = {
    totalAdded: walletEntries.length,
    outOfRange,
    borderline: borderlineList,
    overdue: overdueList,
  };

  return NextResponse.json({ walletEntries, checkKeys, summary });
}

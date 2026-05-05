import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

function toCsvRow(vals: (string | number | boolean | null | undefined)[]): string {
  return vals.map((v) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",");
}

function buildCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [headers.join(","), ...rows.map(toCsvRow)].join("\n");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const [observations, checkStatuses, reminders] = await Promise.all([
    prisma.healthObservation.findMany({
      where: { userEmail: email },
      select: { canonicalMetricName: true, displayName: true, numericValue: true, valueText: true, unit: true, flag: true, referenceRange: true, observationDate: true, bin: true },
      orderBy: { observationDate: "desc" },
    }),
    prisma.userCheckStatus.findMany({ where: { userEmail: email } }),
    prisma.userCheckReminder.findMany({ where: { userEmail: email } }),
  ]);

  const biomarkerCsv = buildCsv(
    ["name", "display_name", "value_text", "numeric_value", "unit", "flag", "reference_range", "observation_date", "category"],
    observations.map((o) => [o.canonicalMetricName, o.displayName, o.valueText, o.numericValue, o.unit, o.flag, o.referenceRange, o.observationDate?.toISOString() ?? "", o.bin])
  );

  const checksCsv = buildCsv(
    ["check_key", "status", "updated_at"],
    checkStatuses.map((c) => [c.checkKey, c.status, c.updatedAt.toISOString()])
  );

  const remindersCsv = buildCsv(
    ["check_key", "remind_at", "timeframe", "channel", "status"],
    reminders.map((r) => [r.checkKey, r.remindAt.toISOString(), r.timeframe ?? "", r.channel, r.status])
  );

  const combined = [
    "=== BIOMARKERS ===", biomarkerCsv,
    "", "=== CHECK STATUS ===", checksCsv,
    "", "=== REMINDERS ===", remindersCsv,
  ].join("\n");

  return new NextResponse(combined, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="arc-health-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { verifyFeedToken } from "@/lib/calendar/oauthState";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const prisma = getPrisma();

  try {
    // First try DB lookup, fall back to signed-token verification (works before migration)
    let userEmail: string | null = null;
    try {
      const feed = await prisma.connectedCalendar.findUnique({ where: { icalFeedToken: token } });
      userEmail = feed?.userEmail ?? null;
    } catch {
      // DB unavailable
    }
    if (!userEmail) userEmail = verifyFeedToken(token);
    if (!userEmail) return new NextResponse("Not found", { status: 404 });

    // Alias for the rest of the handler
    const feed = { userEmail };

    const reminders = await prisma.userCheckReminder.findMany({
      where: { userEmail: feed.userEmail, status: "active" },
      orderBy: { remindAt: "asc" },
    }).catch(() => []);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Arc//Health Reminders//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:The Arc Health`,
      `X-WR-CALDESC:Your personalised health reminders from The Arc`,
      `X-WR-TIMEZONE:UTC`,
    ];

    const CHECK_LABELS: Record<string, string> = {
      preventive_baseline: "Preventive Blood Panel",
      iron_panel: "Iron Panel",
      thyroid_panel: "Thyroid Panel",
      vitamin_d: "Vitamin D Test",
      hormonal_panel: "Hormonal Panel",
      hba1c: "HbA1c Blood Sugar",
      lipid_panel: "Lipid Panel",
      cervical_screening: "Cervical Screening",
      breast_screening: "Breast Screening",
      skin_check: "Skin Check",
      bone_density: "Bone Density Scan",
      additional_biomarkers: "Additional Biomarkers",
    };

    for (const r of reminders) {
      const start = new Date(r.remindAt);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h block
      const label = CHECK_LABELS[r.checkKey] ?? r.checkKey.replace(/_/g, " ");
      const uid = `arc-reminder-${r.id}@thearc.com`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${icsDate(new Date())}`);
      lines.push(`DTSTART:${icsDate(start)}`);
      lines.push(`DTEND:${icsDate(end)}`);
      lines.push(`SUMMARY:${icsEscape(`The Arc — ${label}`)}`);
      lines.push(`DESCRIPTION:${icsEscape(`Reminder to schedule or complete your ${label}. Visit thearc.com to track your results.`)}`);
      lines.push(`URL:https://thearc.com/results/overview`);
      lines.push(`CATEGORIES:Health`);
      lines.push("STATUS:CONFIRMED");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return new NextResponse(lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="arc-health.ics"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse("Server error", { status: 500 });
  }
}

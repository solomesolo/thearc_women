import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateIcal } from "@/lib/reminders/generateIcal";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await context.params;

    const reminder = await prisma.userCheckReminder.findUnique({ where: { id } });
    if (!reminder || reminder.userEmail !== session.user.email) {
      return new NextResponse("Not found", { status: 404 });
    }

    const dtstart = reminder.remindAt;
    const dtend = new Date(dtstart.getTime() + 60 * 60 * 1000);

    const ical = generateIcal({
      uid: `reminder-${reminder.id}@thearc.com`,
      summary: `Health check: ${reminder.checkKey}`,
      description: `Reminder from The Arc Woman.\nCheck: ${reminder.checkKey}`,
      dtstart,
      dtend,
      url: process.env.NEXTAUTH_URL,
    });

    return new NextResponse(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="reminder-${reminder.checkKey}.ics"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/reminders/[id]/ical]", err);
    return new NextResponse("Server error", { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const VALID_TIMINGS = ["tomorrow", "in_3_days", "next_week", "custom"];

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.emailReminders === "boolean") data.emailReminders = body.emailReminders;
  if (typeof body.calendarReminders === "boolean") data.calendarReminders = body.calendarReminders;
  if (typeof body.weeklySummary === "boolean") data.weeklySummary = body.weeklySummary;
  if (typeof body.defaultReminderTiming === "string" && VALID_TIMINGS.includes(body.defaultReminderTiming)) {
    data.defaultReminderTiming = body.defaultReminderTiming;
  }

  const settings = await prisma.userSettings.upsert({
    where: { userEmail: email },
    update: data,
    create: { userEmail: email, ...data },
  });

  return NextResponse.json(settings);
}

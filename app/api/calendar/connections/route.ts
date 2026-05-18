import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { signFeedToken } from "@/lib/calendar/oauthState";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();

  try {
    const connections = await prisma.connectedCalendar.findMany({
      where: { userEmail: session.user.email },
      select: { id: true, provider: true, label: true, calendarId: true, icalFeedToken: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ connections });
  } catch {
    // Table may not exist yet — return empty list, signed tokens still work
    return NextResponse.json({ connections: [] });
  }
}

// POST: get or create a calendar connection for a provider.
// The ICS token is derived deterministically from the user email so the
// feed URL works immediately even if the DB write fails.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const body = await req.json().catch(() => ({}));
  const provider: string = body.provider ?? "ical";
  const regenerate: boolean = body.regenerate === true;

  const LABELS: Record<string, string> = {
    google: "Google Calendar",
    outlook: "Outlook Calendar",
    ical: "iCalendar",
  };

  // Always derive a stable signed token — works without DB
  const token = signFeedToken(email);
  const id = `${provider}:${email}`;

  // Try to persist to DB, but never fail the request if it throws
  try {
    const existing = await prisma.connectedCalendar.findFirst({
      where: { userEmail: email, provider },
    });

    if (existing && !regenerate) {
      return NextResponse.json({ token: existing.icalFeedToken ?? token, id: existing.id });
    }

    const record = existing
      ? await prisma.connectedCalendar.update({
          where: { id: existing.id },
          data: { icalFeedToken: token, label: LABELS[provider] ?? provider },
        })
      : await prisma.connectedCalendar.create({
          data: { id, userEmail: email, provider, label: LABELS[provider] ?? provider, icalFeedToken: token },
        });

    return NextResponse.json({ token: record.icalFeedToken ?? token, id: record.id });
  } catch {
    // DB unavailable (table missing etc.) — return the signed token anyway
    return NextResponse.json({ token, id });
  }
}

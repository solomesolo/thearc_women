import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Calendar OAuth integration is not yet implemented.
  // Return connected email from session; calendar status is always disconnected for now.
  return NextResponse.json({
    email: session.user.email,
    calendars: [],
    defaultCalendar: null,
  });
}

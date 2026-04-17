import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentLogs, logAction } from "@/lib/plan/queries";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "20");
  const logs = await getRecentLogs(session.user.email, limit);
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const log = await logAction(session.user.email, {
    planId: body?.planId ?? null,
    itemId: body?.itemId ?? null,
    note: body?.note,
  });
  return NextResponse.json(log, { status: 201 });
}

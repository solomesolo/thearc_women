import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { PathwayTimeframe } from "@/lib/recommendations-engine/types";

function getCallerEmail(request: NextRequest, sessionEmail: string | null | undefined) {
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  return sessionEmail ?? (anonHeader ? `anon:${anonHeader}` : null);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; checkKey: string }> },
) {
  const session = await getServerSession(authOptions);
  const callerEmail = getCallerEmail(request, session?.user?.email);
  if (!callerEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, checkKey } = await params;
  const targetEmail = decodeURIComponent(userId);
  if (callerEmail !== targetEmail && !targetEmail.startsWith("anon:")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { remindAt?: unknown; timeframe?: unknown; channel?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const remindAtRaw = body?.remindAt;
  const remindAt = typeof remindAtRaw === "string" ? new Date(remindAtRaw) : null;
  if (!remindAt || Number.isNaN(remindAt.getTime())) {
    return Response.json({ error: "remindAt must be an ISO date string" }, { status: 400 });
  }

  const timeframe =
    typeof body?.timeframe === "string" ? (body.timeframe as PathwayTimeframe) : null;
  const channel = typeof body?.channel === "string" ? body.channel : "app";

  const reminder = await prisma.userCheckReminder.create({
    data: {
      userEmail: targetEmail,
      checkKey: decodeURIComponent(checkKey),
      remindAt,
      timeframe,
      channel,
      status: "active",
    },
  });

  // Also mark status as reminder_set if still missing.
  const ck = decodeURIComponent(checkKey);
  const current = await prisma.userCheckStatus.findUnique({
    where: { user_check_status_unique: { userEmail: targetEmail, checkKey: ck } },
    select: { status: true },
  });
  if (!current) {
    await prisma.userCheckStatus.create({
      data: { userEmail: targetEmail, checkKey: ck, status: "reminder_set" },
    });
  } else if (String(current.status) === "missing" || String(current.status) === "MISSING") {
    await prisma.userCheckStatus.update({
      where: { user_check_status_unique: { userEmail: targetEmail, checkKey: ck } },
      data: { status: "reminder_set" },
    });
  }

  return Response.json({
    id: reminder.id,
    remindAt: reminder.remindAt.toISOString(),
    timeframe: reminder.timeframe,
    channel: reminder.channel,
    status: reminder.status,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; checkKey: string }> },
) {
  const session = await getServerSession(authOptions);
  const callerEmail = getCallerEmail(request, session?.user?.email);
  if (!callerEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, checkKey } = await params;
  const targetEmail = decodeURIComponent(userId);
  if (callerEmail !== targetEmail && !targetEmail.startsWith("anon:")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const ck = decodeURIComponent(checkKey);
  await prisma.userCheckReminder.updateMany({
    where: { userEmail: targetEmail, checkKey: ck, status: "active" },
    data: { status: "dismissed" },
  });

  return Response.json({ ok: true });
}


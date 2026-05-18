import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_NOMINATIONS = 2;

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.appUser.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ nominations: [], count: 0 });

  let nominations: { id: string; friendName: string; friendEmail: string; inviteCode: string | null; createdAt: Date }[] = [];
  try {
    nominations = await prisma.nomination.findMany({
      where: { nominatorId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // Table may not exist yet (migration pending) — return empty list gracefully
    return NextResponse.json({ nominations: [], count: 0 });
  }

  return NextResponse.json({ nominations, count: nominations.length });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { friendName, friendEmail } = body as {
      friendName?: string;
      friendEmail?: string;
    };

    if (!friendName?.trim() || !friendEmail?.trim()) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const user = await prisma.appUser.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    const existingCount = await prisma.nomination.count({
      where: { nominatorId: user.id },
    });

    if (existingCount >= MAX_NOMINATIONS) {
      return NextResponse.json({ error: "nomination_limit_reached" }, { status: 403 });
    }

    // Generate a unique invite code
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.inviteCode.findUnique({ where: { code } });
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    await prisma.inviteCode.create({
      data: {
        code,
        status: "available",
        createdFor: friendEmail.trim().toLowerCase(),
        createdBy: user.id,
      },
    });

    await prisma.nomination.create({
      data: {
        nominatorId: user.id,
        friendName: friendName.trim(),
        friendEmail: friendEmail.trim().toLowerCase(),
        inviteCode: code,
      },
    });

    return NextResponse.json({ success: true, nominationsRemaining: MAX_NOMINATIONS - existingCount - 1 });
  } catch (err) {
    console.error("[nominations/post]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

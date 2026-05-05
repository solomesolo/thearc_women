import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const CONFIRM_TOKENS = ["DELETE", "LÖSCHEN"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const body = await req.json().catch(() => ({}));
  if (!CONFIRM_TOKENS.includes(body.confirmText)) {
    return NextResponse.json({ error: "Confirmation text required" }, { status: 400 });
  }

  const prisma = getPrisma();

  // Schedule deletion for 24 hours from now, giving the user time to cancel
  const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.deletionRequest.upsert({
    where: { userEmail: email },
    update: { requestedAt: new Date(), scheduledAt, status: "pending" },
    create: { userEmail: email, scheduledAt },
  });

  return NextResponse.json({ ok: true, scheduledAt: scheduledAt.toISOString() });
}

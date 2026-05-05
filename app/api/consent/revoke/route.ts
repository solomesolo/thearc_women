import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  await prisma.userConsent.upsert({
    where: { userEmail: email },
    update: { isActive: false, revokedAt: new Date() },
    create: { userEmail: email, isActive: false, revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

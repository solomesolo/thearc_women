import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const MAX_ACTIVE = 3;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ARC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();

  const codes = await prisma.accessCode.findMany({
    where: { ownerEmail: session.user.email },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ codes });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  const activeCount = await prisma.accessCode.count({
    where: { ownerEmail: email, status: "available" },
  });

  if (activeCount >= MAX_ACTIVE) {
    return NextResponse.json(
      { error: "Maximum 3 active access codes allowed." },
      { status: 400 }
    );
  }

  // Ensure uniqueness with retry
  let code = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCode();
    const existing = await prisma.accessCode.findUnique({ where: { code: candidate } });
    if (!existing) { code = candidate; break; }
  }
  if (!code) return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
  const newCode = await prisma.accessCode.create({
    data: { ownerEmail: email, code, expiresAt },
  });

  return NextResponse.json({ code: newCode }, { status: 201 });
}

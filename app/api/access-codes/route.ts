import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { signAccessCode } from "@/lib/access-codes/signedCodes";

const MAX_ACTIVE = 3;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();

  try {
    const codes = await prisma.accessCode.findMany({
      where: { ownerEmail: session.user.email },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ codes });
  } catch {
    return NextResponse.json({ codes: [] });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const prisma = getPrisma();

  // Always generate a signed code first — works without DB
  const signed = signAccessCode(email);

  try {
    const activeCount = await prisma.accessCode.count({
      where: { ownerEmail: email, status: "available" },
    });

    if (activeCount >= MAX_ACTIVE) {
      return NextResponse.json({ error: "Maximum 3 active access codes allowed." }, { status: 400 });
    }

    const newCode = await prisma.accessCode.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ownerEmail: email, code: signed.code, token: signed.token, expiresAt: signed.expiresAt } as any,
    });

    return NextResponse.json({ code: newCode }, { status: 201 });
  } catch {
    // DB unavailable — return a signed offline code the client can persist locally
    return NextResponse.json({
      code: {
        id: `offline:${signed.code}`,
        code: signed.code,
        token: signed.token,
        status: "available",
        createdAt: new Date().toISOString(),
        expiresAt: signed.expiresAt.toISOString(),
        usedAt: null,
        offline: true,
      },
    }, { status: 201 });
  }
}

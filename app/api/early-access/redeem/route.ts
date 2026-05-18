import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body as { code?: string };

    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: "missing_code" }, { status: 400 });
    }

    let normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    // Normalize ARCUHQPWV → ARC-UHQPWV (in case input arrived without dash)
    if (/^ARC[A-Z0-9]{6}$/.test(normalized)) {
      normalized = "ARC-" + normalized.slice(3);
    }

    const record = await prisma.accessCode.findUnique({
      where: { code: normalized },
    });

    if (!record || record.status !== "available") {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("[early-access/redeem]", err);
    return NextResponse.json({ valid: false, error: "internal" }, { status: 500 });
  }
}

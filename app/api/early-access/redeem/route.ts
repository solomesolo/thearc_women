import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalize(raw: string): string {
  let s = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  // Accept ARCUHQPWV → ARC-UHQPWV
  if (/^ARC[A-Z0-9]{6}$/.test(s)) s = "ARC-" + s.slice(3);
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body as { code?: string };
    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: "missing_code" }, { status: 400 });
    }

    const normalized = normalize(code);

    // ── 1. Check env-var master codes (no DB needed) ─────────────────────────
    // Set INVITE_CODES in Vercel env as a comma-separated list, e.g. "ARC-F369GX,ARC-ABCDEF"
    const masterCodes = (process.env.INVITE_CODES ?? "")
      .split(",")
      .map((c) => normalize(c))
      .filter(Boolean);
    if (masterCodes.includes(normalized)) {
      return NextResponse.json({ valid: true });
    }

    // ── 2. Check database ─────────────────────────────────────────────────────
    try {
      const record = await prisma.accessCode.findUnique({ where: { code: normalized } });
      if (!record || record.status !== "available") {
        return NextResponse.json({ valid: false });
      }
      return NextResponse.json({ valid: true });
    } catch (dbErr) {
      console.error("[early-access/redeem] DB error (table may not exist yet):", dbErr);
      return NextResponse.json({ valid: false });
    }
  } catch (err) {
    console.error("[early-access/redeem]", err);
    return NextResponse.json({ valid: false, error: "internal" }, { status: 500 });
  }
}

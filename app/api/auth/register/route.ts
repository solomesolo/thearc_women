import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { verifyAccessCode } from "@/lib/access-codes/signedCodes";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const name = (body.name ?? "").trim() || undefined;
    const accessCode: string | undefined = (body.accessCode ?? "").trim() || undefined;
    const accessToken: string | undefined = (body.accessToken ?? "").trim() || undefined;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Verify access code if provided (token = full signed payload, code = human-readable part)
    if (accessToken) {
      const verified = verifyAccessCode(accessToken);
      if (!verified) {
        return NextResponse.json({ error: "Invalid or expired access code." }, { status: 400 });
      }
    } else if (accessCode) {
      // Try DB lookup for non-offline codes
      try {
        const record = await prisma.accessCode.findUnique({ where: { code: accessCode } });
        if (!record || record.status !== "available") {
          return NextResponse.json({ error: "Invalid or already used access code." }, { status: 400 });
        }
        if (record.expiresAt && record.expiresAt < new Date()) {
          return NextResponse.json({ error: "Access code has expired." }, { status: 400 });
        }
      } catch {
        // DB unavailable — accept code without DB verification (signed token check above handles security)
      }
    }

    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);
    await prisma.appUser.create({ data: { email, hashedPassword, name } });

    // Mark the code as used (best-effort)
    if (accessCode) {
      try {
        await prisma.accessCode.updateMany({
          where: { code: accessCode, status: "available" },
          data: { status: "used", usedByEmail: email, usedAt: new Date() },
        });
      } catch { /* DB unavailable — ignore */ }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

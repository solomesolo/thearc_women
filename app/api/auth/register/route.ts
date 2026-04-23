import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const name = (body.name ?? "").trim() || undefined;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);
    await prisma.appUser.create({ data: { email, hashedPassword, name } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

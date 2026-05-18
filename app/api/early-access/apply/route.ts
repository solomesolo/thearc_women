import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, email, healthAnswer } = body as {
      firstName?: string;
      email?: string;
      healthAnswer?: string;
    };

    if (!firstName?.trim() || !email?.trim() || !healthAnswer?.trim()) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();

    const existing = await prisma.earlyAccessApplicant.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      // Idempotent: already applied — return success so the confirmation shows
      return NextResponse.json({ success: true, alreadyApplied: true });
    }

    await prisma.earlyAccessApplicant.create({
      data: {
        firstName: firstName.trim(),
        email: emailLower,
        healthAnswer: healthAnswer.trim(),
        userState: "applicant",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[early-access/apply]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

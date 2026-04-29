import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminders = await prisma.userCheckReminder.findMany({
      where: { userEmail: session.user.email, status: "active" },
      orderBy: { remindAt: "asc" },
    });

    return NextResponse.json({ reminders });
  } catch (err) {
    console.error("[GET /api/reminders]", err);
    return NextResponse.json({ reminders: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { checkKey, checkName, remindAt, channel } = body as {
      checkKey: string;
      checkName: string;
      remindAt: string;
      channel: "app" | "email";
    };

    if (!checkKey || !checkName || !remindAt) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const remindAtDate = new Date(remindAt);
    if (isNaN(remindAtDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Upsert — one active reminder per check per user
    await prisma.userCheckReminder.deleteMany({
      where: { userEmail: session.user.email, checkKey, status: "active" },
    });

    const reminder = await prisma.userCheckReminder.create({
      data: {
        userEmail: session.user.email,
        checkKey,
        remindAt: remindAtDate,
        channel: channel ?? "app",
        status: "active",
      },
    });

    // Fire-and-forget email when channel is email
    if (channel === "email" && session.user.email) {
      const { sendReminderEmail } = await import("@/lib/reminders/sendReminderEmail");
      sendReminderEmail({
        to: session.user.email,
        checkName,
        remindAt: remindAtDate,
        appUrl: process.env.NEXTAUTH_URL,
      }).catch((e) => console.error("[reminders] email failed:", e));
    }

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reminders]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

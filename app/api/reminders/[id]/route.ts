import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const reminder = await prisma.userCheckReminder.findUnique({ where: { id } });
    if (!reminder || reminder.userEmail !== session.user.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.userCheckReminder.update({
      where: { id },
      data: { status: "dismissed" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/reminders/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

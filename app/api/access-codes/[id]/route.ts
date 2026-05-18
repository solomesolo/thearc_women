import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;
  const { id } = await params;
  const prisma = getPrisma();

  try {
    const code = await prisma.accessCode.findFirst({ where: { id, ownerEmail: email } });
    if (!code) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code.status !== "available") {
      return NextResponse.json({ error: "Only available codes can be revoked" }, { status: 400 });
    }
    await prisma.accessCode.update({ where: { id }, data: { status: "revoked" } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to revoke code" }, { status: 500 });
  }
}

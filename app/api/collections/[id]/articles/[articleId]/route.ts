import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removeFromCollection } from "@/lib/knowledge/queries";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, articleId } = await params;
  try {
    await removeFromCollection(session.user.email, Number(id), Number(articleId));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

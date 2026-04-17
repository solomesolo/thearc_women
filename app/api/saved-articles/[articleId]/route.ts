import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unsaveArticle } from "@/lib/knowledge/queries";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId } = await params;
  await unsaveArticle(session.user.email, Number(articleId));
  return new NextResponse(null, { status: 204 });
}

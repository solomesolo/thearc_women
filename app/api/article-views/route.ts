import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upsertArticleView } from "@/lib/knowledge/queries";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse(null, { status: 204 }); // silent no-op when not logged in

  const body = await req.json().catch(() => ({}));
  const articleId = Number(body?.articleId);
  if (!articleId) return new NextResponse(null, { status: 204 });

  try {
    await upsertArticleView(session.user.email, articleId);
  } catch {
    // Never break the article page over a view tracking failure
  }

  return new NextResponse(null, { status: 204 });
}

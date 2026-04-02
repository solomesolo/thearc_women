import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSavedArticles, toggleSave } from "@/lib/knowledge/queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getSavedArticles(session.user.email);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const articleId = Number(body?.articleId);
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const result = await toggleSave(session.user.email, articleId);
  return NextResponse.json(result);
}

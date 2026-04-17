import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPlanItem } from "@/lib/plan/queries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const title = (body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  try {
    const item = await createPlanItem(session.user.email, Number(id), {
      title,
      description: body?.description,
      timing: body?.timing,
      sortOrder: body?.sortOrder,
      articleId: body?.articleId ?? null,
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
}

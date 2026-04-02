import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updatePlanItem, deletePlanItem } from "@/lib/plan/queries";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const item = await updatePlanItem(session.user.email, Number(itemId), {
      isDone: body?.isDone,
      title: body?.title,
      timing: body?.timing,
      description: body?.description,
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  await deletePlanItem(session.user.email, Number(itemId));
  return new NextResponse(null, { status: 204 });
}

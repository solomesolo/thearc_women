import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPlanItemsBatch } from "@/lib/plan/queries";

type IncomingItem = { title: string; description?: string; timing?: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const planId = Number(id);
  if (!Number.isFinite(planId) || planId < 1) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const rawItems = body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  const items: IncomingItem[] = [];
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const title = String(o.title ?? "").trim();
    if (!title) continue;
    items.push({
      title,
      description: o.description != null ? String(o.description) : undefined,
      timing: o.timing != null ? String(o.timing) : undefined,
    });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "No valid items" }, { status: 400 });
  }

  const rawAid = body?.articleId;
  const articleId =
    rawAid != null && Number(rawAid) > 0 && Number.isFinite(Number(rawAid)) ? Number(rawAid) : null;

  try {
    const created = await createPlanItemsBatch(session.user.email, planId, {
      articleId,
      items,
    });
    return NextResponse.json({ items: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
}

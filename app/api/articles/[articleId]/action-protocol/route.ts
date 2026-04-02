import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractPlanItemsFromActionProtocolBody } from "@/lib/blog/parseActionProtocol";

/**
 * Returns core / key actions from section 8 as plan-ready line items (same parsing as "Core actions to try").
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = await params;
  const id = Number(articleId);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid article" }, { status: 400 });
  }

  const section = await prisma.articleSection.findFirst({
    where: { articleId: id, sectionIndex: 8 },
    select: { body: true },
  });

  if (!section?.body?.trim()) {
    return NextResponse.json({ items: [], count: 0 });
  }

  const items = extractPlanItemsFromActionProtocolBody(section.body);
  return NextResponse.json({ items, count: items.length });
}

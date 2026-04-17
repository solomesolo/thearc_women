import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractPlanItemsFromActionProtocolBody } from "@/lib/blog/parseActionProtocol";

/**
 * Returns core / key actions from section 8 as plan-ready line items (same parsing as "Core actions to try").
 * Segment is named `slug` to match sibling `/api/articles/[slug]` (Next.js forbids mixing `[slug]` and `[articleId]` at the same level).
 * URL still uses numeric id: `/api/articles/42/action-protocol`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const id = Number(slug);
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
  } catch (err) {
    console.error("[GET /api/articles/.../action-protocol]", err);
    return NextResponse.json({ items: [], count: 0 });
  }
}

/**
 * PATCH /api/admin/knowledge/[id]
 * Approve a knowledge article (set approvalStatus to "approved").
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/adminAuth";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await params;
  const article = await prisma.knowledgeArticle.update({
    where: { id },
    data: { approvalStatus: "approved" },
  });
  return Response.json({ id: article.id, approvalStatus: article.approvalStatus });
}

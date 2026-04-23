import { prisma } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const userEmail = decodeURIComponent(userId).trim().toLowerCase();

  const snap = await prisma.profileSnapshot.findFirst({
    where: { userEmail, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ profile_snapshot: snap ?? null });
}


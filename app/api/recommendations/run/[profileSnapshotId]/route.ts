import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAndPersistRecommendations } from "@/lib/recommendations/engine";

export async function POST(_request: Request, context: { params: Promise<{ profileSnapshotId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = _request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { profileSnapshotId } = await context.params;
  const snap = await prisma.profileSnapshot.findUnique({
    where: { id: profileSnapshotId },
    select: { id: true, userEmail: true },
  });
  if (!snap || snap.userEmail !== caller) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const payload = await runAndPersistRecommendations(profileSnapshotId);
  return Response.json(payload);
}


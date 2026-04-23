import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRetakeStateForUser } from "@/lib/profile-engine-a/profileEngine";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const snap = await prisma.profileSnapshot.findFirst({
    where: { userEmail: session.user.email, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!snap) return Response.json({ profile_snapshot: null });

  const retake_state = await computeRetakeStateForUser(session.user.email);
  if (snap.retakeState !== retake_state) {
    await prisma.profileSnapshot.update({
      where: { id: snap.id },
      data: { retakeState: retake_state },
    });
  }

  return Response.json({ profile_snapshot: { ...snap, retakeState: retake_state } });
}


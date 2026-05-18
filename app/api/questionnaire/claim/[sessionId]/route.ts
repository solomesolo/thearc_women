import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId } = await context.params;
  const sess = await prisma.questionnaireSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userEmail: true, status: true },
  });
  if (!sess) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  // Only allow claiming anonymous sessions.
  if (!sess.userEmail.startsWith("anon:")) {
    return Response.json({ ok: true, claimed: false, reason: "not_anon" });
  }

  const anonEmail = sess.userEmail;

  await prisma.questionnaireSession.update({
    where: { id: sessionId },
    data: { userEmail: session.user.email, updatedAt: new Date() },
  });

  // Transfer any profile snapshots owned by the anon identity so the dashboard
  // loads fresh data under the registered user's email, not the stale anon copy.
  await prisma.profileSnapshot.updateMany({
    where: { sessionId, userEmail: anonEmail },
    data: { userEmail: session.user.email },
  });

  return Response.json({ ok: true, claimed: true });
}


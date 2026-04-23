import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAndPersistProfileSnapshot } from "@/lib/profile-engine-a/profileEngine";
import { ensureEngineASeed, ENGINE_A_QUESTIONNAIRE_VERSION } from "@/lib/profile-engine-a/seed";

export async function POST(_request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = _request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  await ensureEngineASeed();

  const { sessionId } = await context.params;
  const sess = await prisma.questionnaireSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userEmail: true, status: true },
  });
  if (!sess || sess.userEmail !== caller) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (sess.status !== "in_progress") {
    return new Response(JSON.stringify({ error: "Session not in progress" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If user is logged in and is building from an anonymous session, "claim" it implicitly.
  if (session?.user?.email && sess.userEmail.startsWith("anon:")) {
    await prisma.questionnaireSession.update({
      where: { id: sessionId },
      data: { userEmail: session.user.email, updatedAt: new Date() },
    });
  }

  const { snapshot, profile } = await buildAndPersistProfileSnapshot({
    sessionId,
    userEmail: session?.user?.email ?? caller,
    questionnaireVersion: ENGINE_A_QUESTIONNAIRE_VERSION,
  });

  return Response.json({ profile_snapshot_id: snapshot.id, profile });
}


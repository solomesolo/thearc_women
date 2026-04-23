import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAndPersistProfileSnapshot } from "@/lib/profile-engine-a/profileEngine";
import { ensureEngineASeed, ENGINE_A_QUESTIONNAIRE_VERSION } from "@/lib/profile-engine-a/seed";

export async function POST(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { sessionId } = await context.params;
  const sess = await prisma.questionnaireSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userEmail: true, status: true },
  });
  const anonOwner = anonHeader ? `anon:${anonHeader}` : null;
  const isOwner = Boolean(sess && (sess.userEmail === caller || (anonOwner && sess.userEmail === anonOwner)));
  if (!sess || !isOwner) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  // If the user is logged in and this session belongs to the browser anon identity,
  // claim it (and any already-built snapshot for the session) to the logged-in email.
  let effectiveUserEmail = sess.userEmail;
  const authEmail = session?.user?.email ?? null;
  if (authEmail && effectiveUserEmail.startsWith("anon:") && effectiveUserEmail !== authEmail) {
    await prisma.questionnaireSession.update({
      where: { id: sessionId },
      data: { userEmail: authEmail, updatedAt: new Date() },
    });
    await prisma.profileSnapshot.updateMany({
      where: { sessionId, userEmail: effectiveUserEmail },
      data: { userEmail: authEmail },
    });
    effectiveUserEmail = authEmail;
  }

  if (sess.status !== "in_progress") {
    // Idempotency: if the session was already completed/built, return the latest snapshot for this session instead of failing.
    const existing = await prisma.profileSnapshot.findFirst({
      where: {
        sessionId: sess.id,
        userEmail: anonOwner ? { in: [effectiveUserEmail, anonOwner] } : effectiveUserEmail,
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      if (authEmail && existing.userEmail.startsWith("anon:") && existing.userEmail !== authEmail) {
        await prisma.profileSnapshot.update({ where: { id: existing.id }, data: { userEmail: authEmail } });
      }
      return Response.json({ profile_snapshot_id: existing.id, profile: existing.rawProfile as any });
    }
    return new Response(JSON.stringify({ error: "Session not in progress" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  await ensureEngineASeed();

  const { snapshot, profile } = await buildAndPersistProfileSnapshot({
    sessionId,
    userEmail: effectiveUserEmail,
    questionnaireVersion: ENGINE_A_QUESTIONNAIRE_VERSION,
  });

  return Response.json({ profile_snapshot_id: snapshot.id, profile });
}


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureEngineASeed, ENGINE_A_QUESTIONNAIRE_VERSION } from "@/lib/profile-engine-a/seed";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await ensureEngineASeed();
  const def = await prisma.questionnaireDefinition.findUnique({
    where: { version: ENGINE_A_QUESTIONNAIRE_VERSION },
    select: { id: true, version: true },
  });
  if (!def) {
    return new Response(JSON.stringify({ error: "Questionnaire definition missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const s = await prisma.questionnaireSession.create({
    data: {
      userEmail: session.user.email,
      questionnaireDefinitionId: def.id,
      status: "in_progress",
      // last_step_number represents the last *completed* step; a new session starts at 0.
      lastStepNumber: 0,
    },
    select: { id: true, status: true },
  });

  return Response.json({ ok: true, session_id: s.id, status: s.status, version: def.version });
}


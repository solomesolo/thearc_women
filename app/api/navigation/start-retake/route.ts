import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureEngineASeed, ENGINE_A_QUESTIONNAIRE_VERSION } from "@/lib/profile-engine-a/seed";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const userEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  await ensureEngineASeed();
  const def = await prisma.questionnaireDefinition.findUnique({
    where: { version: ENGINE_A_QUESTIONNAIRE_VERSION },
    select: { id: true, version: true },
  });
  if (!def) {
    return new Response(JSON.stringify({ error: "Questionnaire definition missing" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const s = await prisma.questionnaireSession.create({
    data: {
      userEmail,
      questionnaireDefinitionId: def.id,
      status: "in_progress",
      lastStepNumber: 0,
    },
    select: { id: true, status: true },
  });

  return Response.json({
    resolved_state: "AUTH_RETAKE_IN_PROGRESS",
    target_route: "/onboarding/basics",
    reason: "retake_session_created",
    session_id: s.id,
  });
}


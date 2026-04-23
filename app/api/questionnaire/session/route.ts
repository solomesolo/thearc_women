import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureEngineASeed, ENGINE_A_QUESTIONNAIRE_VERSION } from "@/lib/profile-engine-a/seed";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
    const userEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
    if (!userEmail) {
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
        userEmail,
        questionnaireDefinitionId: def.id,
        status: "in_progress",
        // last_step_number represents the last *completed* step; a new session starts at 0.
        lastStepNumber: 0,
      },
      select: { id: true, status: true },
    });

    return Response.json({ session_id: s.id, status: s.status, version: def.version });
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "create_session_failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


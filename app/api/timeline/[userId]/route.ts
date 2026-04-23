import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateTimeline } from "@/lib/timeline-engine/timelineEngine";

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { userId } = await context.params;
  const requested = decodeURIComponent(userId).trim().toLowerCase();
  if (!requested || requested !== caller) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    const out = await generateTimeline({ userEmail: requested });
    return Response.json(out);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Failed to generate timeline" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


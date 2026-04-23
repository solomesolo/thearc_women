import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateStatusesForUser } from "@/lib/status-engine/statusEngine";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const anonHeader = (request as any)?.headers?.get?.("x-arc-anon-id")?.trim?.() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const output = await recalculateStatusesForUser({ userEmail: caller });
    return Response.json(output);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "status_recalc_failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}


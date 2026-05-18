import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markResultsSeen, clearNavServerCacheForUser } from "@/lib/navigation-engine/navigationService";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const userEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  await markResultsSeen({ userEmail });
  clearNavServerCacheForUser(userEmail);
  return Response.json({ ok: true, next_default_route: "/app/dashboard" });
}


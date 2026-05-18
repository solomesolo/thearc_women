import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNavigationDecision } from "@/lib/navigation-engine/navigationService";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const userEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);

  const url = new URL(request.url);
  const requestedRoute = url.searchParams.get("requestedRoute");
  const source = url.searchParams.get("source");

  const decision = await getNavigationDecision({
    userEmail,
    isAuthenticated: Boolean(session?.user?.email),
    sessionValid: true,
    requestedRoute,
    source,
  });

  return Response.json(decision, {
    headers: {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=300",
    },
  });
}


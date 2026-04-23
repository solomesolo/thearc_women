import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard-summary-engine/dashboardSummaryService";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const userEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await getDashboardSummary({ userEmail });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Private to the user; browser can reuse for 30s, serve stale for up to 2 min while revalidating.
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Failed to load dashboard summary" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


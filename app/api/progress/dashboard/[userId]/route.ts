import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProgressDashboardCounts } from "@/lib/progress-engine/progressService";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { userId } = await context.params;
  const requested = decodeURIComponent(userId).trim().toLowerCase();
  if (!requested || requested !== session.user.email) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    const result = await getProgressDashboardCounts({ userEmail: requested });
    return Response.json(result);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Failed to fetch progress dashboard" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProgressHistory } from "@/lib/progress-engine/progressService";

export async function GET(_request: Request, context: { params: Promise<{ instanceId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { instanceId } = await context.params;
  const recommendation_instance_id = decodeURIComponent(instanceId).trim();
  if (!recommendation_instance_id) {
    return new Response(JSON.stringify({ error: "Missing instanceId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const result = await getProgressHistory({
      userEmail: session.user.email,
      recommendationInstanceId: recommendation_instance_id,
    });
    return Response.json(result);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Failed to fetch progress history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


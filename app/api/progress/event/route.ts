import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyProgressEventForInstance } from "@/lib/progress-engine/progressService";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const body = (await request.json().catch(() => null)) as any;
  const recommendation_instance_id = String(body?.recommendation_instance_id ?? "").trim();
  const event_type = body?.event_type as any;

  if (!recommendation_instance_id) {
    return new Response(JSON.stringify({ error: "Missing recommendation_instance_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!event_type) {
    return new Response(JSON.stringify({ error: "Missing event_type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const result = await applyProgressEventForInstance({
      userEmail: session.user.email,
      recommendationInstanceId: recommendation_instance_id,
      input: {
        event_type,
        selection: body?.selection ?? undefined,
        note: body?.note ?? undefined,
        client_event_id: body?.client_event_id ?? undefined,
        action_option_key: body?.action_option_key ?? undefined,
      },
    });
    return Response.json(result);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Failed to apply progress event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


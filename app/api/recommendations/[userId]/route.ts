import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations-engine/recommendationsService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const callerEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);

  const { userId } = await params;
  const targetEmail = decodeURIComponent(userId);

  // Only allow access to own data (or anon via header).
  if (!callerEmail) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (callerEmail !== targetEmail && !targetEmail.startsWith("anon:")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await getRecommendations({ userEmail: targetEmail });
    return Response.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    console.error("[recommendations] GET error:", err);
    return Response.json(
      { error: err?.message ?? "Failed to load recommendations" },
      { status: 500 },
    );
  }
}

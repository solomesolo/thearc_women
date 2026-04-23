import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const caller = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const row = await prisma.userHealthScore.findFirst({
    where: { userEmail: caller },
    orderBy: { createdAt: "desc" },
    select: { score: true, payload: true, createdAt: true },
  });

  const cacheHeaders = { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" };

  if (!row) {
    return new Response(JSON.stringify({ has_score: false, score: null, payload: null, created_at: null }), {
      headers: { "Content-Type": "application/json", ...cacheHeaders },
    });
  }

  return new Response(
    JSON.stringify({
      has_score: true,
      score: Math.round(Number(row.score)),
      payload: row.payload as any,
      created_at: row.createdAt.toISOString(),
    }),
    { headers: { "Content-Type": "application/json", ...cacheHeaders } },
  );
}


import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateCheckStatus, invalidateRecsCache } from "@/lib/recommendations-engine/recommendationsService";
import type { CheckStatus } from "@/lib/recommendations-engine/types";

const VALID_STATUSES: CheckStatus[] = [
  "missing",
  "reminder_set",
  "planned",
  "completed",
  "result_uploaded",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; checkKey: string }> },
) {
  const session = await getServerSession(authOptions);
  const anonHeader = request.headers.get("x-arc-anon-id")?.trim() || null;
  const callerEmail = session?.user?.email ?? (anonHeader ? `anon:${anonHeader}` : null);

  if (!callerEmail) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, checkKey } = await params;
  const targetEmail = decodeURIComponent(userId);
  if (callerEmail !== targetEmail && !targetEmail.startsWith("anon:")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body?.status as string;
  if (!VALID_STATUSES.includes(status as CheckStatus)) {
    return Response.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const result = await updateCheckStatus({
      userEmail: targetEmail,
      checkKey: decodeURIComponent(checkKey),
      status: status as CheckStatus,
    });
    invalidateRecsCache(targetEmail);
    return Response.json(result);
  } catch (err: unknown) {
    console.error("[recommendations] PATCH status error:", err);
    const message = err instanceof Error ? err.message : null;
    return Response.json(
      { error: message ?? "Failed to update check status" },
      { status: 500 },
    );
  }
}

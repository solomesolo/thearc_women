import type { TimelineOutput } from "@/lib/timeline-engine/timelineTypes";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";

export async function fetchTimeline(userId: string): Promise<TimelineOutput> {
  const anonId = typeof window === "undefined" ? null : getOrCreateAnonId();
  const res = await fetch(`/api/timeline/${encodeURIComponent(userId)}`, {
    cache: "no-store",
    headers: anonId ? { "x-arc-anon-id": anonId } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return (await res.json()) as TimelineOutput;
}


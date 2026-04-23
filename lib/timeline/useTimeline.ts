"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { TimelineOutput } from "@/lib/timeline-engine/timelineTypes";
import { fetchTimeline } from "./timelineApi";

export function useTimeline(userId: string | null | undefined) {
  const effectiveUserId = useMemo(() => {
    if (userId) return userId;
    if (typeof window === "undefined") return null;
    return `anon:${getOrCreateAnonId()}`;
  }, [userId]);

  const [data, setData] = useState<TimelineOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function reload() {
    if (!effectiveUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetchTimeline(effectiveUserId);
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  return { data, isLoading, error, reload, effectiveUserId };
}


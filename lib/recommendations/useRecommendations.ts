"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { CheckStatus, RecommendationsPayload } from "@/lib/recommendations-engine/types";

export type { RecommendationsPayload, CheckStatus };

type State = {
  data: RecommendationsPayload | null;
  isLoading: boolean;
  error: Error | null;
};

async function fetchRecommendations(userId: string): Promise<RecommendationsPayload> {
  const anonId = getOrCreateAnonId();
  const res = await fetch(`/api/recommendations/${encodeURIComponent(userId)}`, {
    cache: "no-store",
    headers: { "x-arc-anon-id": anonId },
  });
  if (!res.ok) throw new Error(`recommendations_http_${res.status}`);
  return res.json();
}

export function useRecommendations(userId: string | null) {
  const [state, setState] = useState<State>({ data: null, isLoading: Boolean(userId), error: null });

  const load = useCallback(async () => {
    if (!userId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetchRecommendations(userId);
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState({ data: null, isLoading: false, error: e instanceof Error ? e : new Error("Failed") });
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = useCallback(
    async (checkKey: string, status: CheckStatus) => {
      if (!userId) return;
      const anonId = getOrCreateAnonId();
      await fetch(
        `/api/recommendations/${encodeURIComponent(userId)}/${encodeURIComponent(checkKey)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-arc-anon-id": anonId },
          body: JSON.stringify({ status }),
        },
      );
      // Optimistic update: flip status in local state immediately.
      setState((s) => {
        if (!s.data) return s;
        const recs = s.data.recommendations.map((r) =>
          r.checkKey === checkKey ? { ...r, status } : r,
        );
        const plannedCount = recs.filter((r) => r.status === "PLANNED").length;
        const completedCount = recs.filter((r) => r.status === "DONE").length;
        const topGaps = recs.filter((r) => r.status === "MISSING").length;
        return {
          ...s,
          data: {
            ...s.data,
            recommendations: recs,
            summary: { ...s.data.summary, plannedCount, completedCount, topGaps },
          },
        };
      });
    },
    [userId],
  );

  return { ...state, reload: load, updateStatus };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { CheckStatus, RecommendationsPayload } from "@/lib/recommendations-engine/types";
import type { CheckRecommendation } from "@/lib/recommendations-engine/types";

export type { RecommendationsPayload, CheckStatus };

type State = {
  data: RecommendationsPayload | null;
  isLoading: boolean;
  error: Error | null;
};

const RECS_CACHE_VERSION = 1;
function recsCacheKey(userId: string) {
  return `arc.recommendations.cache.v${RECS_CACHE_VERSION}:${userId}`;
}

function loadCachedRecommendations(userId: string): RecommendationsPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(recsCacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as RecommendationsPayload;
  } catch {
    return null;
  }
}

function saveCachedRecommendations(userId: string, data: RecommendationsPayload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(recsCacheKey(userId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function flattenPathway(data: RecommendationsPayload | null) {
  if (!data) return [];
  const p = data.pathway;
  return [
    ...(p.next_month ?? []),
    ...(p.next_3_months ?? []),
    ...(p.next_6_months ?? []),
    ...(p.next_year ?? []),
    ...(p.optional_later ?? []),
  ];
}

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
  const [state, setState] = useState<State>(() => {
    if (!userId) return { data: null, isLoading: false, error: null };
    const cached = loadCachedRecommendations(userId);
    return { data: cached, isLoading: true, error: null };
  });

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const data = await fetchRecommendations(userId);
        if (cancelled) return;
        saveCachedRecommendations(userId, data);
        setState({ data, isLoading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        const cached = loadCachedRecommendations(userId);
        setState({
          data: cached,
          isLoading: false,
          error: e instanceof Error ? e : new Error("Failed"),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const load = useCallback(async () => {
    if (!userId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetchRecommendations(userId);
      saveCachedRecommendations(userId, data);
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      const cached = loadCachedRecommendations(userId);
      setState({
        data: cached,
        isLoading: false,
        error: e instanceof Error ? e : new Error("Failed"),
      });
    }
  }, [userId]);

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
        const updateBucket = (items: CheckRecommendation[]) =>
          items.map((r) => (r.checkKey === checkKey ? { ...r, status } : r));

        const next_month = updateBucket(s.data.pathway.next_month ?? []);
        const next_3_months = updateBucket(s.data.pathway.next_3_months ?? []);
        const next_6_months = updateBucket(s.data.pathway.next_6_months ?? []);
        const next_year = updateBucket(s.data.pathway.next_year ?? []);
        const optional_later = updateBucket(s.data.pathway.optional_later ?? []);

        const all = [
          ...next_month,
          ...next_3_months,
          ...next_6_months,
          ...next_year,
          ...optional_later,
        ];

        const plannedCount = all.filter((r) => r.status === "planned").length;
        const completedCount = all.filter((r) => r.status === "completed" || r.status === "result_uploaded").length;
        const healthScore = all.length > 0 ? Math.round((completedCount / all.length) * 100) : 0;
        const nextBest = next_month.find((c) => c.status === "missing") ?? next_month[0] ?? all[0] ?? null;

        const nextState = {
          ...s,
          data: {
            ...s.data,
            pathway: { next_month, next_3_months, next_6_months, next_year, optional_later },
            summary: {
              ...s.data.summary,
              plannedCount,
              completedCount,
              healthScore,
              nextBestAction: nextBest
                ? { checkKey: nextBest.checkKey, checkName: nextBest.checkName, why: nextBest.whyForYou }
                : null,
            },
          },
        };
        saveCachedRecommendations(userId, nextState.data);
        return nextState;
      });
    },
    [userId],
  );

  const addReminder = useCallback(
    async (checkKey: string, remindAt: string, timeframe?: string) => {
      if (!userId) return;
      const anonId = getOrCreateAnonId();
      await fetch(
        `/api/recommendations/${encodeURIComponent(userId)}/${encodeURIComponent(checkKey)}/reminder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-arc-anon-id": anonId },
          body: JSON.stringify({ remindAt, timeframe }),
        },
      );
      load();
    },
    [userId, load],
  );

  const deleteReminder = useCallback(
    async (checkKey: string) => {
      if (!userId) return;
      const anonId = getOrCreateAnonId();
      await fetch(
        `/api/recommendations/${encodeURIComponent(userId)}/${encodeURIComponent(checkKey)}/reminder`,
        { method: "DELETE", headers: { "x-arc-anon-id": anonId } },
      );
      load();
    },
    [userId, load],
  );

  const addResult = useCallback(
    async (checkKey: string, payload: { documentId?: string; source?: string; testDate?: string }) => {
      if (!userId) return;
      const anonId = getOrCreateAnonId();
      await fetch(
        `/api/recommendations/${encodeURIComponent(userId)}/${encodeURIComponent(checkKey)}/result`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-arc-anon-id": anonId },
          body: JSON.stringify(payload),
        },
      );
      load();
    },
    [userId, load],
  );

  return { ...state, reload: load, updateStatus, addReminder, deleteReminder, addResult, flatten: () => flattenPathway(state.data) };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type { CheckStatus, RecommendationsPayload } from "@/lib/recommendations-engine/types";
import type { CheckRecommendation } from "@/lib/recommendations-engine/types";

export type { RecommendationsPayload, CheckStatus };

// ── Module-level in-memory cache (shared across ALL hook instances / pages) ───
// Navigating between dashboard → wallet → calendar → action-plan never re-fetches
// until STALE_MS has elapsed. Background-revalidates silently after that.

const MEM_CACHE = new Map<string, RecommendationsPayload>();
const FETCH_TS  = new Map<string, number>();
const IN_FLIGHT = new Map<string, Promise<RecommendationsPayload>>();
const STALE_MS  = 5 * 60 * 1000; // 5 min

function memFresh(userId: string) {
  const ts = FETCH_TS.get(userId);
  return !!ts && Date.now() - ts < STALE_MS;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

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

// ── Deduplicating fetcher ─────────────────────────────────────────────────────

function fetchOnce(userId: string): Promise<RecommendationsPayload> {
  const existing = IN_FLIGHT.get(userId);
  if (existing) return existing;

  const promise = fetchRecommendations(userId)
    .then((data) => {
      MEM_CACHE.set(userId, data);
      FETCH_TS.set(userId, Date.now());
      saveCachedRecommendations(userId, data);
      return data;
    })
    .finally(() => IN_FLIGHT.delete(userId));

  IN_FLIGHT.set(userId, promise);
  return promise;
}

// ── State type ────────────────────────────────────────────────────────────────

type State = {
  data: RecommendationsPayload | null;
  isLoading: boolean;
  error: Error | null;
};

export function invalidateRecsCache(userId?: string) {
  if (userId) {
    MEM_CACHE.delete(userId);
    FETCH_TS.delete(userId);
    IN_FLIGHT.delete(userId);
  } else {
    MEM_CACHE.clear();
    FETCH_TS.clear();
    IN_FLIGHT.clear();
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRecommendations(userId: string | null) {
  const [state, setState] = useState<State>(() => {
    if (!userId) return { data: null, isLoading: false, error: null };

    // 1. In-memory cache — fastest path, no flash
    const memData = MEM_CACHE.get(userId);
    if (memData) return { data: memData, isLoading: false, error: null };

    // 2. localStorage — show immediately, revalidate in background
    const cached = loadCachedRecommendations(userId);
    if (cached) {
      MEM_CACHE.set(userId, cached); // warm memory from disk
      return { data: cached, isLoading: false, error: null };
    }

    // 3. Nothing cached — show loading state
    return { data: null, isLoading: true, error: null };
  });

  useEffect(() => {
    if (!userId) return;

    // Fresh memory cache — skip fetch entirely
    if (memFresh(userId)) return;

    let cancelled = false;

    // We already have data (memory or localStorage), so don't flash a spinner —
    // just silently revalidate. Only show isLoading if we have nothing at all.
    if (!MEM_CACHE.has(userId)) {
      setState((s) => ({ ...s, isLoading: true, error: null }));
    }

    fetchOnce(userId)
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) {
          setState((s) => ({
            data: s.data,           // keep existing data if any
            isLoading: false,
            error: e instanceof Error ? e : new Error("Failed"),
          }));
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    FETCH_TS.delete(userId); // force refetch
    try {
      const data = await fetchOnce(userId);
      setState({ data, isLoading: false, error: null });
    } catch (e) {
      setState((s) => ({
        data: s.data,
        isLoading: false,
        error: e instanceof Error ? e : new Error("Failed"),
      }));
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
      // Optimistic update in both state and memory cache
      setState((s) => {
        if (!s.data) return s;
        const updateBucket = (items: CheckRecommendation[]) =>
          items.map((r) => (r.checkKey === checkKey ? { ...r, status } : r));

        const next_month     = updateBucket(s.data.pathway.next_month ?? []);
        const next_3_months  = updateBucket(s.data.pathway.next_3_months ?? []);
        const next_6_months  = updateBucket(s.data.pathway.next_6_months ?? []);
        const next_year      = updateBucket(s.data.pathway.next_year ?? []);
        const optional_later = updateBucket(s.data.pathway.optional_later ?? []);
        const all = [...next_month, ...next_3_months, ...next_6_months, ...next_year, ...optional_later];

        const plannedCount   = all.filter((r) => r.status === "planned").length;
        const completedCount = all.filter((r) => r.status === "completed" || r.status === "result_uploaded").length;
        const healthScore    = all.length > 0 ? Math.round((completedCount / all.length) * 100) : 0;
        const nextBest       = next_month.find((c) => c.status === "missing") ?? next_month[0] ?? all[0] ?? null;

        const next: RecommendationsPayload = {
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
        };
        MEM_CACHE.set(userId, next);
        saveCachedRecommendations(userId, next);
        return { ...s, data: next };
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
      FETCH_TS.delete(userId);
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
      FETCH_TS.delete(userId);
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
      FETCH_TS.delete(userId);
      load();
    },
    [userId, load],
  );

  return {
    ...state,
    reload: load,
    updateStatus,
    addReminder,
    deleteReminder,
    addResult,
    flatten: () => flattenPathway(state.data),
  };
}

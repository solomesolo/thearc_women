"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import type {
  ApplyProgressEventRequest,
  ApplyProgressEventResponse,
  DashboardProgressCounts,
  ProgressItem,
  RecommendationStatus,
} from "./progressTypes";
import {
  mockApplyProgressEvent,
  mockFetchDashboardProgressSummary,
  mockFetchRecommendationProgressList,
  subscribeProgressStore,
} from "./progressMockApi";

export function useDashboardProgressSummary(params: {
  userId: string | null | undefined;
  ids: string[];
  recommendationStatusById: Record<string, RecommendationStatus>;
}) {
  const [counts, setCounts] = useState<DashboardProgressCounts | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const effectiveUserId =
    params.userId ??
    (typeof window === "undefined" ? null : `anon:${getOrCreateAnonId()}`);

  async function reload() {
    if (!effectiveUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const r = await mockFetchDashboardProgressSummary({
        userKey: effectiveUserId,
        ids: params.ids,
        recommendationStatusById: params.recommendationStatusById,
      });
      setCounts(r.counts);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch"));
      setCounts(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, params.ids.join(","), JSON.stringify(params.recommendationStatusById)]);

  useEffect(() => {
    return subscribeProgressStore(() => {
      void reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  return { counts, isLoading, error, reload };
}

export function useRecommendationProgressList(params: {
  userId: string | null | undefined;
  ids: string[];
  recommendationStatusById: Record<string, RecommendationStatus>;
}) {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const effectiveUserId =
    params.userId ??
    (typeof window === "undefined" ? null : `anon:${getOrCreateAnonId()}`);

  async function reload() {
    if (!effectiveUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const r = await mockFetchRecommendationProgressList({
        userKey: effectiveUserId,
        ids: params.ids,
        recommendationStatusById: params.recommendationStatusById,
      });
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch"));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId, params.ids.join(","), JSON.stringify(params.recommendationStatusById)]);

  useEffect(() => {
    return subscribeProgressStore(() => {
      void reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  const byId = useMemo(() => {
    const m = new Map<string, ProgressItem>();
    for (const it of items) m.set(it.recommendation_instance_id, it);
    return m;
  }, [items]);

  return { items, byId, isLoading, error, reload };
}

export function useApplyProgressEvent(params?: { userId?: string | null }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const effectiveUserId =
    params?.userId ??
    (typeof window === "undefined" ? null : `anon:${getOrCreateAnonId()}`);

  async function apply(req: ApplyProgressEventRequest): Promise<ApplyProgressEventResponse> {
    if (!effectiveUserId) throw new Error("No user key available");
    setIsSaving(true);
    setError(null);
    try {
      return await mockApplyProgressEvent({ userKey: effectiveUserId, req });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to save");
      setError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  return { apply, isSaving, error };
}


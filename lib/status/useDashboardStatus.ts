"use client";

import { useEffect, useState } from "react";
import type { EngineCDashboardResponse } from "@/lib/status/statusApi";
import { fetchDashboardStatus } from "@/lib/status/statusApi";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";

export function useDashboardStatus(userId: string | null | undefined) {
  const [data, setData] = useState<EngineCDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const effectiveUserId =
    userId ??
    (typeof window === "undefined" ? null : `anon:${getOrCreateAnonId()}`);

  async function reload() {
    if (!effectiveUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetchDashboardStatus(effectiveUserId);
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (!effectiveUserId) return;
    setIsLoading(true);
    setError(null);
    fetchDashboardStatus(effectiveUserId)
      .then((r) => {
        if (active) setData(r);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e : new Error("Failed to fetch"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [effectiveUserId]);

  return { data, isLoading, error, reload };
}


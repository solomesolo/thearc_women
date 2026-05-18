"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";

export type NavigationDecisionResponse = {
  resolved_state: string;
  target_route: string;
  reason: string;
  blocking: boolean;
  ui_mode?: string;
};

export type NavigationGuardState = {
  isLoading: boolean;
  decision: NavigationDecisionResponse | null;
  error: Error | null;
};

// Module-level cache: keyed by requestedRoute, TTL 5 min.
// Prevents duplicate in-flight requests and re-fetching when components remount.
type CacheEntry = { decision: NavigationDecisionResponse; ts: number };
const NAV_CACHE = new Map<string, CacheEntry>();
const NAV_CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(route: string): NavigationDecisionResponse | null {
  const entry = NAV_CACHE.get(route);
  if (!entry) return null;
  if (Date.now() - entry.ts > NAV_CACHE_TTL_MS) {
    NAV_CACHE.delete(route);
    return null;
  }
  // If the cached decision is a redirect away from the requested route,
  // do not reuse it — it can cause redirect loops after server-side logic changes
  // (e.g. new routes are allowed) until TTL expires.
  if (entry.decision?.target_route && entry.decision.target_route !== route) {
    return null;
  }
  return entry.decision;
}

// In-flight deduplication: if a fetch for the same route is already running, share the promise.
const IN_FLIGHT = new Map<string, Promise<NavigationDecisionResponse>>();

async function fetchNavDecision(route: string): Promise<NavigationDecisionResponse> {
  const cached = getCached(route);
  if (cached) return cached;

  const existing = IN_FLIGHT.get(route);
  if (existing) return existing;

  const anonId = getOrCreateAnonId();
  const promise = fetch(
    `/api/navigation/resolve?requestedRoute=${encodeURIComponent(route)}&source=${encodeURIComponent("app_nav")}`,
    { cache: "no-store", headers: { "x-arc-anon-id": anonId } },
  )
    .then(async (res) => {
      if (!res.ok) throw new Error(`navigation_resolve_http_${res.status}`);
      const json = (await res.json()) as NavigationDecisionResponse;
      NAV_CACHE.set(route, { decision: json, ts: Date.now() });
      return json;
    })
    .finally(() => IN_FLIGHT.delete(route));

  IN_FLIGHT.set(route, promise);
  return promise;
}

export function invalidateNavCache() {
  NAV_CACHE.clear();
  IN_FLIGHT.clear();
}

export function useNavigationDecision(requestedRoute: string) {
  const pathname = usePathname();
  const effectiveRequestedRoute = useMemo(() => requestedRoute || pathname || "/", [pathname, requestedRoute]);

  const [state, setState] = useState<NavigationGuardState>(() => {
    const cached = getCached(effectiveRequestedRoute);
    return cached
      ? { isLoading: false, decision: cached, error: null }
      : { isLoading: true, decision: null, error: null };
  });

  useEffect(() => {
    const cached = getCached(effectiveRequestedRoute);
    if (cached) {
      setState({ isLoading: false, decision: cached, error: null });
      return;
    }

    let cancelled = false;
    setState({ isLoading: true, decision: null, error: null });

    fetchNavDecision(effectiveRequestedRoute)
      .then((json) => {
        if (!cancelled) setState({ isLoading: false, decision: json, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setState({ isLoading: false, decision: null, error: e instanceof Error ? e : new Error("Failed to resolve navigation") });
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveRequestedRoute]);

  return { ...state, requestedRoute: effectiveRequestedRoute };
}


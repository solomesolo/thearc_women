"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { NavigationLoadingState } from "./NavigationLoadingState";
import { useNavigationDecision } from "@/lib/navigation/useNavigationDecision";

type Props = {
  requestedRoute: string;
  allowStates: string[];
  loadingText?: string;
  children: React.ReactNode;
};

export function ProtectedRouteGate({ requestedRoute, allowStates, loadingText, children }: Props) {
  const router = useRouter();
  const { isLoading, decision, error } = useNavigationDecision(requestedRoute);

  const allowSet = useMemo(() => new Set(allowStates.map((s) => s.toUpperCase())), [allowStates]);
  const resolved = (decision?.resolved_state ?? "").toUpperCase();
  const target = decision?.target_route ?? null;
  const isAllowed = Boolean(target === requestedRoute && allowSet.has(resolved));

  useEffect(() => {
    if (!decision || !target) return;
    if (target !== requestedRoute) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.info(
          `[NavigationGuard] Redirecting from ${requestedRoute} to ${target} because state=${decision.resolved_state} reason=${decision.reason}`,
        );
      }
      router.replace(target);
    }
  }, [decision, requestedRoute, router, target]);

  if (isLoading) return <NavigationLoadingState text={loadingText} />;

  if (error && !decision) {
    // If resolver is unavailable, fail closed (no render) but keep UX minimal.
    return <NavigationLoadingState text="Checking your progress…" />;
  }

  if (!decision) return <NavigationLoadingState text="Checking your progress…" />;

  if (!isAllowed) return <NavigationLoadingState text="Redirecting…" />;

  return <>{children}</>;
}


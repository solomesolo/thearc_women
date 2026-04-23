"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";

type Props = {
  area: "results" | "app";
  children: React.ReactNode;
};

export function NavigationGuard({ area, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  const requestedRoute = useMemo(() => pathname ?? "/", [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAllowed(false);
      const anonId = getOrCreateAnonId();
      const res = await fetch(
        `/api/navigation/resolve?requestedRoute=${encodeURIComponent(requestedRoute)}&source=${encodeURIComponent(area)}`,
        { cache: "no-store", headers: { "x-arc-anon-id": anonId } },
      ).catch(() => null);
      if (cancelled) return;
      if (!res || !res.ok) {
        setAllowed(true);
        return;
      }
      const d = (await res.json()) as { target_route?: string; blocking?: boolean };
      const target = d?.target_route ?? null;
      const blocking = Boolean(d?.blocking);
      if (blocking && target && target !== requestedRoute) {
        router.replace(target);
        return;
      }
      setAllowed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [area, requestedRoute, router]);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <div className="mx-auto max-w-[72rem] px-5 py-10 text-[0.9375rem] text-[#737373] md:px-8">
          Loading…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


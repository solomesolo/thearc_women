"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildDashboardViewModel } from "@/adapters/dashboardAdapter";
import type { DashboardTimeRange } from "@/types/dashboard";
import type { ReasoningTrace } from "@/types/dashboard";
import { ReasoningTraceDrawer } from "@/components/system2/ReasoningTraceDrawer";
import { DashboardStickyHeader } from "@/components/dashboard/DashboardStickyHeader";
import { AboveTheFold } from "@/components/dashboard/AboveTheFold";
import { BelowTheFold } from "@/components/dashboard/BelowTheFold";
import { SurveyModalPlaceholder } from "@/components/dashboard/SurveyModalPlaceholder";
import {
  trackDashboardTimeRangeChanged,
  trackDashboardSystemOpened,
  trackDashboardTraceOpened,
  trackDashboardUpdateSignalsClicked,
} from "@/lib/dashboardTelemetry";

function toDrawerTrace(
  t: ReasoningTrace | null
): import("@/content/systemPageData").ReasoningTrace | null {
  return t as import("@/content/systemPageData").ReasoningTrace | null;
}

function DashboardPageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const traceParam = searchParams.get("trace");

  const [timeRange, setTimeRange] = useState<DashboardTimeRange>("7d");
  const [drawerTrace, setDrawerTrace] = useState<ReasoningTrace | null>(null);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);

  const vm = useMemo(
    () => buildDashboardViewModel({ _source: "dummy", timeRange }),
    [timeRange]
  );

  // URL → drawer: deep-link and back/forward
  useEffect(() => {
    if (!traceParam) {
      setDrawerTrace(null);
      return;
    }
    const t = vm.traces.find((x) => x.id === traceParam) ?? null;
    setDrawerTrace(t);
  }, [traceParam, vm.traces]);

  const openTrace = useCallback(
    (traceId: string) => {
      const t = vm.traces.find((x) => x.id === traceId) ?? null;
      setDrawerTrace(t);
      router.replace(
        traceId ? `${pathname}?trace=${encodeURIComponent(traceId)}` : pathname
      );
      trackDashboardTraceOpened(traceId);
    },
    [vm.traces, pathname, router]
  );

  const closeDrawer = useCallback(() => {
    setDrawerTrace(null);
    router.replace(pathname);
  }, [pathname, router]);

  const handleTimeRangeChange = useCallback((range: DashboardTimeRange) => {
    setTimeRange(range);
    trackDashboardTimeRangeChanged(range);
  }, []);

  const handleUpdateSignals = useCallback(() => {
    setSurveyModalOpen(true);
    trackDashboardUpdateSignalsClicked();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <DashboardStickyHeader
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onUpdateSignals={handleUpdateSignals}
      />

      <main className="dashboard-shell">
        <h1 className="pt-6 text-[28px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[32px] md:pt-8">
          Dashboard
        </h1>
        <AboveTheFold
          vm={vm}
          onOpenTrace={openTrace}
          onSystemOpened={trackDashboardSystemOpened}
        />
        <div className="border-t border-black/[0.06]" />
        <BelowTheFold vm={vm} onOpenTrace={openTrace} onUpdateSignals={handleUpdateSignals} />
      </main>

      <ReasoningTraceDrawer
        trace={toDrawerTrace(drawerTrace)}
        onClose={closeDrawer}
        placement="right"
      />

      {surveyModalOpen && (
        <SurveyModalPlaceholder onClose={() => setSurveyModalOpen(false)} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <DashboardPageContent />
    </Suspense>
  );
}

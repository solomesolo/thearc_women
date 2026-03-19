"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildDashboardViewModel } from "@/adapters/dashboardAdapter";
import type { DashboardTimeRange } from "@/types/dashboard";
import type { ReasoningTrace } from "@/types/dashboard";
import { ReasoningTraceDrawer } from "@/components/system2/ReasoningTraceDrawer";
import { DashboardStickyHeader } from "@/components/dashboard/DashboardStickyHeader";
import { DashboardV3 } from "@/components/dashboard/DashboardV3";
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
  const fixtureParam = searchParams.get("fixture");

  const [timeRange, setTimeRange] = useState<DashboardTimeRange>("7d");
  const [drawerTrace, setDrawerTrace] = useState<ReasoningTrace | null>(null);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [dashboardInput, setDashboardInput] = useState<
    { _source: "dummy"; timeRange: DashboardTimeRange; payload?: unknown } | { _source: "survey"; timeRange: DashboardTimeRange; output: unknown } | null
  >(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [surveyDataPresent, setSurveyDataPresent] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEngineError(null);
    setSurveyDataPresent(null);
    const qs = new URLSearchParams({ timeRange });
    if (fixtureParam) qs.set("fixture", fixtureParam);
    fetch(`/api/dashboard?${qs.toString()}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : `Dashboard ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSurveyDataPresent(data._surveyDataPresent === true);
        if (data._source === "survey" && data.output != null) {
          setEngineError(null);
          setDashboardInput({ _source: "survey", timeRange: data.timeRange ?? "7d", output: data.output });
        } else {
          if (data._engineError) setEngineError(data._engineError);
          setDashboardInput({
            _source: "dummy",
            timeRange: data.timeRange ?? "7d",
            payload: data.payload,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardInput({ _source: "dummy", timeRange: timeRange ?? "7d" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [timeRange, fixtureParam]);

  const vm = useMemo(() => {
    if (dashboardInput == null) {
      return buildDashboardViewModel({ _source: "dummy", timeRange });
    }
    return buildDashboardViewModel(dashboardInput);
  }, [dashboardInput, timeRange]);

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

      <main>
        {surveyDataPresent === false && (
          <div className="dashboard-shell pt-6">
            <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Complete the survey to see personalized results. Until then, you’re seeing sample data.
            </div>
          </div>
        )}
        {engineError != null && (
          <div className="dashboard-shell pt-6">
            <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your survey is saved, but the analysis engine couldn’t run (e.g. Python not available in this environment). Showing sample data.
            </div>
          </div>
        )}
        <DashboardV3 />
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

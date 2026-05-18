"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ENGINE_A_STORAGE, getOrCreateAnonId, apiBuildProfile } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

type Step =
  | "profile"
  | "recommendations"
  | "status"
  | "timeline"
  | "summary"
  | "done";

const STEPS: Array<{ key: Exclude<Step, "done">; title: string; detail: string }> = [
  { key: "profile", title: "Profile", detail: "Turn your answers into a consistent profile snapshot" },
  { key: "recommendations", title: "Recommendations", detail: "Generate your personalized test roadmap" },
  { key: "status", title: "Analysis", detail: "Calculate your health status and completeness score" },
  { key: "timeline", title: "Schedule", detail: "Build your upcoming checks timeline" },
  { key: "summary", title: "Dashboard", detail: "Assemble everything into your dashboard view" },
];

function stepIndex(step: Step) {
  if (step === "done") return STEPS.length;
  const idx = STEPS.findIndex((s) => s.key === step);
  return idx < 0 ? 0 : idx;
}

export default function ResultsBootstrapPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const locale = useLocale();
  const [step, setStep] = useState<Step>("profile");
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const hasRunRef = useRef(false);

  const caller = useMemo(() => {
    if (session?.user?.email) return session.user.email;
    return `anon:${getOrCreateAnonId()}`;
  }, [session?.user?.email]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  // Watchdog: redirect as soon as step reaches "done", even if the main effect's
  // cancelled flag was set by React StrictMode's double-invoke cleanup.
  useEffect(() => {
    if (step === "done") {
      router.replace("/auth/register");
    }
  }, [step, router]);

  useEffect(() => {
    let cancelled = false;
    if (sessionStatus === "loading") return;
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    (async () => {
      setError(null);
      const anonId = getOrCreateAnonId();
      const sessionId = window.localStorage.getItem(ENGINE_A_STORAGE.sessionId);
      if (!sessionId) {
        router.replace("/health-journey");
        return;
      }

      try {
        // Every survey is started by launchSurvey() which only runs when sessionStatus === "unauthenticated".
        // So the questionnaire session is always owned by anon:{anonId}. We therefore ALWAYS redirect
        // to /auth/register after bootstrap — new users register there, returning users sign in.
        // Using a fixed constant here prevents useSession mid-flight changes from routing to the old dashboard.
        const effectiveCaller = `anon:${anonId}`;

        setStep("profile");
        const built = await apiBuildProfile(sessionId);
        const profileSnapshotId = built?.profile_snapshot_id as string | undefined;
        if (!profileSnapshotId) throw new Error("profile_build_missing_snapshot");

        setStep("recommendations");
        await fetch(`/api/recommendations/run/${encodeURIComponent(profileSnapshotId)}`, {
          method: "POST",
          headers: { "x-arc-anon-id": anonId },
        }).then((r) => {
          if (!r.ok) throw new Error("recommendations_failed");
        });

        setStep("status");
        await Promise.all([
          fetch("/api/status/recalculate", { method: "POST", headers: { "x-arc-anon-id": anonId } }).then((r) => {
            if (!r.ok) throw new Error("status_failed");
          }),
          fetch("/api/health-score/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-arc-anon-id": anonId },
            body: JSON.stringify({}),
          }).then((r) => {
            if (!r.ok) throw new Error("score_failed");
          }),
        ]);

        setStep("timeline");
        await Promise.all([
          fetch(`/api/timeline/${encodeURIComponent(effectiveCaller)}`, {
            headers: { "x-arc-anon-id": anonId },
            cache: "no-store",
          }).catch(() => null),
          fetch("/api/dashboard/summary", { headers: { "x-arc-anon-id": anonId }, cache: "no-store" }).catch(() => null),
        ]);

        setStep("summary");
        await fetch("/api/navigation/mark-results-seen", {
          method: "POST",
          headers: { "x-arc-anon-id": anonId },
        }).catch(() => null);

        setStep("done");
        if (!cancelled) router.replace("/auth/register");
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ? String(e.message) : "bootstrap_failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sessionStatus]);

  const idx = stepIndex(step);
  const progressPct = Math.min(100, Math.round(((idx + (step === "done" ? 0 : 0.25)) / STEPS.length) * 100));
  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const etaText = elapsedSec < 8 ? "Usually 20–60 seconds" : elapsedSec < 25 ? "Almost there" : "Still working — this can take ~1–2 minutes";

  const label =
    step === "profile"
      ? "Creating your profile…"
      : step === "recommendations"
        ? "Generating recommendations…"
        : step === "status"
          ? "Analysing your health data…"
          : step === "timeline"
            ? "Building your timeline…"
            : step === "summary"
              ? "Finalizing your dashboard…"
              : "Done";

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <div className="mx-auto max-w-[40rem] px-5 py-16 md:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">{t(locale, "results.bootstrap.eyebrow")}</p>
        <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2rem]">
          {t(locale, "results.bootstrap.title")}
        </h1>
        <p className="mt-3 text-[0.9375rem] text-[#737373]">{label}</p>

        {/* Progress */}
        <div className="mt-6 rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              Progress
            </p>
            <p className="text-[0.8125rem] text-[#a3a3a3] tabular-nums">
              {elapsedSec}s · {etaText}
            </p>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[#0c0c0c] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ol className="mt-5 space-y-3">
            {STEPS.map((s, i) => {
              const isDone = i < idx;
              const isActive = i === idx && step !== "done";
              return (
                <li key={s.key} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      isDone
                        ? "border-[#0c0c0c]/[0.2] bg-[#0c0c0c]/[0.05]"
                        : isActive
                          ? "border-[#0c0c0c]/[0.35] bg-white"
                          : "border-black/[0.12] bg-white"
                    }`}
                    aria-hidden
                  >
                    {isDone ? (
                      <span className="h-2 w-2 rounded-full bg-[#0c0c0c]" />
                    ) : isActive ? (
                      <span className="h-2 w-2 rounded-full bg-[#0c0c0c]/[0.5] animate-pulse" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-black/[0.15]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[0.9375rem] font-medium ${isActive ? "text-[#0c0c0c]" : "text-[#404040]"}`}>
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
                      {s.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-6 text-[0.8125rem] leading-snug text-[#a3a3a3]">
            {t(locale, "results.bootstrap.tip")}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-[16px] border border-red-200 bg-red-50 p-4 text-[0.875rem] text-red-700">
            We couldn’t prepare your results.{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => window.location.reload()}>
              Retry
            </button>
            <div className="mt-2 text-[0.75rem] text-red-700/80">Debug: {error}</div>
          </div>
        )}
      </div>
    </div>
  );
}


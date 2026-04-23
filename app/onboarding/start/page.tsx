"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useSession } from "next-auth/react";
import { useSurvey } from "@/components/onboarding/SurveyProvider";
import { apiCreateQuestionnaireSession, apiGetOnboardingStatus } from "@/lib/profile-engine-a/frontendClient";
import { useUserFlowResolver } from "@/lib/profile-engine-a/hooks";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

export default function OnboardingStartPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { setEngineASessionId, clearSurvey } = useSurvey();
  const flow = useUserFlowResolver();
  const locale = useLocale();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleCTA() {
    if (isStarting) return;
    setIsStarting(true);
    setStartError(null);

    // Always wipe stale local survey state before starting.
    clearSurvey();

    if (session?.user?.email) {
      // Authenticated: resume incomplete session or start fresh.
      try {
        const s = await apiGetOnboardingStatus();
        if (s?.has_incomplete_session && s?.session_id && typeof s?.resume_step === "string") {
          setEngineASessionId(s.session_id);
          router.push(`/onboarding/${s.resume_step}`);
          return;
        }
        if (s?.has_completed_profile) {
          router.push("/app/dashboard");
          return;
        }
        const created = await apiCreateQuestionnaireSession();
        setEngineASessionId(created.session_id);
        router.push("/onboarding/consent");
        return;
      } catch (e: any) {
        setStartError(e?.message ? String(e.message) : "Couldn't start. Please try again.");
        setIsStarting(false);
        return;
      }
    }

    // Anonymous: always create a fresh session — never auto-resume old ones.
    // Old sessions may be stale "in_progress" and would skip consent and pre-fill answers.
    try {
      const created = await apiCreateQuestionnaireSession();
      setEngineASessionId(created.session_id);
      router.push("/onboarding/consent");
    } catch (e: any) {
      setStartError(e?.message ? String(e.message) : "Couldn't start. Please try again.");
      setIsStarting(false);
    }
  }

  return (
    <OnboardingShell narrow>
      <div className="flex flex-col items-center text-center">
        {/* Eyebrow */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
          {t(locale, "onboarding.start.eyebrow")}
        </p>

        {/* Heading */}
        <h1 className="mt-5 text-[2rem] font-semibold leading-[1.2] tracking-tight text-[#0c0c0c] md:text-[2.5rem]">
          {t(locale, "onboarding.start.title")}
        </h1>

        {/* Description */}
        <p className="mt-5 max-w-[400px] text-[1rem] leading-[1.7] text-[#737373]">
          {t(locale, "onboarding.start.body")}
        </p>

        {/* What to expect */}
        <div className="mt-10 w-full rounded-[20px] border border-black/[0.08] bg-white p-6 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
            {t(locale, "onboarding.start.expect")}
          </p>
          <ul className="mt-4 space-y-3">
            {[
              [t(locale, "onboarding.start.expect.1.t"), t(locale, "onboarding.start.expect.1.d")],
              [t(locale, "onboarding.start.expect.2.t"), t(locale, "onboarding.start.expect.2.d")],
              [t(locale, "onboarding.start.expect.3.t"), t(locale, "onboarding.start.expect.3.d")],
              [t(locale, "onboarding.start.expect.4.t"), t(locale, "onboarding.start.expect.4.d")],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-[0.3em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4c4c4]" aria-hidden />
                <span className="text-[0.9375rem] leading-snug text-[#404040]">
                  <span className="font-medium text-[#0c0c0c]">{title}</span>
                  {" — "}{desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleCTA}
          disabled={isStarting || sessionStatus === "loading"}
          className={`mt-8 w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8] ${isStarting ? "opacity-90" : ""}`}
        >
          {isStarting
            ? t(locale, "common.loading")
            : session?.user?.email
              ? flow.hasIncompleteQuestionnaire
                ? (locale === "de" ? "Assessment fortsetzen" : "Continue assessment")
                : flow.hasActiveProfile
                  ? (locale === "de" ? "Zum Dashboard" : "Go to my dashboard")
                  : (locale === "de" ? "Assessment starten" : "Start assessment")
              : (locale === "de" ? "Start — dauert 3 Minuten" : "Start — it takes 3 minutes")}
        </button>

        {startError && (
          <p className="mt-3 max-w-[420px] text-[0.8125rem] text-[#b91c1c]">
            {startError}
          </p>
        )}

        <p className="mt-4 text-[0.8125rem] text-[#a3a3a3]">
          Your answers are private and never shared.
        </p>
      </div>
    </OnboardingShell>
  );
}

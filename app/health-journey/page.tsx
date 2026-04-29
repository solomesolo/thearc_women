"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSurvey } from "@/components/onboarding/SurveyProvider";
import {
  apiCreateQuestionnaireSession,
  apiGetOnboardingStatus,
} from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";

// ── localStorage state tracking ───────────────────────────────────────────────
type JourneyState = "not_started" | "journey_seen" | "consent_given" | "survey_started";

function getJourneyState(): JourneyState {
  if (typeof window === "undefined") return "not_started";
  return (localStorage.getItem("arc_journey_state") as JourneyState) ?? "not_started";
}
function setJourneyState(s: JourneyState) {
  if (typeof window === "undefined") return;
  localStorage.setItem("arc_journey_state", s);
}

// ── Static content ────────────────────────────────────────────────────────────
const STEPS_EN = [
  {
    n: "1",
    title: "Tell us about you",
    desc: "Answer a few questions so we can personalise your plan",
  },
  {
    n: "2",
    title: "Get your recommendations",
    desc: "We create your biomarker and screening checklist based on your profile",
  },
  {
    n: "3",
    title: "Add what you already know",
    desc: "Upload existing results or skip anything you've already done",
  },
  {
    n: "4",
    title: "Plan and track your health",
    desc: "We guide you step by step and remind you when needed",
  },
];

const STEPS_DE = [
  {
    n: "1",
    title: "Erzähl uns von dir",
    desc: "Beantworte einige Fragen, damit wir deinen Plan personalisieren können",
  },
  {
    n: "2",
    title: "Erhalte deine Empfehlungen",
    desc: "Wir erstellen deine Biomarker- und Vorsorgeliste basierend auf deinem Profil",
  },
  {
    n: "3",
    title: "Füge hinzu, was du schon weißt",
    desc: "Lade bestehende Ergebnisse hoch oder überspringe bereits Erledigtes",
  },
  {
    n: "4",
    title: "Plane und verfolge deine Gesundheit",
    desc: "Wir begleiten dich Schritt für Schritt und erinnern dich, wenn es Zeit ist",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function HealthJourneyPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { setEngineASessionId, clearSurvey } = useSurvey();
  const locale = useLocale();
  const isDE = locale === "de";
  const steps = isDE ? STEPS_DE : STEPS_EN;

  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0); // for step preview animation

  // Mark page as seen
  useEffect(() => {
    if (getJourneyState() === "not_started") setJourneyState("journey_seen");
  }, []);

  // Redirect returning users who already completed consent or started survey
  useEffect(() => {
    if (sessionStatus === "loading") return;
    const state = getJourneyState();
    if (!session?.user?.email) return; // anonymous users always see the journey screen
    // Authenticated returning user — check backend state
    apiGetOnboardingStatus()
      .then((s) => {
        if (!s) return;
        if (s.has_completed_profile) {
          router.replace("/app/dashboard");
          return;
        }
        if (s.has_incomplete_session && s.session_id && s.resume_step) {
          setEngineASessionId(s.session_id);
          router.replace(`/onboarding/${s.resume_step}`);
        }
      })
      .catch(() => {});
  }, [session, sessionStatus, router, setEngineASessionId]);

  // Animate step highlight loop (subtle, every 2.4s)
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((n) => (n + 1) % 4);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  async function handleStart() {
    if (isStarting || sessionStatus === "loading") return;
    setIsStarting(true);
    setStartError(null);
    clearSurvey();

    try {
      if (session?.user?.email) {
        const s = await apiGetOnboardingStatus();
        if (s?.has_completed_profile) {
          router.push("/app/dashboard");
          return;
        }
        if (s?.has_incomplete_session && s?.session_id && s?.resume_step) {
          setEngineASessionId(s.session_id);
          router.push(`/onboarding/${s.resume_step}`);
          return;
        }
      }
      const created = await apiCreateQuestionnaireSession();
      setEngineASessionId(created.session_id);
      setJourneyState("consent_given");
      router.push("/onboarding/consent");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setStartError(msg ?? (isDE ? "Fehler — bitte erneut versuchen." : "Something went wrong — please try again."));
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Minimal header */}
      <header className="border-b border-black/[0.06] bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[72rem] items-center justify-between px-5 md:px-8">
          <Link href="/" className="text-[0.9375rem] font-semibold tracking-tight text-[#0c0c0c]">
            The Arc
          </Link>
          <span className="text-[0.8125rem] text-[#a3a3a3]">
            {isDE ? "Keine Anmeldung erforderlich" : "No sign-up required"}
          </span>
        </div>
      </header>

      {/* Journey progress bar — starts at 0 */}
      <div className="h-1 w-full bg-[#f0f0ef]">
        <div
          className="h-full bg-[#0c0c0c] transition-all duration-700"
          style={{ width: isStarting ? "8%" : "2%" }}
        />
      </div>

      <main className="mx-auto max-w-[72rem] px-5 py-12 md:px-8 md:py-16">

        {/* ── Hero ── */}
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
            {isDE ? "Deine persönliche Gesundheitsreise" : "Your personal health journey"}
          </p>

          <h1 className="mt-4 text-[2rem] font-semibold leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[2.75rem]">
            {isDE ? "Erstelle deinen persönlichen Gesundheitsplan" : "Build your personal health plan"}
          </h1>

          <p className="mt-4 text-[1rem] leading-[1.7] text-[#737373] md:text-[1.0625rem]">
            {isDE
              ? "Wir begleiten dich Schritt für Schritt — vom Verständnis deiner Gesundheit heute bis zur Planung und Verfolgung deiner nächsten Schritte."
              : "We'll guide you step by step — from understanding your health today to planning and tracking your next steps."}
          </p>

          <p className="mt-2 text-[0.875rem] text-[#a3a3a3]">
            {isDE ? "Dein Plan wird auf dein Alter, deine Gesundheitsziele und deine Geschichte zugeschnitten." : "Your plan will be tailored to your age, health goals, and history."}
          </p>

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting || sessionStatus === "loading"}
            className="mt-8 inline-flex w-full max-w-[340px] items-center justify-center rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8] disabled:opacity-50 md:w-auto"
          >
            {isStarting
              ? (isDE ? "Einen Moment…" : "One moment…")
              : (isDE ? "Gesundheitsprofil starten" : "Start your health profile")}
          </button>

          {startError && (
            <p className="mt-3 text-[0.8125rem] text-red-600">{startError}</p>
          )}

          <p className="mt-3 text-[0.8125rem] text-[#c4c4c4]">
            {isDE ? "Du kannst alles später aktualisieren" : "You can update everything later"}
          </p>
        </div>

        {/* ── Journey steps ── */}
        <div className="mx-auto mt-16 max-w-[880px]">
          <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            {isDE ? "So funktioniert es" : "How it works"}
          </p>

          {/* Desktop: horizontal row — Mobile: vertical stack */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-3">
            {steps.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <div
                  key={step.n}
                  className={`group relative rounded-[20px] border p-5 transition-all duration-500 ${
                    isActive
                      ? "border-[#0c0c0c] bg-[#0c0c0c] text-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
                      : "border-black/[0.06] bg-white text-[#0c0c0c]"
                  }`}
                >
                  {/* Step number */}
                  <div
                    className={`mb-4 flex h-8 w-8 items-center justify-center rounded-full text-[0.8125rem] font-semibold transition-colors duration-500 ${
                      isActive ? "bg-white/[0.15] text-white" : "bg-[#f0f0ef] text-[#737373]"
                    }`}
                  >
                    {step.n}
                  </div>

                  <p className={`text-[0.9375rem] font-semibold leading-snug transition-colors duration-500 ${isActive ? "text-white" : "text-[#0c0c0c]"}`}>
                    {step.title}
                  </p>
                  <p className={`mt-2 text-[0.8125rem] leading-[1.6] transition-colors duration-500 ${isActive ? "text-white/70" : "text-[#737373]"}`}>
                    {step.desc}
                  </p>

                  {/* Connector line (desktop only, between cards) */}
                  {i < 3 && (
                    <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 6h8M7 3l3 3-3 3" stroke={isActive ? "#0c0c0c" : "#d4d4d4"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Expectation block ── */}
        <div className="mx-auto mt-12 max-w-[640px]">
          <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "⏱",
                  label: isDE ? "3–5 Minuten" : "3–5 minutes",
                  sub: isDE ? "Kurzes Assessment" : "Short assessment",
                },
                {
                  icon: "🧠",
                  label: isDE ? "Kein Vorwissen nötig" : "No medical knowledge needed",
                  sub: isDE ? "Einfache Fragen" : "Plain language questions",
                },
                {
                  icon: "✓",
                  label: isDE ? "Du entscheidest" : "You're in control",
                  sub: isDE ? "Alles überspringbar" : "Skip anything",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="mt-0.5 text-[1.125rem]" aria-hidden>{item.icon}</span>
                  <div>
                    <p className="text-[0.875rem] font-medium text-[#0c0c0c]">{item.label}</p>
                    <p className="text-[0.8125rem] text-[#737373]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Consent framing ── */}
        <div className="mx-auto mt-10 max-w-[640px]">
          <div className="rounded-[20px] border border-black/[0.08] bg-[#fafaf9] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {isDE ? "Bevor wir beginnen" : "Before we start"}
            </p>
            <p className="mt-3 text-[0.9375rem] leading-[1.65] text-[#404040]">
              {isDE
                ? "Wir werden dich um deine Zustimmung bitten, deine Gesundheitsinformationen zur Erstellung deines persönlichen Plans zu verwenden. Deine Daten sind sicher und werden nur für deine Empfehlungen verwendet."
                : "We'll ask for your consent to use your health information to create your personal plan. Your data is secure and only used for your recommendations."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.8125rem] text-[#737373]">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                  <path d="M6.5 1a5.5 5.5 0 1 0 0 11A5.5 5.5 0 0 0 6.5 1Z" stroke="#16a34a" strokeWidth="1.3"/>
                  <path d="M4.5 6.5l1.5 1.5 2.5-3" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isDE ? "Niemals an Dritte weitergegeben" : "Never sold or shared"}
              </span>
              <span className="text-[#d4d4d4]">·</span>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                  <path d="M6.5 1a5.5 5.5 0 1 0 0 11A5.5 5.5 0 0 0 6.5 1Z" stroke="#16a34a" strokeWidth="1.3"/>
                  <path d="M4.5 6.5l1.5 1.5 2.5-3" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isDE ? "Jederzeit löschbar" : "Delete anytime"}
              </span>
              <span className="text-[#d4d4d4]">·</span>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                  <path d="M6.5 1a5.5 5.5 0 1 0 0 11A5.5 5.5 0 0 0 6.5 1Z" stroke="#16a34a" strokeWidth="1.3"/>
                  <path d="M4.5 6.5l1.5 1.5 2.5-3" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isDE ? "Kein Konto nötig" : "No account needed"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="mx-auto mt-10 max-w-[480px] text-center">
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting || sessionStatus === "loading"}
            className="w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8] disabled:opacity-50"
          >
            {isStarting
              ? (isDE ? "Einen Moment…" : "One moment…")
              : (isDE ? "Weiter zur Einwilligung" : "Continue to consent")}
          </button>

          {startError && (
            <p className="mt-3 text-[0.8125rem] text-red-600">{startError}</p>
          )}

          <p className="mt-4 text-[0.8125rem] text-[#c4c4c4]">
            {isDE ? "Du kannst alles später aktualisieren" : "You can update everything later"}
          </p>
        </div>

      </main>
    </div>
  );
}

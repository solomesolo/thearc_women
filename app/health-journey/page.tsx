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

// ── localStorage state ────────────────────────────────────────────────────────
type JourneyState = "not_started" | "journey_seen" | "consent_given" | "survey_started";
function getJourneyState(): JourneyState {
  if (typeof window === "undefined") return "not_started";
  return (localStorage.getItem("arc_journey_state") as JourneyState) ?? "not_started";
}
function setJourneyState(s: JourneyState) {
  if (typeof window === "undefined") return;
  localStorage.setItem("arc_journey_state", s);
}

// ── Inline product mock UIs ───────────────────────────────────────────────────

function SurveyPreview() {
  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#fafaf9] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      {/* Progress bar */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1 flex-1 rounded-full bg-[#f0f0ef]">
          <div className="h-full w-[40%] rounded-full bg-[#0c0c0c]" />
        </div>
        <span className="text-[11px] font-medium text-[#a3a3a3]">2 / 5</span>
      </div>
      {/* Question */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">Health goals</p>
      <p className="mt-2 text-[1rem] font-semibold leading-snug text-[#0c0c0c]">
        What is your main health focus right now?
      </p>
      {/* Options */}
      <div className="mt-4 space-y-2">
        {[
          { label: "Understand my current health baseline", selected: true },
          { label: "Improve energy and reduce fatigue", selected: false },
          { label: "Manage stress and hormonal changes", selected: false },
          { label: "Plan for the future (fertility, aging)", selected: false },
        ].map((o) => (
          <div
            key={o.label}
            className={`flex items-center gap-3 rounded-[12px] border px-4 py-3 ${
              o.selected
                ? "border-[#0c0c0c] bg-[#0c0c0c]"
                : "border-black/[0.08] bg-white"
            }`}
          >
            <div
              className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                o.selected ? "border-white bg-white" : "border-[#d4d4d4]"
              }`}
            >
              {o.selected && (
                <div className="m-0.5 h-2 w-2 rounded-full bg-[#0c0c0c]" />
              )}
            </div>
            <span className={`text-[0.875rem] ${o.selected ? "font-medium text-white" : "text-[#404040]"}`}>
              {o.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#fafaf9] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">Your dashboard</p>
          <p className="mt-1 text-[1rem] font-semibold text-[#0c0c0c]">Good morning, Anna</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-[#0c0c0c]" />
      </div>
      {/* Next action card */}
      <div className="mb-3 rounded-[16px] bg-[#0c0c0c] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Next best action</p>
        <p className="mt-1 text-[0.9375rem] font-semibold text-white">Preventive health baseline blood test</p>
        <p className="mt-1 text-[0.8125rem] text-white/60">Iron, HbA1c, hs-CRP — 3 core biomarkers</p>
        <div className="mt-3 flex gap-2">
          <div className="rounded-[8px] bg-white px-3 py-1.5 text-[0.75rem] font-medium text-[#0c0c0c]">Plan now</div>
          <div className="rounded-[8px] bg-white/10 px-3 py-1.5 text-[0.75rem] font-medium text-white">Remind me</div>
        </div>
      </div>
      {/* Phase rings row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Baseline", done: 2, total: 4, pct: 50 },
          { label: "Risk checks", done: 0, total: 5, pct: 0 },
          { label: "Screenings", done: 1, total: 3, pct: 33 },
        ].map((p) => (
          <div key={p.label} className="rounded-[12px] border border-black/[0.06] bg-white p-3 text-center">
            <div className="relative mx-auto h-10 w-10">
              <svg viewBox="0 0 40 40" className="h-full w-full">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#f0f0ef" strokeWidth="3.5" />
                <circle
                  cx="20" cy="20" r="16" fill="none" stroke="#0c0c0c" strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - p.pct / 100)}`}
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[0.625rem] font-semibold text-[#0c0c0c]">{p.done}/{p.total}</span>
              </div>
            </div>
            <p className="mt-1 text-[0.625rem] font-medium text-[#737373]">{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletPreview() {
  const biomarkers = [
    { name: "Ferritin", value: "14 ng/mL", status: "out_of_range" as const, trend: [22, 18, 14] },
    { name: "HbA1c", value: "5.4%", status: "in_range" as const, trend: [5.2, 5.3, 5.4] },
    { name: "hs-CRP", value: "2.1 mg/L", status: "borderline" as const, trend: [1.4, 1.9, 2.1] },
    { name: "Vitamin D", value: "—", status: "unknown" as const, trend: [] },
  ];
  const statusColor = {
    in_range:   { bg: "bg-[#f0faf0]", text: "text-[#16a34a]", label: "In range",    border: "border-[#bbf7d0]" },
    borderline: { bg: "bg-[#fffbeb]", text: "text-[#d97706]", label: "Borderline",  border: "border-[#fde68a]" },
    out_of_range:{ bg: "bg-[#fff5f5]", text: "text-red-600",  label: "Check needed",border: "border-[#fca5a5]" },
    unknown:    { bg: "bg-[#fafaf9]", text: "text-[#a3a3a3]", label: "Not added",   border: "border-black/[0.06]" },
  };

  function Sparkline({ pts }: { pts: number[] }) {
    if (pts.length < 2) return null;
    const W = 40, H = 16, pad = 2;
    const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
    const points = pts.map((v, i) => {
      const x = pad + (i / (pts.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (v - min) / range) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0">
        <polyline points={points} fill="none" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#fafaf9] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">Health Wallet · Biomarkers</p>
      <div className="space-y-2">
        {biomarkers.map((bm) => {
          const s = statusColor[bm.status];
          return (
            <div key={bm.name} className={`flex items-center justify-between gap-3 rounded-[12px] border ${s.border} ${s.bg} px-3.5 py-2.5`}>
              <div className="min-w-0">
                <p className="text-[0.875rem] font-medium text-[#0c0c0c]">{bm.name}</p>
                <p className={`text-[0.75rem] font-medium ${s.text}`}>{s.label}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Sparkline pts={bm.trend} />
                <p className="text-right font-mono text-[0.8125rem] tabular-nums text-[#525252]">{bm.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Missing count */}
      <div className="mt-3 rounded-[10px] border border-black/[0.06] bg-white px-3 py-2">
        <p className="text-[0.8125rem] text-[#737373]">
          <span className="font-semibold text-[#0c0c0c]">8 more biomarkers</span> recommended for your profile
        </p>
      </div>
    </div>
  );
}

function PlanningPreview() {
  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#fafaf9] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">Action Plan</p>
      <div className="space-y-3">
        {[
          { name: "Preventive baseline blood test", timing: "This month", status: "Do now", done: false },
          { name: "Heart & cholesterol risk check", timing: "Next 3 months", status: "Do soon", done: false },
          { name: "Chlamydia screening", timing: "This month", status: "Planned", done: true },
        ].map((c) => (
          <div key={c.name} className={`rounded-[16px] border bg-white p-4 ${c.done ? "border-black/[0.04] opacity-60" : "border-black/[0.08]"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] ${c.done ? "bg-white text-[#737373] border border-black/[0.1]" : c.status === "Do now" ? "bg-[#0c0c0c] text-white" : "bg-[#525252] text-white"}`}>
                    {c.status}
                  </span>
                </div>
                <p className={`text-[0.875rem] font-semibold ${c.done ? "text-[#737373] line-through" : "text-[#0c0c0c]"}`}>{c.name}</p>
                <p className="mt-0.5 text-[0.75rem] text-[#a3a3a3]">{c.timing}</p>
              </div>
              {c.done && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c]">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                    <path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            {!c.done && (
              <div className="mt-2.5 flex gap-1.5">
                <div className="rounded-[8px] bg-[#0c0c0c] px-2.5 py-1 text-[0.6875rem] font-medium text-white">Mark planned</div>
                <div className="rounded-[8px] border border-black/[0.1] px-2.5 py-1 text-[0.6875rem] font-medium text-[#404040]">Add to Calendar</div>
                <div className="rounded-[8px] border border-black/[0.1] px-2.5 py-1 text-[0.6875rem] font-medium text-[#404040]">Remind me</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section layout ────────────────────────────────────────────────────────────

function JourneySection({
  number,
  eyebrow,
  title,
  body,
  meta,
  preview,
  reverse,
}: {
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  meta?: string;
  preview: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-10 md:gap-16 ${reverse ? "md:flex-row-reverse" : "md:flex-row"} md:items-center`}>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c0c0c] text-[0.75rem] font-semibold text-white">
            {number}
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">{eyebrow}</p>
        </div>
        <h2 className="text-[1.5rem] font-semibold leading-[1.2] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
          {title}
        </h2>
        <p className="mt-4 text-[1rem] leading-[1.7] text-[#737373]">{body}</p>
        {meta && (
          <p className="mt-3 text-[0.875rem] font-medium text-[#404040]">{meta}</p>
        )}
      </div>

      {/* Preview */}
      <div className="w-full md:w-[460px] shrink-0">
        {preview}
      </div>
    </div>
  );
}

// ── Checkmark icon ────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="7.5" stroke="#16a34a" />
      <path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HealthJourneyPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { setEngineASessionId, clearSurvey } = useSurvey();
  const locale = useLocale();
  const isDE = locale === "de";

  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (getJourneyState() === "not_started") setJourneyState("journey_seen");
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading" || !session?.user?.email) return;
    apiGetOnboardingStatus()
      .then((s) => {
        if (!s) return;
        if (s.has_completed_profile) { router.replace("/app/dashboard"); return; }
        if (s.has_incomplete_session && s.session_id && s.resume_step) {
          setEngineASessionId(s.session_id);
          router.replace(`/onboarding/${s.resume_step}`);
        }
      })
      .catch(() => {});
  }, [session, sessionStatus, router, setEngineASessionId]);

  async function handleStart() {
    if (isStarting || sessionStatus === "loading") return;
    setIsStarting(true);
    setStartError(null);
    clearSurvey();
    try {
      if (session?.user?.email) {
        const s = await apiGetOnboardingStatus();
        if (s?.has_completed_profile) { router.push("/app/dashboard"); return; }
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

  const ctaLabel = isStarting
    ? (isDE ? "Einen Moment…" : "One moment…")
    : (isDE ? "Gesundheitsprofil starten" : "Start your health profile");

  const sections = isDE
    ? [
        {
          number: "1", eyebrow: "Fragebogen", reverse: false,
          title: "Erzähl uns von dir",
          body: "Ein kurzer, geführter Fragebogen, um dein Gesundheitsprofil zu verstehen. Dauert ca. 3–5 Minuten. Kein medizinisches Vorwissen erforderlich.",
          meta: "3–5 Minuten · Keine Vorkenntnisse nötig · Alles überspringbar",
          preview: <SurveyPreview />,
        },
        {
          number: "2", eyebrow: "Dashboard", reverse: true,
          title: "Dein persönlicher Plan",
          body: "Dein Dashboard zeigt dir deine nächsten Schritte, deinen Fortschritt und was jetzt am wichtigsten ist. Du weißt immer, was als Nächstes zu tun ist.",
          preview: <DashboardPreview />,
        },
        {
          number: "3", eyebrow: "Health Wallet", reverse: false,
          title: "Alles an einem Ort",
          body: "Deine Biomarker und Vorsorgeuntersuchungen — mit Ergebnissen, Trends und fehlenden Daten. Sieh, was du schon weißt und was noch fehlt.",
          preview: <WalletPreview />,
        },
        {
          number: "4", eyebrow: "Planung", reverse: true,
          title: "Plane und verfolge deine Gesundheit",
          body: "Termine planen, Erinnerungen setzen und langfristig den Überblick behalten. Wir begleiten dich Schritt für Schritt.",
          preview: <PlanningPreview />,
        },
      ]
    : [
        {
          number: "1", eyebrow: "Questionnaire", reverse: false,
          title: "Tell us about you",
          body: "A short, guided questionnaire to understand your health profile. Takes about 3–5 minutes. No medical knowledge needed.",
          meta: "3–5 min · No expertise needed · Skip anything",
          preview: <SurveyPreview />,
        },
        {
          number: "2", eyebrow: "Dashboard", reverse: true,
          title: "See your personal plan",
          body: "Your dashboard shows your next steps, progress, and what matters most right now. Always know what to do next.",
          preview: <DashboardPreview />,
        },
        {
          number: "3", eyebrow: "Health Wallet", reverse: false,
          title: "Keep everything in one place",
          body: "Your biomarkers and screenings — with results, trends, and missing data highlighted. See what you already know and what's still needed.",
          preview: <WalletPreview />,
        },
        {
          number: "4", eyebrow: "Planning", reverse: true,
          title: "Plan and track your health",
          body: "Schedule tests, set reminders, and stay on top of your health over time. We guide you step by step.",
          preview: <PlanningPreview />,
        },
      ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-black/[0.06] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[72rem] items-center justify-between px-5 md:px-8">
          <Link href="/" className="text-[0.9375rem] font-semibold tracking-tight text-[#0c0c0c]">
            The Arc
          </Link>
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting || sessionStatus === "loading"}
            className="hidden rounded-[10px] bg-[#0c0c0c] px-4 py-2 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:opacity-50 md:block"
          >
            {ctaLabel}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-[#f0f0ef]">
        <div className="h-full bg-[#0c0c0c] transition-all duration-700" style={{ width: isStarting ? "8%" : "1.5%" }} />
      </div>

      <main className="mx-auto max-w-[72rem] px-5 md:px-8">

        {/* ── Hero ── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[580px] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a3a3a3]">
              {isDE ? "The Arc Woman" : "The Arc Woman"}
            </p>
            <h1 className="mt-4 text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-[#0c0c0c] md:text-[3rem]">
              {isDE
                ? "Erstelle deinen persönlichen Gesundheitsplan"
                : "Build your personal health plan"}
            </h1>
            <p className="mt-5 text-[1rem] leading-[1.7] text-[#737373] md:text-[1.0625rem]">
              {isDE
                ? "Verstehe deine Gesundheit, fülle die Lücken und verfolge, was wirklich zählt — an einem Ort."
                : "Understand your health, fill the gaps, and track what matters — in one place."}
            </p>

            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || sessionStatus === "loading"}
              className="mt-8 inline-flex w-full max-w-[320px] items-center justify-center rounded-[14px] bg-[#0c0c0c] px-8 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8] disabled:opacity-50"
            >
              {ctaLabel}
            </button>
            {startError && <p className="mt-3 text-[0.8125rem] text-red-600">{startError}</p>}
            <p className="mt-3 text-[0.8125rem] text-[#c4c4c4]">
              {isDE ? "Kein Konto erforderlich" : "No account required"}
            </p>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px w-full bg-black/[0.06]" />

        {/* ── Product sections ── */}
        <section className="space-y-24 py-24 md:space-y-32 md:py-32">
          {sections.map((s) => (
            <JourneySection key={s.number} {...s} />
          ))}
        </section>

        {/* ── Divider ── */}
        <div className="h-px w-full bg-black/[0.06]" />

        {/* ── Consent block ── */}
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-[560px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
              {isDE ? "Bevor wir beginnen" : "Before we start"}
            </p>
            <h2 className="mt-4 text-[1.5rem] font-semibold leading-[1.2] tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
              {isDE ? "Deine Daten, deine Kontrolle" : "Your data, your control"}
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.7] text-[#737373]">
              {isDE
                ? "Wir bitten dich um deine Zustimmung, deine Gesundheitsinformationen zu verwenden, um deinen persönlichen Plan zu erstellen. Deine Daten sind sicher und werden nur für deine Empfehlungen genutzt."
                : "We'll ask for your consent to use your health information to create your personal plan. Your data is secure and only used for your recommendations."}
            </p>

            <ul className="mt-6 space-y-3">
              {(isDE
                ? [
                    "Niemals verkauft oder an Dritte weitergegeben",
                    "Jederzeit löschbar — du behältst die Kontrolle",
                    "Anonym, bis du dich für ein Konto entscheidest",
                  ]
                : [
                    "Never sold or shared with third parties",
                    "Delete your data anytime — you stay in control",
                    "Anonymous until you choose to create an account",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.9375rem] text-[#404040]">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || sessionStatus === "loading"}
              className="mt-10 w-full rounded-[14px] bg-[#0c0c0c] px-8 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8] disabled:opacity-50"
            >
              {isStarting
                ? (isDE ? "Einen Moment…" : "One moment…")
                : (isDE ? "Weiter zur Einwilligung" : "Continue to consent")}
            </button>
            {startError && <p className="mt-3 text-[0.8125rem] text-red-600">{startError}</p>}
            <p className="mt-4 text-[0.8125rem] text-[#c4c4c4]">
              {isDE ? "Du kannst alles später aktualisieren" : "You can update everything later"}
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}

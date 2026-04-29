"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useSurvey } from "@/components/onboarding/SurveyProvider";
import { apiSaveAnswers } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";

export default function ConsentPage() {
  const router = useRouter();
  const { engineA } = useSurvey();
  const locale = useLocale();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!agreed || loading) return;
    setLoading(true);
    if (engineA.sessionId) {
      await apiSaveAnswers(engineA.sessionId, {
        answers: [{ question_key: "consent_given", answer_value: true }],
        last_step_number: 0,
      }).catch(() => {});
    }
    router.push("/onboarding/basics");
  }

  return (
    <OnboardingShell narrow>
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push("/health-journey")}
        className="mb-8 inline-flex items-center gap-1.5 text-[0.8125rem] text-[#737373] hover:text-[#0c0c0c] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {locale === "de" ? "Zurück" : "Back"}
      </button>

      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <path d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2Z" stroke="#0c0c0c" strokeWidth="1.5" />
            <path d="M11 7v5M11 14.5v.5" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <h2 className="text-center text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c]">
        {locale === "de" ? "Deine Daten, deine Kontrolle" : "Your data, your control"}
      </h2>
      <p className="mt-3 text-center text-[0.9375rem] leading-[1.65] text-[#737373]">
        {locale === "de"
          ? "Bevor du beginnst, erkläre uns kurz, wie wir deine Antworten verwenden."
          : "Before you start, here's how we use your answers."}
      </p>

      {/* Data use points */}
      <div className="mt-8 rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
          {locale === "de" ? "Was wir mit deinen Daten machen" : "What we do with your data"}
        </p>
        <ul className="mt-4 space-y-3.5">
          {(locale === "de"
            ? [
                ["Personalisierte Empfehlungen", "Deine Antworten werden verwendet, um relevante Gesundheitschecks für dich auszuwählen."],
                ["Nur für dich", "Deine Daten werden nicht an Dritte verkauft oder für Werbung genutzt."],
                ["Du hast die Kontrolle", "Du kannst deine Daten jederzeit löschen oder den Zugang widerrufen."],
                ["Anonym bis du entscheidest", "Wir fragen am Ende, ob du ein Konto erstellen möchtest — ohne Pflicht."],
              ]
            : [
                ["Personalized guidance", "Your answers are used to match relevant health checks to your profile."],
                ["Only for you", "Your data is never sold or used for advertising."],
                ["You're in control", "You can delete your data or revoke access at any time."],
                ["Anonymous until you decide", "We'll ask at the end if you want to save — no obligation."],
              ]
          ).map(([title, desc]) => (
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

      {/* Consent checkbox */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[14px] border border-black/[0.08] bg-[#fafaf9] p-4 transition-colors hover:bg-white">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-black/[0.2] accent-[#0c0c0c]"
        />
        <span className="text-[0.9375rem] text-[#404040]">
          {locale === "de"
            ? "Ich stimme der Verarbeitung meiner Antworten zur Personalisierung meiner Gesundheitsempfehlungen zu."
            : "I agree to my answers being used to personalise my health recommendations."}
        </span>
      </label>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!agreed || loading}
        className="mt-6 w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-40 active:brightness-[0.8]"
      >
        {loading
          ? (locale === "de" ? "Einen Moment…" : "One moment…")
          : (locale === "de" ? "Zustimmen und fortfahren" : "Agree and continue")}
      </button>

      <p className="mt-4 text-center text-[0.75rem] leading-snug text-[#c4c4c4]">
        {locale === "de"
          ? "Deine Daten werden sicher gespeichert und nie an Dritte weitergegeben."
          : "Your data is stored securely and never shared with third parties."}
      </p>
    </OnboardingShell>
  );
}

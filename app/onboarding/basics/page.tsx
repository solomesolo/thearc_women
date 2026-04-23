"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ProgressHeader } from "@/components/onboarding/ProgressHeader";
import { SelectCard } from "@/components/onboarding/SelectCard";
import { ChipGroup } from "@/components/onboarding/ChipGroup";
import { useSurvey } from "@/components/onboarding/SurveyProvider";
import { getSurveyOptions } from "@/content/onboarding/survey-options";
import { apiCreateQuestionnaireSession, apiSaveAnswers } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

export default function BasicsPage() {
  const router = useRouter();
  const { state, setBasics, markStepComplete, engineA, setEngineASessionId } = useSurvey();
  const locale = useLocale();
  const { AGE_RANGES, LIFE_STAGES, GOALS } = getSurveyOptions(locale);

  const [ageRange, setAgeRange] = useState(state.basics.ageRange);
  const [lifeStage, setLifeStage] = useState(state.basics.lifeStage);
  const [goals, setGoals] = useState<string[]>(state.basics.goals);
  const [country, setCountry] = useState<string>("");

  const canContinue = ageRange !== "" && lifeStage !== "" && goals.length > 0 && country !== "";

  async function handleContinue() {
    if (!canContinue) return;
    let sessionId = engineA.sessionId;
    if (!sessionId) {
      const created = await apiCreateQuestionnaireSession();
      sessionId = created.session_id;
      setEngineASessionId(sessionId);
    }

    await apiSaveAnswers(sessionId, {
      answers: [
        { question_key: "age_range", answer_value: ageRange },
        { question_key: "life_stage", answer_value: lifeStage },
        { question_key: "goals", answer_value: goals },
        { question_key: "country", answer_value: country },
      ],
      last_step_number: 1,
    });

    setBasics({ ageRange, lifeStage, goals });
    markStepComplete(1);
    router.push("/onboarding/lifestyle");
  }

  return (
    <OnboardingShell>
      <ProgressHeader step={1} totalSteps={4} onBack={() => router.push("/onboarding/consent")} />

      <h2 className="mb-1 text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c]">
        {t(locale, "onboarding.basics.h")}
      </h2>
      <p className="mb-8 text-[0.9375rem] text-[#737373]">
        {t(locale, "onboarding.basics.p")}
      </p>

      {/* Age range */}
      <section className="mb-8">
        <p className="mb-3 text-[0.875rem] font-semibold text-[#0c0c0c]">{t(locale, "onboarding.basics.q.age")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AGE_RANGES.map((age) => (
            <SelectCard
              key={age.key}
              label={age.label}
              selected={ageRange === age.key}
              onClick={() => setAgeRange(ageRange === age.key ? "" : age.key)}
            />
          ))}
        </div>
      </section>

      {/* Life stage */}
      <section className="mb-8">
        <p className="mb-3 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.basics.q.stage")}
        </p>
        <div className="space-y-2">
          {LIFE_STAGES.map((stage) => (
            <SelectCard
              key={stage.key}
              label={stage.label}
              selected={lifeStage === stage.key}
              onClick={() => setLifeStage(lifeStage === stage.key ? "" : stage.key)}
            />
          ))}
        </div>
      </section>

      {/* Goals */}
      <section className="mb-8">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.basics.q.goals")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.basics.q.multi")}</p>
        <ChipGroup
          options={GOALS}
          selected={goals}
          onChange={setGoals}
        />
      </section>

      {/* Country / region */}
      <section className="mb-10">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {locale === "de" ? "Wo bist du ansässig?" : "Where are you based?"}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">
          {locale === "de"
            ? "So können wir dir die richtigen Informationen zu Tests in deinem Gesundheitssystem zeigen."
            : "This helps us show you the right information for accessing tests in your healthcare system."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "Germany", label: locale === "de" ? "🇩🇪 Deutschland" : "🇩🇪 Germany" },
            { key: "United Kingdom", label: "🇬🇧 United Kingdom" },
          ].map((opt) => (
            <SelectCard
              key={opt.key}
              label={opt.label}
              selected={country === opt.key}
              onClick={() => setCountry(country === opt.key ? "" : opt.key)}
            />
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:opacity-40 disabled:cursor-not-allowed active:brightness-[0.8]"
      >
        {t(locale, "common.continue")}
      </button>
    </OnboardingShell>
  );
}

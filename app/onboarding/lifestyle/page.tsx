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

export default function LifestylePage() {
  const router = useRouter();
  const { state, setLifestyle, markStepComplete, engineA, setEngineASessionId } = useSurvey();
  const locale = useLocale();
  const { SYMPTOMS, SUN_EXPOSURE, DIET_PATTERNS, LIFESTYLE_CONTEXT, CYCLE_PATTERNS } = getSurveyOptions(locale);

  const [symptoms, setSymptoms] = useState<string[]>(state.lifestyle.symptoms);
  const [cyclePattern, setCyclePattern] = useState(state.lifestyle.cyclePattern ?? "");
  const [sunExposure, setSunExposure] = useState(state.lifestyle.sunExposure);
  const [dietPattern, setDietPattern] = useState<string[]>(state.lifestyle.dietPattern);
  const [lifestyleContext, setLifestyleContext] = useState<string[]>(state.lifestyle.lifestyleContext);

  const canContinue = sunExposure !== "";

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
        { question_key: "symptoms", answer_value: symptoms },
        { question_key: "cycle_pattern", answer_value: cyclePattern || null },
        { question_key: "sun_exposure", answer_value: sunExposure },
        { question_key: "diet_pattern", answer_value: dietPattern },
        { question_key: "lifestyle_context", answer_value: lifestyleContext },
      ],
      last_step_number: 2,
    });

    setLifestyle({ symptoms, cyclePattern, sunExposure, dietPattern, lifestyleContext });
    markStepComplete(2);
    router.push("/onboarding/health-context");
  }

  return (
    <OnboardingShell>
      <ProgressHeader step={2} totalSteps={4} onBack={() => router.push("/onboarding/basics")} />

      <h2 className="mb-1 text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c]">
        {t(locale, "onboarding.lifestyle.h")}
      </h2>
      <p className="mb-8 text-[0.9375rem] text-[#737373]">
        {t(locale, "onboarding.lifestyle.p")}
      </p>

      {/* Symptoms */}
      <section className="mb-8">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.lifestyle.q.symptoms")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.lifestyle.q.symptoms.help")}</p>
        <ChipGroup
          options={SYMPTOMS}
          selected={symptoms}
          onChange={setSymptoms}
        />
      </section>

      {/* Cycle pattern (conditional) */}
      {["reproductive", "trying_to_conceive", "perimenopause"].includes(state.basics.lifeStage) && (
        <section className="mb-8">
          <p className="mb-3 text-[0.875rem] font-semibold text-[#0c0c0c]">
            {t(locale, "onboarding.lifestyle.q.cycle")}
          </p>
          <div className="space-y-2">
            {CYCLE_PATTERNS.map((opt) => (
              <SelectCard
                key={opt.key}
                label={opt.label}
                selected={cyclePattern === opt.key}
                onClick={() => setCyclePattern(cyclePattern === opt.key ? "" : opt.key)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sun exposure */}
      <section className="mb-8">
        <p className="mb-3 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.lifestyle.q.sun")}
        </p>
        <div className="space-y-2">
          {SUN_EXPOSURE.map((opt) => (
            <SelectCard
              key={opt.key}
              label={opt.label}
              selected={sunExposure === opt.key}
              onClick={() => setSunExposure(sunExposure === opt.key ? "" : opt.key)}
            />
          ))}
        </div>
      </section>

      {/* Diet */}
      <section className="mb-8">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.lifestyle.q.diet")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.basics.q.multi")}</p>
        <ChipGroup
          options={DIET_PATTERNS}
          selected={dietPattern}
          onChange={setDietPattern}
        />
      </section>

      {/* Lifestyle context */}
      <section className="mb-10">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.lifestyle.q.context")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.basics.q.multi")}</p>
        <ChipGroup
          options={LIFESTYLE_CONTEXT}
          selected={lifestyleContext}
          onChange={setLifestyleContext}
        />
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

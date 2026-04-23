"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ProgressHeader } from "@/components/onboarding/ProgressHeader";
import { ChipGroup } from "@/components/onboarding/ChipGroup";
import { useSurvey } from "@/components/onboarding/SurveyProvider";
import { getSurveyOptions } from "@/content/onboarding/survey-options";
import { apiCreateQuestionnaireSession, apiSaveAnswers } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

export default function HealthContextPage() {
  const router = useRouter();
  const { state, setHealthContext, markStepComplete, engineA, setEngineASessionId } = useSurvey();
  const locale = useLocale();
  const { CONDITIONS, MEDICATIONS, FAMILY_HISTORY } = getSurveyOptions(locale);

  const [conditions, setConditions] = useState<string[]>(state.healthContext.conditions);
  const [medications, setMedications] = useState<string[]>(state.healthContext.medications);
  const [familyHistory, setFamilyHistory] = useState<string[]>(state.healthContext.familyHistory);

  async function handleContinue() {
    let sessionId = engineA.sessionId;
    if (!sessionId) {
      const created = await apiCreateQuestionnaireSession();
      sessionId = created.session_id;
      setEngineASessionId(sessionId);
    }

    await apiSaveAnswers(sessionId, {
      answers: [
        { question_key: "known_conditions", answer_value: conditions },
        { question_key: "medications_or_hormones", answer_value: medications },
        { question_key: "family_history", answer_value: familyHistory },
      ],
      last_step_number: 3,
    });

    setHealthContext({ conditions, medications, familyHistory });
    markStepComplete(3);
    router.push("/onboarding/test-history");
  }

  return (
    <OnboardingShell>
      <ProgressHeader step={3} totalSteps={4} onBack={() => router.push("/onboarding/lifestyle")} />

      <h2 className="mb-1 text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c]">
        {t(locale, "onboarding.health.h")}
      </h2>
      <p className="mb-8 text-[0.9375rem] text-[#737373]">
        {t(locale, "onboarding.health.p")}
      </p>

      {/* Conditions */}
      <section className="mb-8">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.health.q.conditions")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.basics.q.multi")}</p>
        <ChipGroup
          options={CONDITIONS}
          selected={conditions}
          onChange={setConditions}
        />
      </section>

      {/* Medications */}
      <section className="mb-8">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.health.q.meds")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.basics.q.multi")}</p>
        <ChipGroup
          options={MEDICATIONS}
          selected={medications}
          onChange={setMedications}
        />
      </section>

      {/* Family history */}
      <section className="mb-10">
        <p className="mb-1 text-[0.875rem] font-semibold text-[#0c0c0c]">
          {t(locale, "onboarding.health.q.family")}
        </p>
        <p className="mb-3 text-[0.8125rem] text-[#a3a3a3]">{t(locale, "onboarding.health.q.family.help")}</p>
        <ChipGroup
          options={FAMILY_HISTORY}
          selected={familyHistory}
          onChange={setFamilyHistory}
        />
      </section>

      <button
        type="button"
        onClick={handleContinue}
        className="w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8]"
      >
        {t(locale, "common.continue")}
      </button>
    </OnboardingShell>
  );
}

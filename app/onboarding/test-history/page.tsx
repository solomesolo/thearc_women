"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ProgressHeader } from "@/components/onboarding/ProgressHeader";
import { TestRecencyRow } from "@/components/onboarding/TestRecencyRow";
import { useSurvey } from "@/components/onboarding/SurveyProvider";
import { getSurveyOptions, type TestKey, type RecencyOption } from "@/content/onboarding/survey-options";
import { apiCreateQuestionnaireSession, apiSaveAnswers } from "@/lib/profile-engine-a/frontendClient";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

export default function TestHistoryPage() {
  const router = useRouter();
  const { status } = useSession();
  const { state, setTestHistory, markStepComplete, engineA, setEngineASessionId } = useSurvey();
  const locale = useLocale();
  const { TEST_ITEMS } = getSurveyOptions(locale);

  const [history, setHistory] = useState<Partial<Record<TestKey, RecencyOption>>>(
    state.testHistory
  );
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTest(key: TestKey, value: RecencyOption) {
    setHistory((prev) => ({ ...prev, [key]: value }));
  }

  async function handleContinue() {
    setError(null);
    let sessionId = engineA.sessionId;
    if (!sessionId) {
      const created = await apiCreateQuestionnaireSession();
      sessionId = created.session_id;
      setEngineASessionId(sessionId);
    }

    await apiSaveAnswers(sessionId, {
      answers: [
        { question_key: "last_tests", answer_value: history },
      ],
      last_step_number: 4,
    });

    setTestHistory(history);
    markStepComplete(4);

    // Hand off to deterministic bootstrap (profile → recommendations → status → score → timeline).
    setBuilding(true);
    router.push("/results/bootstrap");
  }

  return (
    <OnboardingShell>
      <ProgressHeader step={4} totalSteps={4} onBack={() => router.push("/onboarding/health-context")} />

      <h2 className="mb-1 text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c]">
        {t(locale, "onboarding.tests.h")}
      </h2>
      <p className="mb-2 text-[0.9375rem] text-[#737373]">
        {t(locale, "onboarding.tests.p")}
      </p>
      <p className="mb-8 text-[0.8125rem] text-[#a3a3a3]">
        {t(locale, "onboarding.tests.help")}
      </p>

      <div className="space-y-2.5">
        {TEST_ITEMS.map(({ key, label }) => (
          <TestRecencyRow
            key={key}
            label={label}
            value={history[key as TestKey] ?? ""}
            onChange={(v) => updateTest(key as TestKey, v)}
          />
        ))}
      </div>

      <div className="mt-10 space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={building}
          className="w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-[1rem] font-medium text-white transition-[filter] hover:brightness-[0.88] active:brightness-[0.8]"
        >
          {building ? t(locale, "onboarding.tests.cta.loading") : t(locale, "onboarding.tests.cta")}
        </button>
        {error && (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[0.875rem] text-red-700">
            {error}{" "}
            <button type="button" className="underline underline-offset-2" onClick={handleContinue}>
              Retry
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={building}
          className="w-full rounded-[14px] border border-black/[0.1] bg-white px-6 py-4 text-[1rem] font-medium text-[#737373] transition-colors hover:bg-[#f5f5f4]"
        >
          {t(locale, "onboarding.tests.skip")}
        </button>
      </div>
    </OnboardingShell>
  );
}

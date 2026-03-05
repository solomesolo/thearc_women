"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import arcSurveyJson from "@/data/survey/arc_core_intake_v1.json";
import { loadArcSurvey } from "@/lib/survey/arcSurveySchema";
import type { ArcSurveyConfigRaw } from "@/lib/survey/arcSurveySchema";
import type { ArcQuestionNormalized } from "@/lib/survey/arcSurveySchema";
import {
  buildFlatScreens,
  getTriggerScreenId,
  type ArcSurveyAnswers,
} from "@/lib/survey/arcLogic";
import { SurveyProgressHeader } from "./SurveyProgressHeader";
import { ArcAnswerCards } from "./ArcAnswerCards";
import { InsightNote } from "./InsightNote";
import { ContentBreakScreen } from "./ContentBreakScreen";
import { SafetyPromptScreen } from "./SafetyPromptScreen";
import { OutroScreen } from "./OutroScreen";
import { CompletionScreen } from "./CompletionScreen";

const config = loadArcSurvey(arcSurveyJson as unknown as ArcSurveyConfigRaw);
const ui = config.ui_defaults;
const screensById = Object.fromEntries(config.logic.screens.map((s) => [s.id, s]));

function hasValidAnswer(
  value: string | number | (string | number)[] | undefined,
  type: ArcQuestionNormalized["type"]
): boolean {
  if (type === "optional_numeric") return true;
  if (value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function ArcSurveyContainer() {
  const router = useRouter();
  const [answers, setAnswers] = useState<ArcSurveyAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingSafetyScreenId, setPendingSafetyScreenId] = useState<string | null>(null);
  const [showingSafetyScreenId, setShowingSafetyScreenId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const flatScreens = useMemo(() => buildFlatScreens(config, answers), [answers]);

  useEffect(() => {
    if (currentIndex >= flatScreens.length && flatScreens.length > 0) {
      setCurrentIndex(flatScreens.length - 1);
    }
  }, [currentIndex, flatScreens.length]);

  const currentScreen = flatScreens[currentIndex];
  const totalSteps = flatScreens.length;

  const isNextEnabled = useMemo(() => {
    if (!currentScreen) return false;
    if (currentScreen.type === "content_break" || currentScreen.type === "outro") return true;
    if (currentScreen.type === "safety_prompt") return true;
    if (currentScreen.type === "question") {
      if (currentScreen.item.type === "optional_numeric") return true;
      const val = answers[currentScreen.item.variable_id];
      return hasValidAnswer(val, currentScreen.item.type);
    }
    return false;
  }, [currentScreen, answers]);

  const sectionLabel = useMemo(() => {
    if (!currentScreen) return "";
    if (currentScreen.type === "content_break" || currentScreen.type === "outro")
      return currentScreen.sectionTitle;
    if (currentScreen.type === "question") return currentScreen.sectionTitle;
    return "";
  }, [currentScreen]);

  const handleAnswer = useCallback(
    (variableId: string, value: string | number | (string | number)[] | undefined) => {
      setAnswers((prev) => {
        const next = { ...prev };
        if (value === undefined || value === "") {
          delete next[variableId];
        } else {
          next[variableId] = value;
        }
        return next;
      });
    },
    []
  );

  const goNext = useCallback(() => {
    if (!isNextEnabled && currentScreen?.type === "question" && currentScreen.item.type !== "optional_numeric")
      return;
    if (pendingSafetyScreenId) {
      setShowingSafetyScreenId(pendingSafetyScreenId);
      setPendingSafetyScreenId(null);
      setAnimKey((k) => k + 1);
      return;
    }
    if (currentIndex >= flatScreens.length - 1) {
      const last = flatScreens[flatScreens.length - 1];
      if (last?.type === "outro") submitAndComplete(answers);
      return;
    }
    setCurrentIndex((i) => Math.min(i + 1, flatScreens.length - 1));
    setAnimKey((k) => k + 1);
  }, [currentIndex, flatScreens, pendingSafetyScreenId, answers, isNextEnabled, currentScreen]);

  const goBack = useCallback(() => {
    if (showingSafetyScreenId) {
      setShowingSafetyScreenId(null);
      setAnimKey((k) => k + 1);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setAnimKey((k) => k + 1);
    }
  }, [currentIndex, showingSafetyScreenId]);

  const dismissSafetyScreen = useCallback(() => {
    setShowingSafetyScreenId(null);
    setCurrentIndex((i) => Math.min(i + 1, flatScreens.length - 1));
    setAnimKey((k) => k + 1);
  }, [flatScreens.length]);

  const submitAndComplete = useCallback(async (ans: ArcSurveyAnswers) => {
    const body: Record<string, unknown> = {
      lifeStage: ans.life_stage ?? null,
      cyclePattern: ans.cycle_regular ?? null,
      goals: [],
      symptoms: [],
      riskFactors: [],
      trainingVolume: ans.exercise_days ?? null,
      stressLevel: ans.stress_level ?? null,
      surveyResponses: ans,
    };
    try {
      await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally {
      setSubmitted(true);
    }
  }, []);

  const handleQuestionAnswer = useCallback(
    (
      variableId: string,
      value: string | number | (string | number)[] | undefined,
      triggers: Array<{ when: { eq: [string, string | number] }; action: string; screen_id: string }> | undefined
    ) => {
      handleAnswer(variableId, value);
      const val = Array.isArray(value) ? value[0] : value;
      const screenId =
        val !== undefined
          ? getTriggerScreenId(triggers, variableId, val as string | number)
          : undefined;
      if (screenId) setPendingSafetyScreenId(screenId);
    },
    [handleAnswer]
  );

  const handleComplete = useCallback(() => router.push("/dashboard"), [router]);

  if (submitted) {
    return <CompletionScreen onComplete={handleComplete} delayMs={2000} />;
  }

  if (showingSafetyScreenId) {
    const screen = screensById[showingSafetyScreenId];
    if (screen) {
      return (
        <div className="mx-auto w-full max-w-[720px] px-5 md:px-8 lg:px-10">
          <div className="flex flex-col gap-8 pt-10 md:pt-14">
            <SafetyPromptScreen screen={screen} onContinue={dismissSafetyScreen} />
            <nav className="flex border-t border-black/[0.06] pt-6">
              <button
                type="button"
                onClick={goBack}
                className="min-h-[48px] min-w-[48px] rounded-[18px] border border-black/[0.12] bg-transparent px-4 py-3 text-[16px] font-medium text-[var(--text-primary)] hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
              >
                Back
              </button>
            </nav>
          </div>
        </div>
      );
    }
  }

  if (!currentScreen || totalSteps === 0) return null;

  const isOutro = currentScreen.type === "outro";
  const isFirst = currentIndex === 0;
  const showBack = ui.allow_back_navigation && !isFirst && !showingSafetyScreenId;

  const stepContent = (
    <div key={animKey} className="survey-step">
      {currentScreen.type === "content_break" && (
        <ContentBreakScreen
          title={currentScreen.title}
          body={currentScreen.body}
          sectionTitle={currentScreen.sectionTitle}
        />
      )}

      {currentScreen.type === "question" && (
        <>
          <p className="text-[14px] font-medium text-black/70">{currentScreen.sectionTitle}</p>
          <h2
            id={`q-${currentScreen.item.id}`}
            className="mt-2 text-[24px] font-medium leading-snug text-[var(--text-primary)] md:text-[26px]"
          >
            {currentScreen.item.question}
          </h2>
          <div className="mt-6">
            <ArcAnswerCards
              question={currentScreen.item}
              value={answers[currentScreen.item.variable_id]}
              onChange={(v) =>
                handleQuestionAnswer(
                  currentScreen.item.variable_id,
                  v,
                  currentScreen.item.triggers
                )
              }
              showOptionalLabel={currentScreen.item.type === "optional_numeric"}
            />
          </div>
          {currentScreen.item.support && (
            <div className="mt-6">
              <InsightNote text={currentScreen.item.support} id={`note-${currentScreen.item.id}`} />
            </div>
          )}
        </>
      )}

      {currentScreen.type === "outro" && (
        <OutroScreen
          sectionTitle={currentScreen.sectionTitle}
          title={currentScreen.title}
          body={currentScreen.body}
          primaryLabel={currentScreen.primaryAction?.label ?? "Build my dashboard"}
          onSubmit={() => submitAndComplete(answers)}
        />
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 md:px-8 lg:px-10">
      {ui.show_progress && (
        <div className="pt-2">
          <SurveyProgressHeader
            sectionLabel={sectionLabel}
            current={currentIndex + 1}
            total={totalSteps}
          />
        </div>
      )}

      <div className="pt-10 md:pt-14">
        {stepContent}
      </div>

      {currentScreen.type !== "outro" && (
        <footer className="sticky bottom-0 border-t border-black/[0.06] bg-[var(--background)] py-6 md:static md:py-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={!showBack}
              aria-disabled={!showBack}
              className="min-h-[48px] min-w-[48px] rounded-[18px] border border-black/[0.12] bg-transparent px-4 py-3 text-[16px] font-medium text-[var(--text-primary)] hover:bg-black/[0.02] disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            >
              Back
            </button>
            <button
              ref={nextButtonRef}
              type="button"
              onClick={goNext}
              disabled={currentScreen.type === "question" && !isNextEnabled && currentScreen.item.type !== "optional_numeric"}
              aria-disabled={currentScreen.type === "question" && !isNextEnabled && currentScreen.item.type !== "optional_numeric"}
              className="min-h-[48px] rounded-[18px] bg-black/90 px-6 py-3 text-[16px] font-medium text-white hover:bg-black disabled:opacity-40 disabled:hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            >
              {currentScreen.type === "content_break" ? "Continue" : "Next"}
            </button>
          </nav>
        </footer>
      )}
    </div>
  );
}

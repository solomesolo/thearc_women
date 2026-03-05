"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { surveyConfig } from "@/lib/survey/surveySchema";
import { shouldShowQuestion, type SurveyAnswers } from "@/lib/survey/logic";
import type { SurveyQuestion, SurveySection } from "@/lib/survey/surveySchema";
import { ProgressBar } from "./ProgressBar";
import { QuestionScreen } from "./QuestionScreen";
import { CompletionScreen } from "./CompletionScreen";

/** Get visible questions in a section given current answers */
function getVisibleQuestions(section: SurveySection, answers: SurveyAnswers): SurveyQuestion[] {
  return section.questions.filter((q) => shouldShowQuestion(q.show_if, answers));
}

/** Count all visible questions across sections */
function getVisibleQuestionCount(answers: SurveyAnswers): number {
  return surveyConfig.sections.reduce(
    (n, s) => n + getVisibleQuestions(s, answers).length,
    0
  );
}

/** Count visible questions that have an answer */
function getCompletedCount(answers: SurveyAnswers): number {
  let count = 0;
  for (const section of surveyConfig.sections) {
    for (const q of getVisibleQuestions(section, answers)) {
      const v = answers[q.id];
      if (v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)) count++;
    }
  }
  return count;
}

export function SurveyContainer() {
  const router = useRouter();
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const currentSection = surveyConfig.sections[currentSectionIndex];
  const visibleQuestions = useMemo(
    () => (currentSection ? getVisibleQuestions(currentSection, answers) : []),
    [currentSection, answers]
  );

  const totalVisible = useMemo(() => getVisibleQuestionCount(answers), [answers]);
  const completedCount = useMemo(() => getCompletedCount(answers), [answers]);

  const handleAnswer = useCallback((questionId: string, value: string | number | (string | number)[] | undefined) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "") {
        delete next[questionId];
      } else {
        next[questionId] = value;
      }
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (currentSectionIndex < surveyConfig.sections.length - 1) {
      setCurrentSectionIndex((i) => i + 1);
    } else {
      submitAndComplete(answers);
    }
  }, [currentSectionIndex, answers]);

  const submitAndComplete = useCallback(async (ans: SurveyAnswers) => {
    const body = {
      lifeStage: ans.life_stage ?? null,
      cyclePattern: ans.cycle_pattern ?? null,
      goals: Array.isArray(ans.goals) ? ans.goals : [],
      symptoms: Array.isArray(ans.symptoms) ? ans.symptoms : [],
      riskFactors: Array.isArray(ans.risk_factors) ? ans.risk_factors : [],
      trainingVolume: ans.training_volume ?? null,
      stressLevel: ans.stress_level ?? null,
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

  const goBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
    }
  }, [currentSectionIndex]);

  const handleComplete = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  if (submitted) {
    return <CompletionScreen onComplete={handleComplete} delayMs={2000} />;
  }

  if (!currentSection) return null;

  return (
    <div className="flex w-full max-w-[680px] flex-col gap-8">
      <ProgressBar
        completed={completedCount}
        total={totalVisible}
        sectionIndex={currentSectionIndex}
        sectionTotal={surveyConfig.sections.length}
      />

      <QuestionScreen
        section={currentSection}
        sectionIndex={currentSectionIndex}
        sectionTotal={surveyConfig.sections.length}
        visibleQuestions={visibleQuestions}
        answers={answers}
        onAnswer={handleAnswer}
      />

      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] pt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={currentSectionIndex === 0}
          aria-disabled={currentSectionIndex === 0}
          className="min-h-[48px] min-w-[48px] rounded-[14px] border border-black/[0.1] bg-transparent px-4 py-3 text-[16px] font-medium text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          className="min-h-[48px] rounded-[14px] bg-black/90 px-6 py-3 text-[16px] font-medium text-white hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          {currentSectionIndex < surveyConfig.sections.length - 1 ? "Next" : "Submit"}
        </button>
      </nav>
    </div>
  );
}

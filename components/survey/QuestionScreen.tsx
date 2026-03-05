"use client";

import type { SurveySection, SurveyQuestion } from "@/lib/survey/surveySchema";
import type { SurveyAnswers } from "@/lib/survey/logic";
import { SectionHeader } from "./SectionHeader";
import { AnswerCards } from "./answers/AnswerCards";
import { EducationalNote } from "./EducationalNote";

type QuestionScreenProps = {
  section: SurveySection;
  sectionIndex: number;
  sectionTotal: number;
  visibleQuestions: SurveyQuestion[];
  answers: SurveyAnswers;
  onAnswer: (questionId: string, value: string | number | (string | number)[] | undefined) => void;
};

/**
 * One section: header + questions. Each question: label, answers (24px gap), note (12px gap).
 * Question text 24–28px; options 16–18px; notes 14px.
 */
export function QuestionScreen({
  section,
  sectionIndex,
  sectionTotal,
  visibleQuestions,
  answers,
  onAnswer,
}: QuestionScreenProps) {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title={section.title}
        sectionIndex={sectionIndex}
        sectionTotal={sectionTotal}
      />

      {visibleQuestions.map((q) => (
        <div key={q.id} className="flex flex-col gap-6">
          <div>
            <h3
              id={`q-${q.id}`}
              className="text-[24px] font-medium leading-snug text-[var(--text-primary)] md:text-[26px]"
            >
              {q.label}
            </h3>
            <div className="mt-6">
              <AnswerCards
                question={q}
                value={answers[q.id]}
                onChange={(v) => onAnswer(q.id, v)}
              />
            </div>
            {q.educational_note && (
              <div className="mt-3">
                <EducationalNote text={q.educational_note} id={`note-${q.id}`} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import type { SurveyQuestion } from "@/lib/survey/surveySchema";
import type { SurveyAnswers } from "@/lib/survey/logic";
import { MultipleChoiceAnswer } from "./MultipleChoiceAnswer";
import { ScaleAnswer } from "./ScaleAnswer";
import { NumericAnswer } from "./NumericAnswer";
import { OptionalNumericAnswer } from "./OptionalNumericAnswer";

type AnswerCardsProps = {
  question: SurveyQuestion;
  value: string | number | (string | number)[] | undefined;
  onChange: (value: string | number | (string | number)[] | undefined) => void;
};

function isScaleOptions(
  opts: SurveyQuestion["options"]
): opts is { min: number; max: number; step?: number; lowLabel?: string; highLabel?: string } {
  return opts != null && typeof opts === "object" && "min" in opts && "max" in opts;
}

export function AnswerCards({ question, value, onChange }: AnswerCardsProps) {
  const { id, type, options } = question;

  if (type === "multiple_choice" && options && !isScaleOptions(options)) {
    return (
      <MultipleChoiceAnswer
        questionId={id}
        options={options}
        value={value}
        onChange={onChange}
        multiple={question.multiple}
      />
    );
  }

  if (type === "scale" && options && isScaleOptions(options)) {
    return (
      <ScaleAnswer
        questionId={id}
        options={options}
        value={typeof value === "number" ? value : undefined}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (type === "numeric") {
    return (
      <NumericAnswer
        questionId={id}
        value={value as number | undefined}
        onChange={(v) => onChange(v ?? undefined)}
        placeholder={question.placeholder}
      />
    );
  }

  if (type === "optional_numeric") {
    return (
      <OptionalNumericAnswer
        questionId={id}
        value={value as number | undefined}
        onChange={(v) => onChange(v)}
        placeholder={question.placeholder}
      />
    );
  }

  return null;
}

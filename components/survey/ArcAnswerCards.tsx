"use client";

import type { ArcQuestionNormalized } from "@/lib/survey/arcSurveySchema";
import { MultipleChoiceAnswer } from "./answers/MultipleChoiceAnswer";
import { ScaleAnswer } from "./answers/ScaleAnswer";
import { NumericAnswer } from "./answers/NumericAnswer";
import { OptionalNumericAnswer } from "./answers/OptionalNumericAnswer";

type ArcAnswerCardsProps = {
  question: ArcQuestionNormalized;
  value: string | number | (string | number)[] | undefined;
  onChange: (value: string | number | (string | number)[] | undefined) => void;
  showOptionalLabel?: boolean;
};

export function ArcAnswerCards({ question, value, onChange, showOptionalLabel }: ArcAnswerCardsProps) {
  const { id, type, variable_id } = question;

  if (type === "multiple_choice" && question.options?.length) {
    return (
      <MultipleChoiceAnswer
        questionId={id}
        options={question.options}
        value={value}
        onChange={onChange}
        multiple={false}
      />
    );
  }

  if (type === "scale" && question.scale) {
    return (
      <ScaleAnswer
        questionId={id}
        options={{
          min: question.scale.min,
          max: question.scale.max,
          step: question.scale.step,
          lowLabel: question.scale.lowLabel,
          highLabel: question.scale.highLabel,
        }}
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
        placeholder={question.input?.placeholder}
      />
    );
  }

  if (type === "optional_numeric") {
    return (
      <div className="flex flex-col gap-2">
        {showOptionalLabel && (
          <p className="text-[12px] text-black/55">Optional</p>
        )}
        <OptionalNumericAnswer
          questionId={id}
          value={value as number | undefined}
          onChange={(v) => onChange(v)}
          placeholder={question.input?.placeholder}
        />
      </div>
    );
  }

  return null;
}

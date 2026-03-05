/**
 * Conditional logic engine. Evaluates show_if rules against current answers.
 */

import type { ShowIf, LogicCondition } from "./surveySchema";

export type SurveyAnswers = Record<string, string | number | (string | number)[]>;

function matchesCondition(
  answer: string | number | (string | number)[] | undefined,
  condition: LogicCondition
): boolean {
  const normalized = Array.isArray(answer) ? answer : answer === undefined ? undefined : answer;

  if (typeof condition === "string" || typeof condition === "number") {
    if (Array.isArray(normalized)) return normalized.includes(condition);
    return normalized === condition;
  }

  if (condition && typeof condition === "object" && "not" in condition) {
    const notVal = (condition as { not: string | number }).not;
    if (Array.isArray(normalized)) return !normalized.includes(notVal);
    return normalized !== notVal;
  }

  if (condition && typeof condition === "object" && "in" in condition) {
    const inArr = (condition as { in: (string | number)[] }).in;
    if (normalized === undefined) return false;
    if (Array.isArray(normalized)) {
      return normalized.some((v) => inArr.includes(v));
    }
    return inArr.includes(normalized as string | number);
  }

  return false;
}

/**
 * Returns true if the question should be shown given current answers.
 * show_if is AND: all referenced answers must match their conditions.
 */
export function shouldShowQuestion(show_if: ShowIf | undefined, answers: SurveyAnswers): boolean {
  if (!show_if || Object.keys(show_if).length === 0) return true;
  for (const [questionId, condition] of Object.entries(show_if)) {
    const answer = answers[questionId];
    if (!matchesCondition(answer, condition)) return false;
  }
  return true;
}

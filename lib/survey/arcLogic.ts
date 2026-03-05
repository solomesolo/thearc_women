/**
 * Arc survey logic: evaluate conditions and display_if for sections and items.
 * Answers keyed by variable_id.
 */

import type { ArcCondition, ArcDisplayIf, ArcSurveyNormalized } from "./arcSurveySchema";

export type ArcSurveyAnswers = Record<string, string | number | (string | number)[] | undefined>;

function evalEq(answers: ArcSurveyAnswers, variableId: string, value: string | number): boolean {
  const ans = answers[variableId];
  if (ans === undefined) return false;
  if (Array.isArray(ans)) return ans.includes(value);
  return ans === value;
}

function evalCondition(condition: ArcCondition, answers: ArcSurveyAnswers): boolean {
  if ("anyOf" in condition) {
    return condition.anyOf.some((c) => c.eq && evalEq(answers, c.eq[0], c.eq[1]));
  }
  if ("not" in condition) {
    const inner = condition.not;
    if (inner && "eq" in inner) return !evalEq(answers, inner.eq[0], inner.eq[1]);
    return false;
  }
  return false;
}

function evalDisplayIf(displayIf: ArcDisplayIf, answers: ArcSurveyAnswers, conditions: Record<string, ArcCondition>): boolean {
  if ("ref" in displayIf) {
    const cond = conditions[displayIf.ref];
    return cond ? evalCondition(cond, answers) : false;
  }
  if ("not" in displayIf) {
    const inner = displayIf.not;
    if ("ref" in inner) {
      const cond = conditions[inner.ref];
      return cond ? !evalCondition(cond, answers) : true;
    }
    if ("eq" in inner) return !evalEq(answers, inner.eq[0], inner.eq[1]);
    return !evalDisplayIf(inner as ArcDisplayIf, answers, conditions);
  }
  if ("eq" in displayIf) return evalEq(answers, displayIf.eq[0], displayIf.eq[1]);
  return true;
}

export function shouldShowSection(
  displayIf: ArcDisplayIf | undefined,
  answers: ArcSurveyAnswers,
  conditions: Record<string, ArcCondition>
): boolean {
  if (!displayIf) return true;
  return evalDisplayIf(displayIf, answers, conditions);
}

export function shouldShowItem(
  displayIf: ArcDisplayIf | undefined,
  answers: ArcSurveyAnswers,
  conditions: Record<string, ArcCondition>
): boolean {
  if (!displayIf) return true;
  return evalDisplayIf(displayIf, answers, conditions);
}

/** Check if a trigger fires for a given variable_id and selected value */
export function getTriggerScreenId(
  triggers: Array<{ when: { eq: [string, string | number] }; action: string; screen_id: string }> | undefined,
  variableId: string,
  value: string | number
): string | undefined {
  if (!triggers?.length) return undefined;
  const t = triggers.find((t) => t.when.eq[0] === variableId && t.when.eq[1] === value);
  return t?.action === "show_screen" ? t.screen_id : undefined;
}

/**
 * Build flat list of screens (intro, items, outro; safety screens inserted by trigger).
 * Each element: { type: 'content_break' | 'question' | 'safety_prompt', section, ... }
 */
export type FlatScreen =
  | { type: "content_break"; id: string; title: string; body: string; sectionId: string; sectionTitle: string }
  | { type: "question"; item: import("./arcSurveySchema").ArcQuestionNormalized; sectionId: string; sectionTitle: string }
  | { type: "safety_prompt"; screen: import("./arcSurveySchema").ArcLogicScreen }
  | { type: "outro"; id: string; title: string; body: string; primaryAction?: { label: string; action: string }; sectionId: string; sectionTitle: string };

export function buildFlatScreens(config: ArcSurveyNormalized, answers: ArcSurveyAnswers): FlatScreen[] {
  const conditions = config.logic.conditions;
  const out: FlatScreen[] = [];

  for (const section of config.sections) {
    if (!shouldShowSection(section.display_if, answers, conditions)) continue;

    const sectionId = section.id;
    const sectionTitle = section.title;

    if (section.intro) {
      out.push({
        type: "content_break",
        id: `intro_${sectionId}`,
        title: section.intro.title,
        body: section.intro.body,
        sectionId,
        sectionTitle,
      });
    }

    for (const item of section.items) {
      if (item.kind === "content_break") {
        out.push({
          type: "content_break",
          id: item.id,
          title: item.title,
          body: item.body,
          sectionId,
          sectionTitle,
        });
      } else {
        if (!shouldShowItem(item.display_if, answers, conditions)) continue;
        out.push({ type: "question", item, sectionId, sectionTitle });
      }
    }

    if (section.outro) {
      out.push({
        type: "outro",
        id: `outro_${sectionId}`,
        title: section.outro.title,
        body: section.outro.body,
        primaryAction: section.outro.primary_action,
        sectionId,
        sectionTitle,
      });
    }
  }

  return out;
}

/**
 * Count only question screens (for progress). Content breaks and safety/outro can be excluded or included;
 * spec says "show_progress" and "stepper" — we use total steps = all screens, completed = answered questions + passed content/outro.
 */
export function countQuestionScreens(flat: FlatScreen[]): number {
  return flat.filter((s) => s.type === "question").length;
}

export function countCompletedScreens(flat: FlatScreen[], answers: ArcSurveyAnswers, currentIndex: number): number {
  let n = 0;
  for (let i = 0; i <= currentIndex && i < flat.length; i++) {
    const s = flat[i];
    if (s.type === "question") {
      const v = answers[s.item.variable_id];
      if (v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)) n++;
    } else n++; // content_break / safety / outro count as completed when passed
  }
  return n;
}

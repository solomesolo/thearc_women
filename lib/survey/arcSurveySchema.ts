/**
 * Types and loader for Arc Core Intake survey (arc_core_intake_v1.json).
 * Supports meta, ui_defaults, logic (conditions + screens), sections with intro/outro and items.
 */

export type ArcQuestionType =
  | "multiple_choice"
  | "scale"
  | "numeric"
  | "optional_numeric";

/** Raw display_if from JSON: ref to named condition, or not/eq */
export type ArcDisplayIf =
  | { ref: string }
  | { not: ArcDisplayIf | { ref: string } | { eq: [string, string | number] } }
  | { eq: [string, string | number] };

/** Raw condition from logic.conditions */
export type ArcCondition =
  | { anyOf: Array<{ eq: [string, string | number] }> }
  | { not: { eq: [string, string | number] } };

/** Trigger: when answer matches, show a screen */
export type ArcTrigger = {
  when: { eq: [string, string | number] };
  action: "show_screen";
  screen_id: string;
};

/** Raw question item from JSON */
export type ArcQuestionItem = {
  id: string;
  kind: "question";
  variable_id: string;
  question: string;
  type: ArcQuestionType;
  options?: string[];
  scale?: { min: number; max: number; step?: number };
  labels?: { min?: string; mid?: string; max?: string };
  input?: { placeholder?: string; min: number; max: number; unit?: string };
  support?: string;
  display_if?: ArcDisplayIf;
  triggers?: ArcTrigger[];
};

/** Raw content break item */
export type ArcContentBreakItem = {
  id: string;
  kind: "content_break";
  type: "content_break";
  title: string;
  body: string;
};

export type ArcSectionItem = ArcQuestionItem | ArcContentBreakItem;

export type ArcContentBreakIntro = {
  type: "content_break";
  title: string;
  body: string;
};

export type ArcOutro = ArcContentBreakIntro & {
  primary_action?: { label: string; action: string };
};

/** Raw section from JSON */
export type ArcSectionRaw = {
  id: string;
  title: string;
  short_title?: string;
  intro?: ArcContentBreakIntro;
  outro?: ArcOutro;
  display_if?: ArcDisplayIf;
  items: ArcSectionItem[];
};

/** Logic screen (e.g. safety_prompt) */
export type ArcLogicScreen = {
  id: string;
  type: "safety_prompt";
  title: string;
  body: string;
  actions: Array<{ label: string; action: string }>;
};

export type ArcSurveyConfigRaw = {
  meta: {
    survey_id: string;
    source_spec?: string;
    estimated_questions?: number;
    estimated_time_minutes?: string;
    tone?: { voice?: string; audience?: string; rules?: string[] };
  };
  ui_defaults: {
    one_question_per_screen: boolean;
    auto_advance_on_select: {
      multiple_choice: boolean;
      boolean: boolean;
      scale: boolean;
      numeric: boolean;
      optional_numeric: boolean;
    };
    allow_back_navigation: boolean;
    show_progress: boolean;
    progress_style: "stepper" | string;
    accessibility?: { keyboard_shortcuts?: boolean; min_tap_target_px?: number };
  };
  logic: {
    conditions: Record<string, ArcCondition>;
    screens: ArcLogicScreen[];
  };
  sections: ArcSectionRaw[];
};

// ——— Normalized (runtime) types ———

export type SurveyOption = { value: string; label: string };

/** Normalized question for UI: options as { value, label }, scale as min/max/step + lowLabel/highLabel */
export type ArcQuestionNormalized = {
  id: string;
  kind: "question";
  variable_id: string;
  question: string;
  type: ArcQuestionType;
  options?: SurveyOption[];
  scale?: { min: number; max: number; step?: number; lowLabel?: string; highLabel?: string };
  input?: { placeholder?: string; min: number; max: number; unit?: string };
  support?: string;
  display_if?: ArcDisplayIf;
  triggers?: ArcTrigger[];
};

export type ArcContentBreakNormalized = {
  id: string;
  kind: "content_break";
  title: string;
  body: string;
};

export type ArcScreenItem =
  | ArcQuestionNormalized
  | ArcContentBreakNormalized
  | { kind: "safety_prompt"; screen: ArcLogicScreen };

export type ArcSectionNormalized = {
  id: string;
  title: string;
  short_title?: string;
  intro?: ArcContentBreakIntro;
  outro?: ArcOutro;
  display_if?: ArcDisplayIf;
  items: (ArcQuestionNormalized | ArcContentBreakNormalized)[];
};

export type ArcSurveyNormalized = {
  meta: ArcSurveyConfigRaw["meta"];
  ui_defaults: ArcSurveyConfigRaw["ui_defaults"];
  logic: ArcSurveyConfigRaw["logic"];
  sections: ArcSectionNormalized[];
};

function normalizeOptions(options: string[] | undefined): SurveyOption[] | undefined {
  if (!options?.length) return undefined;
  return options.map((o) => ({ value: o, label: o }));
}

function normalizeQuestion(item: ArcQuestionItem): ArcQuestionNormalized {
  const base: ArcQuestionNormalized = {
    id: item.id,
    kind: "question",
    variable_id: item.variable_id,
    question: item.question,
    type: item.type,
    support: item.support,
    display_if: item.display_if,
    triggers: item.triggers,
  };
  if (item.options) base.options = normalizeOptions(item.options);
  if (item.scale) {
    base.scale = {
      min: item.scale.min,
      max: item.scale.max,
      step: item.scale.step ?? 1,
      lowLabel: item.labels?.min,
      highLabel: item.labels?.max,
    };
  }
  if (item.input) base.input = item.input;
  return base;
}

function normalizeSection(section: ArcSectionRaw): ArcSectionNormalized {
  const items: (ArcQuestionNormalized | ArcContentBreakNormalized)[] = [];
  for (const it of section.items) {
    if (it.kind === "question") items.push(normalizeQuestion(it));
    else if (it.kind === "content_break") items.push({ id: it.id, kind: "content_break", title: it.title, body: it.body });
  }
  return {
    id: section.id,
    title: section.title,
    short_title: section.short_title,
    intro: section.intro,
    outro: section.outro,
    display_if: section.display_if,
    items,
  };
}

export function loadArcSurvey(raw: ArcSurveyConfigRaw): ArcSurveyNormalized {
  return {
    meta: raw.meta,
    ui_defaults: raw.ui_defaults,
    logic: raw.logic,
    sections: raw.sections.map(normalizeSection),
  };
}

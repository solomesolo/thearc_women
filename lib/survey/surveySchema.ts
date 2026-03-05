/**
 * Survey data schema. Survey runs from this configuration.
 * Structure: section → question → type, options, logic, educational_note.
 */

export type QuestionType =
  | "multiple_choice"
  | "scale"
  | "numeric"
  | "optional_numeric";

/** Condition: equals value, or not value, or in list */
export type LogicCondition =
  | string
  | number
  | { not: string | number }
  | { in: (string | number)[] };

/** show_if: questionId -> condition. Question is shown when condition matches answers. */
export type ShowIf = Record<string, LogicCondition>;

export type SurveyOption = {
  value: string | number;
  label: string;
};

export type SurveyQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  /** For multiple_choice: options. For scale: min, max, step, labels. */
  options?: SurveyOption[] | { min: number; max: number; step?: number; lowLabel?: string; highLabel?: string };
  /** multiple_choice: allow selecting more than one. */
  multiple?: boolean;
  /** Optional: show this question only when condition matches (e.g. life_stage != menopause). */
  show_if?: ShowIf;
  /** Shown below answer options. */
  educational_note?: string;
  /** optional_numeric: placeholder */
  placeholder?: string;
};

export type SurveySection = {
  id: string;
  title: string;
  questions: SurveyQuestion[];
};

export type SurveyConfig = {
  id: string;
  title: string;
  sections: SurveySection[];
};

/** Populated from spec (life stage, cycle, goals, symptoms, risk, training, stress). */
export const surveyConfig: SurveyConfig = {
  id: "health-profile",
  title: "Health survey",
  sections: [
    {
      id: "context",
      title: "Context",
      questions: [
        {
          id: "life_stage",
          type: "multiple_choice",
          label: "What best describes your life stage?",
          options: [
            { value: "reproductive", label: "Reproductive" },
            { value: "perimenopause", label: "Perimenopause" },
            { value: "postmenopause", label: "Postmenopause" },
          ],
          educational_note: "Hormonal context helps us interpret your signals and tailor recommendations.",
        },
        {
          id: "cycle_pattern",
          type: "multiple_choice",
          label: "How would you describe your cycle?",
          options: [
            { value: "regular", label: "Regular" },
            { value: "irregular", label: "Irregular" },
            { value: "none", label: "Not applicable" },
          ],
          show_if: { life_stage: { not: "postmenopause" } },
          educational_note: "Cycle pattern affects how we interpret recovery and energy data.",
        },
      ],
    },
    {
      id: "goals",
      title: "Goals",
      questions: [
        {
          id: "goals",
          type: "multiple_choice",
          label: "What are your main goals? (Select all that apply.)",
          multiple: true,
          options: [
            { value: "training_performance", label: "Training performance" },
            { value: "energy_stability", label: "Energy stability" },
            { value: "sleep_quality", label: "Sleep quality" },
            { value: "stress_resilience", label: "Stress resilience" },
            { value: "hormonal_transition", label: "Hormonal transition" },
            { value: "preventive_risk", label: "Preventive / risk" },
          ],
          educational_note: "We use this to prioritize what shows up on your dashboard.",
        },
      ],
    },
    {
      id: "symptoms",
      title: "Symptoms & factors",
      questions: [
        {
          id: "symptoms",
          type: "multiple_choice",
          label: "Are any of these relevant to you? (Select all that apply.)",
          multiple: true,
          options: [
            { value: "sleep_disruption", label: "Sleep disruption" },
            { value: "fatigue", label: "Fatigue" },
            { value: "mood_focus", label: "Mood or focus shifts" },
            { value: "cycle_changes", label: "Cycle changes" },
            { value: "bloating_inflammation", label: "Bloating / inflammation" },
          ],
        },
        {
          id: "risk_factors",
          type: "multiple_choice",
          label: "Any of these risk areas you want to keep in view?",
          multiple: true,
          options: [
            { value: "bone_health", label: "Bone health" },
            { value: "cardiometabolic", label: "Cardiometabolic" },
            { value: "family_screening", label: "Family history (screening)" },
          ],
        },
      ],
    },
    {
      id: "lifestyle",
      title: "Lifestyle",
      questions: [
        {
          id: "training_volume",
          type: "multiple_choice",
          label: "How would you describe your current training volume?",
          options: [
            { value: "low", label: "Low" },
            { value: "moderate", label: "Moderate" },
            { value: "high", label: "High" },
          ],
        },
        {
          id: "stress_level",
          type: "multiple_choice",
          label: "How would you rate your typical stress level?",
          options: [
            { value: "low", label: "Low" },
            { value: "moderate", label: "Moderate" },
            { value: "high", label: "High" },
          ],
        },
        {
          id: "sleep_hours",
          type: "optional_numeric",
          label: "Roughly how many hours of sleep do you get per night?",
          placeholder: "e.g. 7",
          educational_note: "Optional. We use this for context, not as medical data.",
        },
      ],
    },
  ],
};

/** Total question count (all sections). Used for progress. */
export function getTotalQuestionCount(config: SurveyConfig): number {
  return config.sections.reduce((n, s) => n + s.questions.length, 0);
}

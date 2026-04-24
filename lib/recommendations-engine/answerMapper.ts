// Maps internal DB survey answer keys to the display values used in the SQLite rules engine.

const FIELD_ANSWER_MAP: Record<string, Record<string, string>> = {
  age_range: {
    "18_24": "18–24",
    "25_29": "25–29",
    "30_34": "30–34",
    "35_39": "35–39",
    "40_44": "40–44",
    "45_49": "45–49",
    "50_54": "50–54",
    "55_plus": "55+",
    under_18: "Under 18",
  },
  life_stage: {
    reproductive: "Menstruating / reproductive years",
    trying_to_conceive: "Trying to conceive",
    pregnant: "Pregnant",
    postpartum: "Postpartum (last 12 months)",
    perimenopause: "Perimenopause",
    postmenopause: "Postmenopause",
    prefer_not_to_say: "Prefer not to say",
  },
  goals: {
    general_preventive_health: "General preventive health",
    more_energy_and_vitality: "More energy / less fatigue",
    hormones_and_cycle_balance: "Hormones / cycle balance",
    fertility_and_reproductive_planning: "Fertility / reproductive planning",
    weight_and_metabolism: "Weight / metabolism",
    mood_stress_sleep: "Mood / stress / sleep",
    gut_health_and_digestion: "Gut health / digestion",
    cardiovascular_long_term_health: "Cardiovascular / long-term health",
    thyroid_health: "Thyroid health",
    just_exploring: "I'm not sure",
  },
  symptoms: {
    fatigue: "Fatigue / low energy",
    hair_loss: "Hair loss / brittle hair",
    low_mood: "Low mood / mood swings",
    poor_sleep: "Poor sleep",
    high_stress: "High stress",
    weight_gain: "Weight gain / hard to lose weight",
    irregular_cycle: "Irregular cycle",
    painful_periods: "Painful periods",
    heavy_periods: "Heavy periods",
    acne_or_excess_facial_hair: "Acne / excess facial hair",
    low_libido: "Low libido",
    digestive_issues: "Digestive issues / bloating",
    frequent_infections: "Frequent infections",
    brain_fog: "Brain fog",
    headaches: "Headaches / migraines",
    none: "None of these",
  },
  sun_exposure: {
    most_days: "Most days",
    few_times_per_week: "A few times per week",
    rarely: "Rarely",
    almost_never: "Almost never",
  },
  diet_pattern: {
    omnivore: "Omnivore",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    low_red_meat: "Low red meat intake",
    low_fish: "Low fish intake",
    dairy_free: "Dairy-free",
    gluten_free: "Gluten-free",
    restrictive_dieting: "Restrictive dieting",
    none: "None of these",
  },
  lifestyle_context: {
    intense_exercise_4plus: "I exercise intensely 4+ times/week",
    poor_sleep_most_weeks: "I sleep poorly most weeks",
    chronically_stressed: "I feel chronically stressed",
    shift_work: "I work shifts / irregular hours",
    none: "None of these",
  },
  known_conditions: {
    pcos: "PCOS",
    endometriosis: "Endometriosis",
    thyroid_disorder: "Thyroid disorder",
    iron_deficiency_or_anemia: "Iron deficiency / anemia",
    vitamin_d_deficiency: "Vitamin D deficiency",
    high_cholesterol: "High cholesterol",
    prediabetes_or_insulin_resistance: "Prediabetes / insulin resistance",
    diabetes: "Diabetes",
    fertility_issues: "Fertility issues",
    recurrent_urogenital_infections: "Recurrent UTIs or vaginal infections",
    gut_condition: "Gut condition / IBS / celiac",
    none: "None of these",
    prefer_not_to_say: "Prefer not to say",
  },
  medications_or_hormones: {
    hormonal_contraception: "Hormonal contraception",
    thyroid_medication: "Thyroid medication",
    iron_supplements: "Iron supplements",
    vitamin_d_supplements: "Vitamin D supplements",
    fertility_medication: "Fertility medication",
    glp1_weight_loss_medication: "GLP-1 / weight-loss medication",
    none: "None of these",
  },
  family_history: {
    thyroid_disease: "Thyroid disease",
    diabetes: "Diabetes",
    high_cholesterol_or_heart_disease: "High cholesterol / heart disease",
    early_menopause: "Early menopause",
    breast_or_ovarian_cancer: "Breast / ovarian cancer",
    autoimmune_disease: "Autoimmune disease",
    none_known: "None known",
  },
  cycle_pattern: {
    regular: "Regular",
    irregular: "Irregular",
    very_painful: "Very painful",
    very_heavy: "Very heavy",
    no_current_period: "I don't currently menstruate",
    prefer_not_to_say: "Prefer not to say",
  },
};

const RECENCY_TO_SQLITE: Record<string, string> = {
  lt_3m: "In the last 3 months",
  between_3_6m: "3–6 months ago",
  between_6_12m: "6–12 months ago",
  gt_12m: "More than 12 months ago",
  unknown: "Never / not sure",
};

// Recency urgency order (0 = most recent, 4 = oldest/unknown)
const RECENCY_URGENCY: Record<string, number> = {
  lt_3m: 0,
  between_3_6m: 1,
  between_6_12m: 2,
  gt_12m: 3,
  unknown: 4,
};

export interface MappedAnswer {
  field_key: string;
  answer_options: string[];
}

export function mapAnswersToSqlite(
  answers: Array<{ questionKey: string; answerValue: unknown }>,
): MappedAnswer[] {
  const result: MappedAnswer[] = [];

  for (const { questionKey, answerValue } of answers) {
    if (questionKey === "last_tests") {
      // last_tests is a nested {testKey: recency} object — find worst recency overall
      if (answerValue && typeof answerValue === "object" && !Array.isArray(answerValue)) {
        const recencies = Object.values(answerValue as Record<string, string>).filter(Boolean);
        if (recencies.length > 0) {
          const worst = recencies.reduce((a, b) =>
            (RECENCY_URGENCY[b] ?? 0) > (RECENCY_URGENCY[a] ?? 0) ? b : a,
          );
          const sqliteLabel = RECENCY_TO_SQLITE[worst];
          if (sqliteLabel) {
            result.push({ field_key: "last_tests", answer_options: [sqliteLabel] });
          }
        }
      }
      continue;
    }

    const fieldMap = FIELD_ANSWER_MAP[questionKey];
    if (!fieldMap) continue;

    if (Array.isArray(answerValue)) {
      const mapped = (answerValue as string[])
        .map((v) => fieldMap[String(v)])
        .filter(Boolean) as string[];
      if (mapped.length) result.push({ field_key: questionKey, answer_options: mapped });
    } else if (answerValue != null && answerValue !== "") {
      const mapped = fieldMap[String(answerValue)];
      if (mapped) result.push({ field_key: questionKey, answer_options: [mapped] });
    }
  }

  return result;
}

export function answerDisplayLabel(fieldKey: string, internalKey: string): string {
  return FIELD_ANSWER_MAP[fieldKey]?.[internalKey] ?? internalKey;
}

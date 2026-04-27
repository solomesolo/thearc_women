// Progression (string union, persisted in Postgres):
// missing → reminder_set/planned → completed → result_uploaded
export type CheckStatus =
  | "missing"
  | "reminder_set"
  | "planned"
  | "completed"
  | "result_uploaded";
export type ImpactLevel = "HIGH IMPACT" | "MEDIUM IMPACT" | "LOW IMPACT";

export interface RelevanceSignal {
  source: string;       // e.g. "Symptom", "Diet", "Goal"
  label: string;        // e.g. "Fatigue / low energy"
  explanation: string;  // from answer_signal_explanations
}

export interface IncludedTestsCategory {
  category: string;
  tests: string[];
}

export interface MatchedBiomarker {
  name: string;
  category: string;
  whyIncluded: string;
  priority: string;     // "core" | "extended"
}

export type PathwayTimeframe =
  | "next_month"
  | "next_3_months"
  | "next_6_months"
  | "next_year"
  | "optional_later";

export interface CheckActions {
  canBookLab: boolean;
  canOrderHomeTest: boolean;
  canAskDoctor: boolean;
  canAddReminder: boolean;
  canUploadResult: boolean;
}

export interface CheckReminder {
  id: string;
  remindAt: string;
  timeframe: PathwayTimeframe | null;
  channel: string;
  status: string;
}

export interface UploadedResult {
  id: string;
  documentId: string | null;
  fileName: string | null;
  fileType: string | null;
  source: string | null;
  testDate: string | null;
  uploadedAt: string;
}

export interface CheckRecommendation {
  checkKey: string;
  checkName: string;
  isScreening: boolean;
  timeframe: PathwayTimeframe;
  priorityRank: number;
  status: CheckStatus;
  impact: ImpactLevel;
  score: number;
  // User-facing copy (from canonical_check_config + content builder)
  recommendedTiming: string;       // e.g. "Recommended now"
  shortSummary: string;            // from canonical_check_config
  whyForYou: string;               // personalized (max ~2 sentences)
  whyNow: string;                  // 1 sentence
  canWait: string | null;          // 1 sentence
  nextAction: string | null;
  relevanceSignals: RelevanceSignal[];
  includedTestsPreview: string[];
  includedTestsByCategory: IncludedTestsCategory[];
  matchedBiomarkers: MatchedBiomarker[];
  plannedAt: string | null;
  completedAt: string | null;
  actions: CheckActions;
  reminder: CheckReminder | null;
  uploadedResults: UploadedResult[];
}

export interface RecommendationSummary {
  nextBestAction: {
    checkKey: string;
    checkName: string;
    why: string;
  } | null;
  nextMonthCount: number;
  plannedCount: number;
  completedCount: number;
  uploadedResultsCount: number;
  healthScore: number; // completeness %
}

export interface ProfileSummary {
  ageGroup: string | null;
  lifeStage: string | null;
  goals: string[];
}

export type PathwayPayload = Record<PathwayTimeframe, CheckRecommendation[]>;

// ─── Fixed-spec API contract additions ────────────────────────────────────────

export type FixedTimeframe =
  | "current_month"
  | "next_3_months"
  | "next_6_months"
  | "next_year"
  | "optional_later";

export type FinalImpact = "HIGH" | "MEDIUM" | "LOW";
export type FinalStatus = "MISSING" | "PLANNED" | "DONE";

export interface PathwayTimelineEntry {
  timeframe: FixedTimeframe;
  label: string; // e.g. "This month: April"
  calendarStart: string; // YYYY-MM-DD
  calendarEnd: string; // YYYY-MM-DD
  checks: Array<{ checkKey: string; checkName: string; priorityRank: number; status: FinalStatus }>;
}

export interface FinalRecommendation {
  checkKey: string;
  checkName: string;
  shortSummary: string;
  whyRecommendedForYou: string;
  priorityExplanation: {
    whyNow: string;
    timingReason: string;
  };
  coreTestsNow: string[];
  supportingTests: string[];
  laterTests: string[];
  whatCanWait: string | null;
  timeframe: FixedTimeframe;
  impact: FinalImpact;
  status: FinalStatus;
}

export interface RecommendationsPayload {
  summary: RecommendationSummary;
  profile: ProfileSummary | null;
  pathway: PathwayPayload;
  // New fixed-spec fields (UI should migrate to these)
  pathwayTimeline?: PathwayTimelineEntry[];
  recommendations?: FinalRecommendation[];
}

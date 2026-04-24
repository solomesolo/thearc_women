export type CheckStatus = "MISSING" | "PLANNED" | "DONE";
export type ImpactLevel = "HIGH IMPACT" | "MEDIUM IMPACT" | "LOW IMPACT";

export interface RelevanceSignal {
  source: string;       // e.g. "Symptom", "Diet", "Goal"
  label: string;        // e.g. "Fatigue / low energy"
  explanation: string;  // from answer_signal_explanations
}

export interface IncludedTestCategory {
  category: string;     // e.g. "Iron and blood count"
  items: string[];      // biomarker names, deduped
}

export interface MatchedBiomarker {
  name: string;
  category: string;
  whyIncluded: string;
  priority: string;     // "core" | "extended"
}

export interface CheckRecommendation {
  checkKey: string;
  checkName: string;
  priorityRank: number;
  status: CheckStatus;
  progressLabel: string;
  impact: ImpactLevel;
  score: number;
  recommendedTiming: string;       // from canonical_check_config
  shortSummary: string;            // from canonical_check_config
  whyRecommendedForYou: string;    // personalized, built from matched signals
  priorityRationale: string;       // from canonical_check_config.priority_rule
  whatCanWait: string | null;      // from canonical_check_config.what_can_wait
  nextAction: string | null;       // from canonical_check_config.next_action
  relevanceSignals: RelevanceSignal[];
  includedTests: IncludedTestCategory[];
  matchedBiomarkers: MatchedBiomarker[];
  plannedAt: string | null;
  completedAt: string | null;
}

export interface RecommendationSummary {
  recommendedCount: number;
  plannedCount: number;
  completedCount: number;
  healthScore: number;
  topGaps: number;
  nextRecommendedCheck: string | null;
}

export interface ProfileSummary {
  ageGroup: string | null;
  lifeStage: string | null;
  goals: string[];
}

export interface TopPriority {
  checkKey: string;
  checkName: string;
  status: CheckStatus;
  impact: ImpactLevel;
  priorityRank: number;
  shortReason: string;   // 1-line personalized reason for dashboard
}

export interface UpcomingCheck {
  checkKey: string;
  checkName: string;
  timeLabel: string;
}

export interface RecommendationsPayload {
  summary: RecommendationSummary;
  profile: ProfileSummary;
  topPriorities: TopPriority[];
  upcomingChecks: UpcomingCheck[];
  recommendations: CheckRecommendation[];
}

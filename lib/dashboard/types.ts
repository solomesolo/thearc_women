export type DashboardHero = {
  code: string;
  title: string;
  shortBody: string;
  longBody: string | null;
  keyLever: string | null;
  tone: string | null;
  severity: string | null;
  evidence?: unknown;
};

export type DashboardKeyArea = {
  area: string;
  code: string;
  state: string;
  title: string;
  shortBody: string;
  longBody: string | null;
  whyItMatters: string | null;
  whatInfluencesThis: string | null;
  severity: string | null;
  score: number;
  evidence?: unknown;
};

export type DashboardSignal = {
  signalCode: string;
  title: string;
  domain: string;
  category: string | null;
  score: number;
  scoreNormalized: number | null;
  severity: string | null;
  interpretation: string | null;
  evidence?: unknown;
};

export type DashboardPayload = {
  responseSessionId: string;
  surveyId: string | null;
  generatedAt: string | null;
  hero: DashboardHero | null;
  keyAreas: DashboardKeyArea[];
  signals?: DashboardSignal[];
  warnings?: string[];
};


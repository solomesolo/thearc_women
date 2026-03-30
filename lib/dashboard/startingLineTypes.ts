/**
 * DTO for the "Your Starting Line" hero card.
 * All fields are resolved from the user's latest engine run in Supabase.
 * The frontend renders only from this type — no client-side inference.
 */

export type StartingLineHero = {
  code: string;
  title: string;
  subtitle: string;
  confidence: 'low' | 'medium' | 'high';
  score: number;
};

export type StartingLineFocus = {
  code: string;
  label: string;
  confidence: 'low' | 'medium' | 'high';
  score: number;
};

export type StartingLineKeyArea = {
  /** key_area_code, e.g. "sleep", "energy" */
  code: string;
  /** resolved_state_code, e.g. "disrupted", "stable" */
  stateCode: string;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  /** editorial from key_area_states join */
  title: string | null;
  shortBody: string | null;
  whyItMatters: string | null;
  severity: string | null;
};

export type StartingLineSignal = {
  code: string;
  label: string;
  strength: 'mild' | 'moderate' | 'strong';
  confidence: 'low' | 'medium' | 'high';
};

export type StartingLineViewModel = {
  runId: string;
  updatedAt: string;
  hero: StartingLineHero;
  /** Top focus / key lever. Null when engine has insufficient confidence. */
  focus: StartingLineFocus | null;
  explainers: {
    /** Primary reasons shown in "What's behind this" */
    primary: string[];
    secondary: string[];
  };
  contributingSignals: StartingLineSignal[];
  keyAreas: StartingLineKeyArea[];
  debug: {
    heroCode: string;
    source: 'resolved_run' | 'fallback';
    runId: string;
  };
};

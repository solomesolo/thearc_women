"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { TestKey, RecencyOption } from "@/content/onboarding/survey-options";
import { ENGINE_A_STORAGE, ARC_SURVEY_STORAGE_KEY, getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { apiGetQuestionnaireSessionState } from "@/lib/profile-engine-a/frontendClient";

export type SurveyBasics = {
  ageRange: string; // canonical key, e.g. "30_34"
  lifeStage: string; // canonical key, e.g. "reproductive"
  goals: string[];
};

export type SurveyLifestyle = {
  symptoms: string[];
  cyclePattern?: string;
  sunExposure: string;
  dietPattern: string[];
  lifestyleContext: string[];
};

export type SurveyHealthContext = {
  conditions: string[];
  medications: string[];
  familyHistory: string[];
};

export type SurveyTestHistory = Partial<Record<TestKey, RecencyOption>>;

export type SurveyState = {
  completedSteps: number[];
  basics: SurveyBasics;
  lifestyle: SurveyLifestyle;
  healthContext: SurveyHealthContext;
  testHistory: SurveyTestHistory;
};

const EMPTY: SurveyState = {
  completedSteps: [],
  basics: { ageRange: "", lifeStage: "", goals: [] },
  lifestyle: { symptoms: [], cyclePattern: "", sunExposure: "", dietPattern: [], lifestyleContext: [] },
  healthContext: { conditions: [], medications: [], familyHistory: [] },
  testHistory: {},
};

const STORAGE_KEY = ARC_SURVEY_STORAGE_KEY;

type SurveyCtx = {
  state: SurveyState;
  engineA: { anonId: string; sessionId: string | null };
  setEngineASessionId: (id: string | null) => void;
  setBasics: (v: SurveyBasics) => void;
  setLifestyle: (v: SurveyLifestyle) => void;
  setHealthContext: (v: SurveyHealthContext) => void;
  setTestHistory: (v: SurveyTestHistory) => void;
  markStepComplete: (step: number) => void;
  clearSurvey: () => void;
};

const Ctx = createContext<SurveyCtx>({
  state: EMPTY,
  engineA: { anonId: "unknown", sessionId: null },
  setEngineASessionId: () => {},
  setBasics: () => {},
  setLifestyle: () => {},
  setHealthContext: () => {},
  setTestHistory: () => {},
  markStepComplete: () => {},
  clearSurvey: () => {},
});

export function useSurvey() {
  return useContext(Ctx);
}

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SurveyState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [engineASessionId, setEngineASessionIdState] = useState<string | null>(null);
  const [anonId, setAnonId] = useState("unknown");

  // Synchronous setter so bootstrap (outside this layout) reliably finds the ID in localStorage.
  const setEngineASessionId = useCallback((id: string | null) => {
    setEngineASessionIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(ENGINE_A_STORAGE.sessionId, id);
      else localStorage.removeItem(ENGINE_A_STORAGE.sessionId);
    }
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    try {
      const a = getOrCreateAnonId();
      setAnonId(a);
      const sid = localStorage.getItem(ENGINE_A_STORAGE.sessionId);
      if (sid) setEngineASessionIdState(sid);
    } catch {}
    setHydrated(true);
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // If a session exists, hydrate questionnaire state from the server so resume works across devices.
  useEffect(() => {
    if (!hydrated) return;
    if (!engineASessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await apiGetQuestionnaireSessionState(engineASessionId);
        if (cancelled) return;
        const answers = r?.session?.answers ?? {};
        setState((s) => ({
          ...s,
          completedSteps: Array.from({ length: Math.max(0, (r.session.last_step_number ?? 1)) }, (_, i) => i + 1),
          basics: {
            ageRange: (answers["age_range"] as string) ?? s.basics.ageRange,
            lifeStage: (answers["life_stage"] as string) ?? s.basics.lifeStage,
            goals: (Array.isArray(answers["goals"]) ? (answers["goals"] as string[]) : s.basics.goals) ?? [],
          },
          lifestyle: {
            symptoms: Array.isArray(answers["symptoms"]) ? (answers["symptoms"] as string[]) : s.lifestyle.symptoms,
            cyclePattern: (answers["cycle_pattern"] as string) ?? s.lifestyle.cyclePattern,
            sunExposure: (answers["sun_exposure"] as string) ?? s.lifestyle.sunExposure,
            dietPattern: Array.isArray(answers["diet_pattern"]) ? (answers["diet_pattern"] as string[]) : s.lifestyle.dietPattern,
            lifestyleContext: Array.isArray(answers["lifestyle_context"]) ? (answers["lifestyle_context"] as string[]) : s.lifestyle.lifestyleContext,
          },
          healthContext: {
            conditions: Array.isArray(answers["known_conditions"]) ? (answers["known_conditions"] as string[]) : s.healthContext.conditions,
            medications: Array.isArray(answers["medications_or_hormones"]) ? (answers["medications_or_hormones"] as string[]) : s.healthContext.medications,
            familyHistory: Array.isArray(answers["family_history"]) ? (answers["family_history"] as string[]) : s.healthContext.familyHistory,
          },
          testHistory:
            answers["last_tests"] && typeof answers["last_tests"] === "object"
              ? (answers["last_tests"] as Partial<Record<TestKey, RecencyOption>>)
              : s.testHistory,
        }));
      } catch {
        // ignore — local-only state still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engineASessionId, hydrated]);

  const setBasics = useCallback((v: SurveyBasics) =>
    setState((s) => ({ ...s, basics: v })), []);

  const setLifestyle = useCallback((v: SurveyLifestyle) =>
    setState((s) => ({ ...s, lifestyle: v })), []);

  const setHealthContext = useCallback((v: SurveyHealthContext) =>
    setState((s) => ({ ...s, healthContext: v })), []);

  const setTestHistory = useCallback((v: SurveyTestHistory) =>
    setState((s) => ({ ...s, testHistory: v })), []);

  const markStepComplete = useCallback((step: number) =>
    setState((s) => ({
      ...s,
      completedSteps: s.completedSteps.includes(step)
        ? s.completedSteps
        : [...s.completedSteps, step],
    })), []);

  const clearSurvey = useCallback(() => {
    setState(EMPTY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ENGINE_A_STORAGE.sessionId);
    setEngineASessionId(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        state,
        engineA: { anonId, sessionId: engineASessionId },
        setEngineASessionId,
        setBasics,
        setLifestyle,
        setHealthContext,
        setTestHistory,
        markStepComplete,
        clearSurvey,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

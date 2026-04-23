"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  apiGetLatestProfile,
  apiGetLatestQuestionnaireSession,
  apiGetOnboardingStatus,
  apiStartRetake,
  ENGINE_A_STORAGE,
  getOrCreateAnonId,
} from "@/lib/profile-engine-a/frontendClient";

export function useAnonId() {
  return useMemo(() => (typeof window === "undefined" ? null : getOrCreateAnonId()), []);
}

export function useActiveProfile() {
  const { data: session, status } = useSession();
  const anonId = useAnonId();
  const [loading, setLoading] = useState(true);
  const [profileSnapshot, setProfileSnapshot] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Prefer new contract: /api/profile/latest (supports anon via header).
      const r = await apiGetLatestProfile();
      setProfileSnapshot(
        r?.profile
          ? {
              // normalize to snapshot-like shape used in UI
              userName:
                typeof r.profile.user_name === "string" && r.profile.user_name.startsWith("anon:")
                  ? "Anonymous"
                  : r.profile.user_name ?? (session?.user?.email ?? null),
              country: (r.profile.country as string | null) ?? "DE",
              ageGroup: r.profile.age_group ?? null,
              lifeStage: r.profile.life_stage ?? null,
              ageGroupLabel: r.profile.profile_summary?.age_group_label ?? null,
              lifeStageLabel: r.profile.profile_summary?.life_stage_label ?? null,
              goalFlags: r.profile.goal_flags ?? [],
              goalLabels: [],
              riskFlags: r.profile.risk_flags ?? [],
              conditionFlags: r.profile.condition_flags ?? [],
              medicationFlags: r.profile.medication_flags ?? [],
              familyHistoryFlags: r.profile.family_history_flags ?? [],
              lifestyleFlags: r.profile.lifestyle_flags ?? [],
              lastTests: r.profile.last_tests ?? {},
              profileSummary: {
                goals_label: r.profile.profile_summary?.goals_label ?? "",
                age_group_label: r.profile.profile_summary?.age_group_label ?? "",
                life_stage_label: r.profile.profile_summary?.life_stage_label ?? "",
              },
              profileCompletenessPercent: r.profile.profile_completeness_percent ?? 0,
              retakeState: r.profile.retake_state ?? null,
            }
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setProfileSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [anonId, session?.user?.email, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, profileSnapshot, error, reload };
}

export function useUserFlowResolver() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<{
    loading: boolean;
    hasActiveProfile: boolean;
    hasIncompleteQuestionnaire: boolean;
    lastStepNumber: number | null;
  }>({ loading: true, hasActiveProfile: false, hasIncompleteQuestionnaire: false, lastStepNumber: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (status === "loading") return;
        if (status !== "authenticated" || !session?.user?.email) {
          setState({ loading: false, hasActiveProfile: false, hasIncompleteQuestionnaire: false, lastStepNumber: null });
          return;
        }
        const [onboarding, latestProfile] = await Promise.allSettled([
          apiGetOnboardingStatus(),
          apiGetLatestProfile(),
        ]);
        if (cancelled) return;
        const o = onboarding.status === "fulfilled" ? onboarding.value : null;
        setState({
          loading: false,
          hasActiveProfile: Boolean(o?.has_completed_profile) || (latestProfile.status === "fulfilled" && Boolean(latestProfile.value?.profile)),
          hasIncompleteQuestionnaire: Boolean(o?.has_incomplete_session),
          lastStepNumber: null,
        });
      } catch {
        if (cancelled) return;
        setState({ loading: false, hasActiveProfile: false, hasIncompleteQuestionnaire: false, lastStepNumber: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, status]);

  return state;
}

export function useRetakeAssessment() {
  const startRetake = useCallback(async () => {
    const r = await apiStartRetake();
    const sessionId = r?.session_id ?? null;
    if (sessionId && typeof window !== "undefined") {
      window.localStorage.setItem(ENGINE_A_STORAGE.sessionId, sessionId);
    }
    return sessionId as string | null;
  }, []);

  return { startRetake };
}


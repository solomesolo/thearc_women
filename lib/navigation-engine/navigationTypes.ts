export type StepKey = "start" | "basics" | "lifestyle" | "health_context" | "test_history";

export type NavigationResolvedState =
  | "ANON_NEW"
  | "ANON_IN_PROGRESS"
  | "ANON_COMPLETED_SURVEY_UNREGISTERED"
  | "AUTH_REGISTERED_NO_SURVEY"
  | "AUTH_SURVEY_IN_PROGRESS"
  | "AUTH_SURVEY_COMPLETE_NO_PROFILE"
  | "AUTH_PROFILE_READY_NO_RECOMMENDATIONS"
  | "AUTH_PROFILE_READY_RESULTS_UNSEEN"
  | "AUTH_ACTIVE_DASHBOARD_READY"
  | "AUTH_RETAKE_IN_PROGRESS"
  | "AUTH_STALE_SESSION_NEEDS_RECOVERY"
  | "AUTH_ACCOUNT_EXISTS_SIGNIN_REQUIRED";

export type NavigationUiMode = "default" | "resume" | "guard" | "bootstrap";

export type NavigationDecision = {
  resolved_state: NavigationResolvedState;
  target_route: string;
  reason: string;
  blocking: boolean;
  ui_mode: NavigationUiMode;
  onboarding?: {
    status: "not_started" | "in_progress" | "completed";
    current_step: StepKey | null;
    is_retake: boolean;
  };
};

export type NavigationInputs = {
  auth: {
    isAuthenticated: boolean;
    userEmail: string | null;
    sessionValid: boolean;
  };
  onboarding: {
    hasStarted: boolean;
    status: "not_started" | "in_progress" | "completed";
    currentStep: StepKey | null;
    isRetake: boolean;
  };
  profile: { exists: boolean };
  recommendations: { exists: boolean; resultsSeenAt: string | null; dashboardReady: boolean };
  routeIntent: { requestedRoute: string | null; source: string | null };
};


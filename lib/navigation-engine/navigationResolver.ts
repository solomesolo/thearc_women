import type { NavigationDecision, NavigationInputs, NavigationResolvedState, NavigationUiMode } from "./navigationTypes";
import { routeForStep } from "./routeMapping";

function decision(
  resolved_state: NavigationResolvedState,
  target_route: string,
  reason: string,
  blocking: boolean,
  ui_mode: NavigationUiMode,
  input: NavigationInputs,
): NavigationDecision {
  return {
    resolved_state,
    target_route,
    reason,
    blocking,
    ui_mode,
    onboarding: {
      status: input.onboarding.status,
      current_step: input.onboarding.currentStep,
      is_retake: input.onboarding.isRetake,
    },
  };
}

function normalizeRequestedRoute(route: string | null): string | null {
  if (!route) return null;
  const r = route.trim();
  return r.length ? r : null;
}

function isAppRoute(route: string) {
  return route.startsWith("/app");
}
function isResultsRoute(route: string) {
  return route.startsWith("/results");
}
function isOnboardingRoute(route: string) {
  return route.startsWith("/onboarding");
}

export function resolveNavigation(input: NavigationInputs): NavigationDecision {
  const requestedRoute = normalizeRequestedRoute(input.routeIntent.requestedRoute);

  // Rule 1 — invalid auth session
  const authed = input.auth.sessionValid ? input.auth.isAuthenticated : false;

  // Retake handling (MVP): if flagged retake session in progress, always resume it.
  if (authed && input.onboarding.isRetake && input.onboarding.status === "in_progress") {
    return decision(
      "AUTH_RETAKE_IN_PROGRESS",
      routeForStep(input.onboarding.currentStep),
      "resume_retake",
      false,
      "resume",
      input,
    );
  }

  if (!authed) {
    if (!input.onboarding.hasStarted) {
      return decision("ANON_NEW", "/onboarding/start", "anonymous_new_user", false, "default", input);
    }
    if (input.onboarding.status === "in_progress") {
      return decision(
        "ANON_IN_PROGRESS",
        routeForStep(input.onboarding.currentStep),
        "resume_anonymous_onboarding",
        false,
        "resume",
        input,
      );
    }
    if (input.onboarding.status === "completed") {
      // Let completed anon users view their results without forcing registration first.
      if (input.recommendations.exists && requestedRoute) {
        if (requestedRoute === "/results/overview" || requestedRoute === "/results/action-plan") {
          return decision(
            "ANON_COMPLETED_SURVEY_UNREGISTERED",
            requestedRoute,
            "allow_anon_results_access",
            false,
            "default",
            input,
          );
        }
      }
      return decision(
        "ANON_COMPLETED_SURVEY_UNREGISTERED",
        "/auth/register",
        "survey_completed_needs_registration",
        false,
        "default",
        input,
      );
    }
  }

  if (authed) {
    if (!input.onboarding.hasStarted && !input.profile.exists) {
      return decision("AUTH_REGISTERED_NO_SURVEY", "/onboarding/start", "authenticated_no_onboarding", false, "default", input);
    }
    // Only block on in-progress if the profile hasn't been built yet.
    // If a profile already exists the questionnaire session may be stale "in_progress" in the DB
    // (e.g. bootstrap fast-pathed past buildProfile), so treat it as effectively completed.
    if (input.onboarding.status === "in_progress" && !input.profile.exists) {
      return decision(
        "AUTH_SURVEY_IN_PROGRESS",
        routeForStep(input.onboarding.currentStep),
        "resume_authenticated_onboarding",
        false,
        "resume",
        input,
      );
    }
    if (input.onboarding.status === "completed" && !input.profile.exists) {
      return decision(
        "AUTH_SURVEY_COMPLETE_NO_PROFILE",
        "/results/bootstrap",
        "build_profile_required",
        false,
        "bootstrap",
        input,
      );
    }
    if (input.profile.exists && !input.recommendations.exists) {
      // If the user explicitly requests dashboard or action-plan, let them through
      // so the page can show a loading/empty state while data regenerates in the background.
      // Only force bootstrap when there's no specific destination in mind.
      if (requestedRoute === "/app/dashboard" || requestedRoute === "/results/action-plan" || requestedRoute === "/results/overview") {
        return decision("AUTH_PROFILE_READY_NO_RECOMMENDATIONS", requestedRoute, "profile_exists_recs_pending", false, "default", input);
      }
      return decision(
        "AUTH_PROFILE_READY_NO_RECOMMENDATIONS",
        "/results/bootstrap",
        "build_recommendations_required",
        false,
        "bootstrap",
        input,
      );
    }
    if (input.recommendations.exists && !input.recommendations.resultsSeenAt) {
      return decision(
        "AUTH_PROFILE_READY_RESULTS_UNSEEN",
        "/results/overview",
        "first_results_view",
        false,
        "default",
        input,
      );
    }
    if (input.recommendations.exists && input.recommendations.resultsSeenAt && input.recommendations.dashboardReady) {
      // If user explicitly requested a results page, honor it instead of forcing dashboard.
      if (requestedRoute === "/results/action-plan") {
        return decision("AUTH_ACTIVE_DASHBOARD_READY", "/results/action-plan", "honor_requested_action_plan", false, "default", input);
      }
      if (requestedRoute === "/results/overview") {
        return decision("AUTH_ACTIVE_DASHBOARD_READY", "/results/overview", "honor_requested_results_overview", false, "default", input);
      }
      return decision(
        "AUTH_ACTIVE_DASHBOARD_READY",
        "/app/dashboard",
        "dashboard_ready",
        false,
        "default",
        input,
      );
    }
  }

  // Route guard rules (apply after base decision when route is explicitly requested)
  if (requestedRoute) {
    // If the user explicitly requests a safe route and prerequisites are met,
    // honor the intent even when the "default" target would be /app/dashboard.
    if (authed && requestedRoute === "/results/overview" && input.recommendations.exists) {
      return decision(
        input.recommendations.resultsSeenAt ? "AUTH_ACTIVE_DASHBOARD_READY" : "AUTH_PROFILE_READY_RESULTS_UNSEEN",
        "/results/overview",
        "honor_requested_results_overview",
        false,
        "default",
        input,
      );
    }
    if (authed && requestedRoute === "/results/action-plan" && input.recommendations.exists) {
      return decision(
        input.recommendations.resultsSeenAt ? "AUTH_ACTIVE_DASHBOARD_READY" : "AUTH_PROFILE_READY_RESULTS_UNSEEN",
        "/results/action-plan",
        "honor_requested_action_plan",
        false,
        "default",
        input,
      );
    }

    // Rule 18 — anonymous user hitting protected app routes
    if (!authed && isAppRoute(requestedRoute)) {
      return decision("ANON_NEW", "/onboarding/start", "guard_app_requires_auth", true, "guard", input);
    }
    // Rule 16 — results overview too early (only block if no profile exists yet)
    if (isResultsRoute(requestedRoute) && input.onboarding.status !== "completed" && !input.profile.exists) {
      return decision(
        authed ? "AUTH_SURVEY_IN_PROGRESS" : "ANON_IN_PROGRESS",
        routeForStep(input.onboarding.currentStep),
        "guard_results_requires_completed_onboarding",
        true,
        "guard",
        input,
      );
    }
    // Rule 15 — action plan too early
    if (requestedRoute === "/results/action-plan" && !input.recommendations.exists) {
      const next = input.profile.exists ? "/results/bootstrap" : routeForStep(input.onboarding.currentStep);
      return decision(
        input.profile.exists ? "AUTH_PROFILE_READY_NO_RECOMMENDATIONS" : "AUTH_SURVEY_IN_PROGRESS",
        next,
        "guard_action_plan_requires_recommendations",
        true,
        "guard",
        input,
      );
    }
    // Rule 14 — dashboard too early
    if (requestedRoute === "/app/dashboard" && !input.recommendations.exists) {
      const next =
        input.onboarding.status !== "completed"
          ? routeForStep(input.onboarding.currentStep)
          : input.profile.exists
            ? "/results/bootstrap"
            : "/onboarding/start";
      return decision(
        "AUTH_PROFILE_READY_NO_RECOMMENDATIONS",
        next,
        "guard_dashboard_requires_recommendations",
        true,
        "guard",
        input,
      );
    }
    // Rule 17 — authenticated user hitting /auth/register
    if (authed && requestedRoute === "/auth/register") {
      return decision("AUTH_ACTIVE_DASHBOARD_READY", "/app/dashboard", "guard_register_requires_anon", true, "guard", input);
    }
    // Allow onboarding routes to be handled by their own step guards elsewhere.
    if (isOnboardingRoute(requestedRoute)) {
      return decision(
        authed ? "AUTH_SURVEY_IN_PROGRESS" : "ANON_IN_PROGRESS",
        requestedRoute,
        "requested_onboarding_route",
        false,
        "default",
        input,
      );
    }
  }

  return decision("AUTH_STALE_SESSION_NEEDS_RECOVERY", "/onboarding/start", "fallback_recovery", true, "guard", input);
}


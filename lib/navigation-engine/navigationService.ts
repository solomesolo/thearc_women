import { prisma } from "@/lib/db";
import { resolveNavigation } from "./navigationResolver";
import type { NavigationDecision, NavigationInputs, StepKey } from "./navigationTypes";
import { stepFromQuestionnaireLastStepNumber } from "./routeMapping";

// ── Server-side navigation cache ────────────────────────────────────────────
// Stored in global so webpack HMR doesn't reset it between hot reloads.

declare global {
  // eslint-disable-next-line no-var
  var _navCache: Map<string, { decision: NavigationDecision; ts: number }> | undefined;
}

const NAV_CACHE: Map<string, { decision: NavigationDecision; ts: number }> =
  global._navCache ?? (global._navCache = new Map());
const NAV_SERVER_TTL_MS = 5 * 60 * 1000; // 5 min

function getCachedDecision(key: string): NavigationDecision | null {
  const entry = NAV_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > NAV_SERVER_TTL_MS) {
    NAV_CACHE.delete(key);
    return null;
  }
  return entry.decision;
}

function setCachedDecision(key: string, decision: NavigationDecision) {
  NAV_CACHE.set(key, { decision, ts: Date.now() });
  // Prune stale entries if cache grows large
  if (NAV_CACHE.size > 500) {
    const cutoff = Date.now() - NAV_SERVER_TTL_MS;
    for (const [k, v] of NAV_CACHE) {
      if (v.ts < cutoff) NAV_CACHE.delete(k);
    }
  }
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeUserEmail(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t ? t.toLowerCase() : null;
}

export async function getNavigationDecision(params: {
  userEmail: string | null;
  isAuthenticated: boolean;
  sessionValid: boolean;
  requestedRoute: string | null;
  source: string | null;
}): Promise<NavigationDecision> {
  const userEmail = normalizeUserEmail(params.userEmail);

  // Cache key includes route so a redirect-to-survey vs redirect-to-dashboard is distinct.
  const cacheKey = `${userEmail ?? "anon"}:${params.requestedRoute ?? "/"}`;
  const cached = getCachedDecision(cacheKey);
  if (cached) return cached;

  // Onboarding state uses existing Engine A questionnaire sessions for correctness.
  let onboardingStatus: "not_started" | "in_progress" | "completed" = "not_started";
  let hasStarted = false;
  let currentStep: StepKey | null = null;

  // Run all four independent DB lookups in parallel — saves ~150-300ms per request.
  const [latestSession, profileRow, recRow, resultState] = userEmail
    ? await Promise.all([
        prisma.questionnaireSession.findFirst({
          where: { userEmail },
          orderBy: { updatedAt: "desc" },
          select: { status: true, lastStepNumber: true },
        }),
        prisma.profileSnapshot.findFirst({
          where: { userEmail, isActive: true },
          select: { id: true },
        }),
        prisma.recommendationInstance.findFirst({
          where: { userEmail, active: true },
          select: { id: true },
        }),
        prisma.userResultState.findUnique({
          where: { userEmail },
          select: { resultsSeenAt: true, dashboardReady: true },
        }),
      ])
    : [null, null, null, null];

  if (latestSession) {
    hasStarted = true;
    if (latestSession.status === "completed") {
      onboardingStatus = "completed";
      currentStep = "test_history";
    } else {
      onboardingStatus = "in_progress";
      currentStep = stepFromQuestionnaireLastStepNumber(latestSession.lastStepNumber ?? 0);
    }
  }

  const profileExists = Boolean(profileRow);
  const recExists = Boolean(recRow);

  const inputs: NavigationInputs = {
    auth: { isAuthenticated: params.isAuthenticated, userEmail, sessionValid: params.sessionValid },
    onboarding: { hasStarted, status: onboardingStatus, currentStep, isRetake: false },
    profile: { exists: profileExists },
    recommendations: {
      exists: recExists,
      resultsSeenAt: resultState?.resultsSeenAt ? resultState.resultsSeenAt.toISOString() : null,
      dashboardReady: resultState?.dashboardReady ?? (recExists && Boolean(resultState?.resultsSeenAt)),
    },
    routeIntent: { requestedRoute: params.requestedRoute, source: params.source },
  };

  const decision = resolveNavigation(inputs);

  // Cache the decision server-side so subsequent page loads are instant.
  setCachedDecision(cacheKey, decision);

  // Fire-and-forget log — do NOT await, this must never block the response.
  if (userEmail) {
    prisma.navigationEvent
      .create({
        data: {
          userEmail,
          sourceRoute: params.source ?? null,
          requestedRoute: params.requestedRoute ?? null,
          resolvedState: decision.resolved_state,
          targetRoute: decision.target_route,
          reason: decision.reason,
          isBlocking: decision.blocking,
          uiMode: decision.ui_mode,
          metadata: { at: nowIso() } as any,
        },
      })
      .catch(() => {});
  }

  return decision;
}

export function clearNavServerCacheForUser(userEmail: string): void {
  const prefix = userEmail.toLowerCase().trim() + ":";
  for (const key of NAV_CACHE.keys()) {
    if (key.startsWith(prefix)) NAV_CACHE.delete(key);
  }
}

export async function markResultsSeen(params: { userEmail: string }): Promise<void> {
  const userEmail = normalizeUserEmail(params.userEmail);
  if (!userEmail) return;
  await prisma.userResultState.upsert({
    where: { userEmail },
    create: { userEmail, resultsSeenAt: new Date(), dashboardReady: true },
    update: { resultsSeenAt: new Date(), dashboardReady: true, updatedAt: new Date() },
  });
}


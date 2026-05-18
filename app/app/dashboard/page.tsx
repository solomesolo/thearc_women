"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRecommendations } from "@/lib/recommendations/useRecommendations";
import { getOrCreateAnonId } from "@/lib/profile-engine-a/frontendClient";
import { ProtectedRouteGate } from "@/components/navigation/ProtectedRouteGate";
import { useLocale } from "@/lib/i18n/useLocale";
import { loadWalletHistory, type BiomarkerWalletEntry } from "@/components/app/BiomarkerActionRow";
import { buildDomains } from "@/lib/health-map/domainEngine";
import type {
  WomensHealthDomainId,
  TrendItem,
  WomensHealthDomain,
  TrendDirection,
} from "@/lib/health-map/domainEngine";
import { WomensHealthMap } from "@/components/app/WomensHealthMap";
import { DomainDetailPanel } from "@/components/app/DomainDetailPanel";
import { PersonalSpotCard } from "@/components/app/PersonalSpotCard";
import { TrendsSection } from "@/components/app/TrendsSection";

const UploadResultsModal = dynamic(
  () => import("@/components/app/UploadResultsModal").then((m) => ({ default: m.UploadResultsModal })),
  { ssr: false },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isThisWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function trendDirection(entries: BiomarkerWalletEntry[]): TrendDirection {
  if (entries.length < 2) return "not_enough_data";
  const sorted = [...entries].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  const a = sorted[sorted.length - 2].numericValue;
  const b = sorted[sorted.length - 1].numericValue;
  if (a === null || b === null) return "not_enough_data";
  const diff = b - a;
  if (Math.abs(diff) < 0.01) return "stable";
  return diff > 0 ? "up" : "down";
}

function trendSummary(direction: TrendDirection, isDE: boolean): string {
  if (isDE) {
    if (direction === "up") return "Der letzte Wert ist höher als die vorherige Messung.";
    if (direction === "down") return "Der letzte Wert ist niedriger als die vorherige Messung.";
    if (direction === "stable") return "Der Wert ist stabil geblieben.";
    return "Fügen Sie ein weiteres Ergebnis hinzu, um einen Trend zu sehen.";
  }
  if (direction === "up") return "Latest value is higher than the previous reading.";
  if (direction === "down") return "Latest value is lower than the previous reading.";
  if (direction === "stable") return "Value has remained stable.";
  return "Add another result to see a trend.";
}

function computeTrends(domains: WomensHealthDomain[], isDE: boolean): TrendItem[] {
  if (typeof window === "undefined") return [];

  const results: Array<TrendItem & { _savedAt: string }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("arc_bm_wallet_")) continue;

      const biomarkerKey = key.slice("arc_bm_wallet_".length);
      const entries = loadWalletHistory(biomarkerKey);
      if (entries.length < 2) continue;

      const sorted = [...entries].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
      const latest = sorted[sorted.length - 1];
      const direction = trendDirection(entries);

      // Derive display name from key (replace underscores with spaces, title-case)
      const displayName = biomarkerKey
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      // Find which domain this biomarker belongs to via supportingItems
      let domainId: WomensHealthDomainId = "metabolic";
      for (const domain of domains) {
        const found =
          domain.supportingItems.some(
            (si) =>
              si.id === biomarkerKey ||
              si.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") ===
                biomarkerKey,
          ) ||
          domain.attentionItems.some(
            (ai) =>
              ai.id === biomarkerKey ||
              ai.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") ===
                biomarkerKey,
          );
        if (found) {
          domainId = domain.id;
          break;
        }
      }

      results.push({
        id: biomarkerKey,
        domainId,
        name: displayName,
        latestValue: latest.value || undefined,
        trend: direction,
        summary: trendSummary(direction, isDE),
        _savedAt: latest.savedAt,
      });
    }
  } catch {
    // localStorage not available or parse error
  }

  // Sort by recency and return top 3
  results.sort((a, b) => b._savedAt.localeCompare(a._savedAt));

  return results.slice(0, 3).map(({ _savedAt: _unused, ...item }) => item);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-28 rounded-[20px] bg-[#f0f0ef]" />
      <div className="h-10 w-48 rounded-[12px] bg-[#f0f0ef]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 rounded-[20px] bg-[#f0f0ef]" />
        ))}
      </div>
      <div className="h-10 w-48 rounded-[12px] bg-[#f0f0ef]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-[14px] bg-[#f0f0ef]" />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const isDE = locale === "de";

  const userId =
    session?.user?.email ??
    (typeof window !== "undefined" ? `anon:${getOrCreateAnonId()}` : null);

  const { data: recs, isLoading: recsLoading } = useRecommendations(userId);

  const [selectedDomainId, setSelectedDomainId] = useState<WomensHealthDomainId | undefined>(
    undefined,
  );
  const [domains, setDomains] = useState<WomensHealthDomain[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Build domains from recommendations + wallet
  useEffect(() => {
    const allChecks = recs
      ? [
          ...(recs.pathway.next_month ?? []),
          ...(recs.pathway.next_3_months ?? []),
          ...(recs.pathway.next_6_months ?? []),
          ...(recs.pathway.next_year ?? []),
          ...(recs.pathway.optional_later ?? []),
        ]
      : [];

    const built = buildDomains(allChecks, isDE, loadWalletHistory);
    setDomains(built);

    if (!selectedDomainId && built.length > 0) {
      setSelectedDomainId(built[0].id);
    }

    const computedTrends = computeTrends(built, isDE);
    setTrends(computedTrends);
  }, [recs, isDE]); // eslint-disable-line react-hooks/exhaustive-deps

  // This-week counts
  const allChecks = recs
    ? [
        ...(recs.pathway.next_month ?? []),
        ...(recs.pathway.next_3_months ?? []),
        ...(recs.pathway.next_6_months ?? []),
        ...(recs.pathway.next_year ?? []),
        ...(recs.pathway.optional_later ?? []),
      ]
    : [];

  const plannedScreeningsThisWeek = allChecks.filter(
    (c) =>
      c.isScreening &&
      (isThisWeek(c.plannedAt) || isThisWeek(c.reminder?.remindAt)),
  ).length;

  const plannedLabTestsThisWeek = allChecks.filter(
    (c) =>
      !c.isScreening &&
      (isThisWeek(c.plannedAt) || isThisWeek(c.reminder?.remindAt)),
  ).length;

  const attentionCount = domains.filter(
    (d) => d.status === "needs_attention" || d.status === "watch",
  ).length;

  const firstName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    null;

  const selectedDomain = domains.find((d) => d.id === selectedDomainId);
  const nextBestAction = recs?.summary.nextBestAction ?? null;

  return (
    <ProtectedRouteGate
      requestedRoute="/app/dashboard"
      allowStates={[
        "AUTH_ACTIVE_DASHBOARD_READY",
        "AUTH_PROFILE_READY_RESULTS_UNSEEN",
        "AUTH_PROFILE_READY_NO_RECOMMENDATIONS",
      ]}
      loadingText={isDE ? "Dashboard wird geladen…" : "Loading your dashboard…"}
    >
      <div className="mx-auto max-w-[72rem] px-5 py-8 md:px-8">

        {/* Header row */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[1.75rem]">
            {isDE ? "Dashboard" : "Dashboard"}
          </h1>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
          >
            {isDE ? "Gesundheitsakte hinzufügen" : "Add health record"}
          </button>
        </div>

        {recsLoading && !recs ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Personal Spot */}
            <div className="mb-6">
              <PersonalSpotCard
                firstName={firstName}
                plannedScreeningsThisWeek={plannedScreeningsThisWeek}
                plannedLabTestsThisWeek={plannedLabTestsThisWeek}
                attentionCount={attentionCount}
                isDE={isDE}
              />
            </div>

            {/* Health Map */}
            <div className="mb-5">
              <h2 className="mb-3 text-[1.0625rem] font-semibold text-[#0c0c0c]">
                {isDE ? "Ihre Gesundheitskarte" : "Your Health Map"}
              </h2>
              <WomensHealthMap
                domains={domains}
                selectedDomainId={selectedDomainId}
                onSelectDomain={(id) => {
                  setSelectedDomainId((prev) => (prev === id ? undefined : id));
                }}
                isDE={isDE}
              />
            </div>

            {/* Domain detail panel */}
            {selectedDomain && (
              <div className="mb-6 mt-5">
                <DomainDetailPanel
                  domain={selectedDomain}
                  isDE={isDE}
                  onClose={() => setSelectedDomainId(undefined)}
                />
              </div>
            )}

            {/* Trends */}
            <div className="mb-6">
              <h2 className="mb-3 text-[1.0625rem] font-semibold text-[#0c0c0c]">
                {isDE ? "Trends in Ihren Daten" : "Trends in your data"}
              </h2>
              <TrendsSection trends={trends} isDE={isDE} />
            </div>

            {/* Next Best Action card */}
            {nextBestAction && (
              <div className="rounded-[20px] bg-[#0c0c0c] p-5 text-white">
                <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {isDE ? "NÄCHSTER SCHRITT" : "NEXT BEST ACTION"}
                </p>
                <p className="text-[1.0625rem] font-semibold">{nextBestAction.checkName}</p>
                {nextBestAction.why && (
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-white/70 line-clamp-2">
                    {nextBestAction.why}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/results/action-plan"
                    className="rounded-[12px] bg-white px-4 py-2.5 text-[0.875rem] font-medium text-[#0c0c0c] transition-[filter] hover:brightness-[0.92]"
                  >
                    {isDE ? "Aktionsplan öffnen" : "Open action plan"}
                  </Link>
                  <Link
                    href="/results/overview"
                    className="rounded-[12px] border border-white/[0.18] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:border-white/[0.4]"
                  >
                    {isDE ? "Übersicht ansehen" : "View overview"}
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <UploadResultsModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        locale={isDE ? "de" : "en"}
        onSynced={() => {
          // Wallet state will refresh on next recs load
        }}
      />
    </ProtectedRouteGate>
  );
}

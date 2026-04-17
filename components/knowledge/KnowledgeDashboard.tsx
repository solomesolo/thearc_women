"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { KnowledgeDashboardData } from "@/lib/knowledge/types";
import { RecentlyViewedRow } from "./RecentlyViewedRow";
import { SavedArticlesSection } from "./SavedArticlesSection";
import { CollectionsGrid } from "./CollectionsGrid";

const LOGIN_KNOWLEDGE = "/login?callbackUrl=/knowledge";

type HealthDataSummary = {
  observationsCount: number;
  imagingCount: number;
  lastObservationDate: string | null;
  recentUploads: {
    documentId: string;
    fileName: string;
    mimeType: string;
    uploadedAt: string;
    processingStatus: string;
    documentType: string | null;
    documentTypeConfidence: number | null;
  }[];
};

type HealthOverview = {
  healthScore: number;
  lastUpdatedDate: string | null;
  keyAlerts: {
    label: string;
    metric: string | null;
    flag: string | null;
    value: number | null;
    unit: string | null;
    referenceRange: string | null;
    date: string | null;
    category: string;
  }[];
  recentActivity: {
    documentId: string;
    fileName: string;
    uploadedAt: string;
    processingStatus: string;
    documentType: string | null;
  }[];
};

type HealthAreaCard = {
  key: string;
  title: string;
  status: "Good" | "Needs attention" | "Unknown";
  lastTestDate: string | null;
  keyMetric:
    | { name: string | null; value: number | null; unit: string | null; flag: string | null }
    | null;
};

function pill(status: HealthAreaCard["status"]) {
  if (status === "Needs attention") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Good") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-black/[0.12] bg-white text-black/40";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function HealthOverviewSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [overview, setOverview] = useState<HealthOverview | null>(null);
  const [areas, setAreas] = useState<HealthAreaCard[] | null>(null);
  const [tab, setTab] = useState<"labs" | "imaging" | "tracking" | "trends">("labs");
  const [summary, setSummary] = useState<HealthDataSummary | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const [oRes, aRes, sRes] = await Promise.all([
          fetch("/api/health-data/overview?alerts=3&uploads=5"),
          fetch("/api/health-data/areas"),
          fetch("/api/health-data/summary?limit=5"),
        ]);
        if (oRes.ok) {
          const json: HealthOverview = await oRes.json();
          if (!cancelled) setOverview(json);
        }
        if (aRes.ok) {
          const json: { areas: HealthAreaCard[] } = await aRes.json();
          if (!cancelled) setAreas(json.areas);
        }
        if (sRes.ok) {
          const json: HealthDataSummary = await sRes.json();
          if (!cancelled) setSummary(json);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const last = fmtDate(overview?.lastUpdatedDate ?? summary?.lastObservationDate ?? null);

  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-2">
            Health overview
          </p>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Quick answer: “Am I okay?”
          </p>
        </div>
        <Link
          href="/upload/files"
          className="shrink-0 rounded-[12px] bg-black/90 px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity no-underline"
        >
          + Upload
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-[16px] border border-black/[0.07] bg-[var(--background)] px-4 py-4">
          <p className="text-[11px] text-black/40">Health score</p>
          <p className="mt-1 text-[18px] font-semibold text-[var(--text-primary)]">
            {overview ? String(overview.healthScore) : "—"}
          </p>
        </div>
        <div className="rounded-[16px] border border-black/[0.07] bg-[var(--background)] px-4 py-4 md:col-span-2">
          <p className="text-[11px] text-black/40">Key alerts</p>
          {overview?.keyAlerts?.length ? (
            <ul className="mt-2 space-y-1.5">
              {overview.keyAlerts.slice(0, 3).map((a, i) => (
                <li key={i} className="text-[13px] text-[var(--text-primary)]">
                  <span className="font-medium">{a.label}</span>
                  {a.value != null ? (
                    <span className="text-black/45">
                      {" "}
                      — {a.value}
                      {a.unit ? ` ${a.unit}` : ""}
                      {a.referenceRange ? ` (range ${a.referenceRange})` : ""}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-black/45">
              {overview ? "No flagged results found." : "—"}
            </p>
          )}
        </div>
        <div className="rounded-[16px] border border-black/[0.07] bg-[var(--background)] px-4 py-4">
          <p className="text-[11px] text-black/40">Last updated</p>
          <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
            {last}
          </p>
          <p className="mt-2 text-[11px] text-black/40">Recent activity</p>
          <p className="mt-1 text-[12px] text-black/60">
            {overview?.recentActivity?.[0]?.fileName ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-3">
          Health areas
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(areas ?? []).map((a) => (
            <Link
              key={a.key}
              href={
                a.key === "general_metabolic" ? "/health-data/observations?category=metabolic,lipids,thyroid,iron,vitamins,inflammation,haematology,other" :
                a.key === "cardiovascular" ? "/health-data/observations?category=cardiac,lipids" :
                a.key === "gynecology_reproductive" ? "/health-data/observations?category=hormones" :
                a.key === "musculoskeletal" ? "/health-data/observations?category=musculoskeletal" :
                a.key === "oncology" ? "/health-data/observations?category=oncology" :
                a.key === "mental_health" ? "/health-data/observations?category=mental_health" :
                a.key === "respiratory" ? "/health-data/observations?category=respiratory" :
                "/health-data/observations?category=gastroenterology"
              }
              className="block rounded-[18px] border border-black/[0.07] bg-white p-4 no-underline hover:border-black/[0.14] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{a.title}</p>
                <span className={["shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold", pill(a.status)].join(" ")}>
                  {a.status}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-black/45">
                Last test: {fmtDate(a.lastTestDate)}
              </p>
              <p className="mt-1 text-[12px] text-black/60">
                {a.keyMetric?.name ? (
                  <>
                    {a.keyMetric.name}
                    {a.keyMetric.value != null ? ` · ${a.keyMetric.value}${a.keyMetric.unit ? ` ${a.keyMetric.unit}` : ""}` : ""}
                  </>
                ) : "Key metric: —"}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-3">
          Health data
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "labs", label: "Labs & results" },
            { id: "imaging", label: "Imaging" },
            { id: "tracking", label: "Vitals / tracking" },
            { id: "trends", label: "Trends" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={[
                "h-9 rounded-[12px] border px-4 text-[13px] font-medium transition-colors",
                tab === t.id ? "border-black/20 bg-black/[0.04] text-[var(--text-primary)]" : "border-black/[0.1] bg-white text-black/60 hover:bg-black/[0.02]",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[18px] border border-black/[0.07] bg-[var(--background)] p-4">
          {tab === "labs" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Labs & results</p>
                <p className="mt-1 text-[13px] text-black/60">Browse extracted biomarkers and reference ranges.</p>
              </div>
              <Link href="/health-data/observations" className="text-[13px] font-medium text-[var(--text-primary)] hover:underline">
                Open →
              </Link>
            </div>
          )}
          {tab === "imaging" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Imaging</p>
                <p className="mt-1 text-[13px] text-black/60">Findings, impressions, and recommendations.</p>
              </div>
              <Link href="/health-data/imaging" className="text-[13px] font-medium text-[var(--text-primary)] hover:underline">
                Open →
              </Link>
            </div>
          )}
          {tab === "tracking" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Vitals / tracking</p>
                <p className="mt-1 text-[13px] text-black/60">Coming next: manual tracking + device import.</p>
              </div>
              <span className="text-[12px] text-black/40">Soon</span>
            </div>
          )}
          {tab === "trends" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Trends</p>
                <p className="mt-1 text-[13px] text-black/60">See how values change over time.</p>
              </div>
              <Link href="/health-data/trends" className="text-[13px] font-medium text-[var(--text-primary)] hover:underline">
                Open →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function KnowledgeDashboard({ data }: { data: KnowledgeDashboardData }) {
  const [saved, setSaved] = useState(data.saved);
  const { isLoggedIn } = data;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {!isLoggedIn && (
        <div className="mb-8 rounded-[16px] border border-black/[0.08] bg-[#fdf8f5] px-5 py-4 md:px-6 md:py-5">
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Browse freely here. To save articles from the Knowledge Base, build collections, and see reading history across devices, sign in or create an account.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={LOGIN_KNOWLEDGE}
              className="inline-flex items-center justify-center rounded-[12px] bg-black/90 px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
            <Link
              href={LOGIN_KNOWLEDGE}
              className="inline-flex items-center justify-center rounded-[12px] border border-black/[0.12] bg-white px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:border-black/[0.2] transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="border-b border-black/[0.07] pb-6 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              My Health Dashboard
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              {isLoggedIn
                ? "Your saved articles, collections, and reading history"
                : "Save articles while reading — they appear here after you sign in"}
            </p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-[14px] border border-black/[0.09] bg-white px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:border-black/[0.16] transition-colors"
          >
            <span aria-hidden>🔍</span>
            Search Knowledge Base
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/health-data/observations", label: "My Data" },
            { href: "/knowledge", label: "Insights" },
            { href: "/plan", label: "Health Plan" },
          ].map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>

      {/* A. Top Section: Health Overview */}
      {isLoggedIn && (
        <div className="mb-8">
          <HealthOverviewSection isLoggedIn={isLoggedIn} />
        </div>
      )}

      {/* Main layout: Data + Action panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Knowledge & Insights */}
          <section>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-4">
              Knowledge & insights
            </h2>
            {isLoggedIn && data.recentlyViewed.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-3">
                  Recently viewed
                </p>
                <RecentlyViewedRow articles={data.recentlyViewed} />
              </div>
            )}
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-3">
                Saved articles
              </p>
              <SavedArticlesSection
                isLoggedIn={isLoggedIn}
                saved={saved}
                onUnsave={(articleId) =>
                  setSaved((prev) => prev.filter((s) => s.articleId !== articleId))
                }
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-3">
                Collections
              </p>
              <CollectionsGrid isLoggedIn={isLoggedIn} initialCollections={data.collections} />
            </div>
          </section>
        </div>

        {/* E. Right panel: Action Panel */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-[20px] border border-black/[0.07] bg-[#fdf8f5] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-4">
              Action panel
            </p>
            <div className="space-y-2">
              <Link
                href="/upload/files"
                className="block rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-[13px] font-medium text-[var(--text-primary)] no-underline hover:border-black/[0.16] transition-colors"
              >
                Upload new data →
              </Link>
              <Link
                href="/plan"
                className="block rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-[13px] font-medium text-[var(--text-primary)] no-underline hover:border-black/[0.16] transition-colors"
              >
                Continue health plan →
              </Link>
              <Link
                href="/health-data/observations"
                className="block rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-[13px] font-medium text-[var(--text-primary)] no-underline hover:border-black/[0.16] transition-colors"
              >
                Review my data →
              </Link>
            </div>
          </div>

          {isLoggedIn && data.unreadNotifications > 0 && (
            <Link
              href="/notifications"
              className="flex items-center justify-between rounded-[16px] border border-[#e8ddd6] bg-white px-5 py-4 hover:border-black/[0.14] transition-colors"
            >
              <span className="text-[13px] text-[var(--text-primary)]">
                {data.unreadNotifications} new notification{data.unreadNotifications !== 1 ? "s" : ""}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">
                {data.unreadNotifications}
              </span>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

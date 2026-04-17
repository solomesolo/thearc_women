"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

// ── Types ─────────────────────────────────────────────────────────────────────

type DataPoint = {
  date:      string;
  value:     number | null;
  valueText: string | null;
  flag:      string | null;
  documentId: string;
};

type Series = {
  metric:         string;
  label:          string;
  category:       string;
  bin:            string;
  unit:           string | null;
  referenceRange: string | null;
  points:         DataPoint[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function flagColor(flag: string | null) {
  if (!flag) return "#0c0c0c";
  const u = flag.toUpperCase();
  if (u === "H" || u === "HH" || u === "CRITICAL") return "#dc2626";
  if (u === "L" || u === "LL") return "#d97706";
  return "#0c0c0c";
}

/** Very simple inline sparkline SVG — no external chart library needed */
function Sparkline({
  points,
  referenceRange,
  unit,
}: {
  points:         DataPoint[];
  referenceRange: string | null;
  unit:           string | null;
}) {
  const numeric = points.filter((p) => p.value != null) as (DataPoint & { value: number })[];
  if (numeric.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center">
        <p className="text-[11px] text-black/30">Need ≥ 2 data points for trend</p>
      </div>
    );
  }

  const W = 320;
  const H = 80;
  const PAD = 8;

  const values = numeric.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => PAD + (i / (numeric.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);

  const path = numeric.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  // Parse reference range e.g. "70–100" or "70-100"
  let refY1: number | null = null;
  let refY2: number | null = null;
  if (referenceRange) {
    const parts = referenceRange.split(/[–\-–]/);
    if (parts.length === 2) {
      const lo = parseFloat(parts[0].replace(/[^0-9.]/g, ""));
      const hi = parseFloat(parts[1].replace(/[^0-9.]/g, ""));
      if (!isNaN(lo) && !isNaN(hi)) {
        const clampedLo = Math.max(min, Math.min(max, lo));
        const clampedHi = Math.max(min, Math.min(max, hi));
        refY1 = y(clampedHi);
        refY2 = y(clampedLo);
      }
    }
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        {/* Reference range band */}
        {refY1 != null && refY2 != null && (
          <rect
            x={PAD}
            y={refY1}
            width={W - PAD * 2}
            height={Math.abs(refY2 - refY1)}
            fill="rgba(16,185,129,0.07)"
          />
        )}
        {/* Line */}
        <path d={path} fill="none" stroke="#0c0c0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {numeric.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r="3"
            fill={flagColor(p.flag)}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>
      {/* Axis labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-black/30">{numeric[0].date.slice(0, 7)}</span>
        <span className="text-[10px] text-black/30">{numeric[numeric.length - 1].date.slice(0, 7)}</span>
      </div>
    </div>
  );
}

// ── Metric card ────────────────────────────────────────────────────────────────

function MetricCard({ series }: { series: Series }) {
  const numeric = series.points.filter((p) => p.value != null) as (DataPoint & { value: number })[];
  const latest = numeric[numeric.length - 1];
  const prev   = numeric.length >= 2 ? numeric[numeric.length - 2] : null;

  const trend = prev && latest
    ? latest.value > prev.value ? "↑" : latest.value < prev.value ? "↓" : "→"
    : null;

  return (
    <div className="rounded-[18px] border border-black/[0.07] bg-white overflow-hidden">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-black/35">
              {fmt(series.category)}
            </p>
            <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
              {series.label}
            </p>
          </div>
          {latest && (
            <div className="text-right shrink-0">
              <p className={["text-[17px] font-semibold tabular-nums", latest.flag ? "text-red-600" : ""].join(" ")}>
                {latest.value.toLocaleString()}
                {series.unit && (
                  <span className="ml-1 text-[12px] font-normal text-black/40">{series.unit}</span>
                )}
              </p>
              {trend && (
                <span className="text-[12px] text-black/40">{trend} {prev ? Math.abs(latest.value - prev.value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : ""}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 px-5">
        <Sparkline points={series.points} referenceRange={series.referenceRange} unit={series.unit} />
      </div>

      {series.referenceRange && (
        <div className="border-t border-black/[0.05] px-5 py-2.5">
          <p className="text-[11px] text-black/35">
            Reference range: {series.referenceRange}
            {series.unit ? ` ${series.unit}` : ""}
          </p>
        </div>
      )}

      {/* All data points */}
      <div className="border-t border-black/[0.05] px-5 py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {series.points.slice().reverse().map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[11px] text-black/35">{p.date.slice(0, 7)}</span>
              <span className={["text-[12px] font-medium tabular-nums", p.flag ? "text-red-600" : "text-[var(--text-primary)]"].join(" ")}>
                {p.value != null ? p.value : p.valueText ?? "—"}
              </span>
              {p.flag && <span className="text-[10px] text-red-400">{p.flag}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "haematology", "metabolic", "lipids", "thyroid", "iron",
  "vitamins", "inflammation", "cardiac", "hormones",
];

export default function TrendsPage() {
  const [data, setData] = useState<{ series: Series[]; totalMetrics: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  const fetchData = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ minPoints: "2" });
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/health-data/trends?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(category);
  }, [category, fetchData]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Container className="py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Health Data
            </p>
            <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Trends
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
              How your values change over time across all your documents.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/health-data/observations"
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              All observations
            </Link>
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={[
                "rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
                category === ""
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                  : "border-black/[0.1] bg-white text-[var(--text-secondary)] hover:border-black/[0.2]",
              ].join(" ")}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={[
                  "rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
                  category === cat
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-black/[0.1] bg-white text-[var(--text-secondary)] hover:border-black/[0.2]",
                ].join(" ")}
              >
                {fmt(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
              <span className="text-[14px] text-[var(--text-secondary)]">Loading trends…</span>
            </div>
          ) : !data?.series.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-3xl">📈</span>
              <p className="mt-4 text-[15px] font-medium text-[var(--text-primary)]">
                {category ? "No trends in this category" : "No trends yet"}
              </p>
              <p className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-xs">
                Trends appear once a metric has been recorded on two or more dates. Upload more documents to see how your values change over time.
              </p>
              <Link
                href="/upload"
                className="mt-6 inline-flex h-10 items-center rounded-[12px] bg-[var(--foreground)] px-5 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity no-underline"
              >
                Upload health data
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-[12px] text-black/35">
                {data.series.length} metric{data.series.length !== 1 ? "s" : ""} with trend data
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.series.map((series) => (
                  <MetricCard key={series.metric} series={series} />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

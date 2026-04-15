"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

// ── Types ─────────────────────────────────────────────────────────────────────

type Observation = {
  observationId:       string;
  documentId:          string;
  bin:                 string;
  observationDate:     string | null;
  metricName:          string | null;
  canonicalMetricName: string | null;
  displayName:         string | null;
  category:            string;
  valueText:           string | null;
  numericValue:        number | null;
  unit:                string | null;
  referenceRange:      string | null;
  flag:                string | null;
  sensitivityLevel:    string;
  conversionApplied:   boolean;
};

type Pagination = {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "haematology", "metabolic", "lipids", "thyroid", "iron",
  "vitamins", "inflammation", "cardiac", "hormones", "oncology",
  "imaging_score", "mental_health", "other",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function flagColor(flag: string | null) {
  if (!flag) return "text-[var(--text-secondary)]";
  const u = flag.toUpperCase();
  if (u === "H" || u === "HH" || u === "CRITICAL" || u === "PANIC") return "text-red-600 font-semibold";
  if (u === "L" || u === "LL") return "text-amber-600 font-semibold";
  return "text-[var(--text-secondary)]";
}

function parseRange(range: string): { low?: number; high?: number } | null {
  const r = range.trim();
  // "4.0-10.0" or "4.0 - 10.0"
  const m = r.match(/^\s*(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m) return { low: Number(m[1]), high: Number(m[2]) };
  // "<150" / "<= 150"
  const m2 = r.match(/^\s*(<=|<)\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m2) return { high: Number(m2[2]) };
  // ">45" / ">= 45"
  const m3 = r.match(/^\s*(>=|>)\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m3) return { low: Number(m3[2]) };
  return null;
}

function rangeStatus(obs: Observation): { label: string; tone: "ok" | "high" | "low" | "unknown" } {
  const v = obs.numericValue;
  if (v == null) return { label: "—", tone: "unknown" };

  const flag = obs.flag?.toUpperCase() ?? null;
  if (flag === "H" || flag === "HH" || flag === "CRITICAL" || flag === "PANIC") return { label: "High", tone: "high" };
  if (flag === "L" || flag === "LL") return { label: "Low", tone: "low" };

  if (!obs.referenceRange) return { label: "—", tone: "unknown" };
  const pr = parseRange(obs.referenceRange);
  if (!pr) return { label: "—", tone: "unknown" };

  if (typeof pr.low === "number" && v < pr.low) return { label: "Low", tone: "low" };
  if (typeof pr.high === "number" && v > pr.high) return { label: "High", tone: "high" };
  return { label: "In range", tone: "ok" };
}

function RangePill({ obs }: { obs: Observation }) {
  const s = rangeStatus(obs);
  const cls =
    s.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : s.tone === "high"
      ? "border-red-200 bg-red-50 text-red-700"
      : s.tone === "low"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-black/[0.12] bg-white text-black/40";

  return (
    <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls].join(" ")}>
      <span
        className={[
          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
          s.tone === "ok" ? "bg-emerald-500" : s.tone === "high" ? "bg-red-500" : s.tone === "low" ? "bg-amber-500" : "bg-black/20",
        ].join(" ")}
      />
      {s.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ObservationsPage() {
  const [data, setData] = useState<{ observations: Observation[]; pagination: Pagination } | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [flagOnly, setFlagOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, true>>({});
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (cat: string, flagged: boolean, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), pageSize: "50" });
      if (cat) params.set("category", cat);
      if (flagged) params.set("flag", "H,L,HH,LL,CRITICAL,PANIC");

      const res = await fetch(`/api/health-data/observations?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(category, flagOnly, page);
  }, [category, flagOnly, page, fetchData]);

  // Clear selection when the visible dataset changes (filters/pagination)
  useEffect(() => {
    setSelected({});
  }, [category, flagOnly, page]);

  const filtered = data?.observations.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (o.displayName ?? o.metricName ?? "").toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q)
    );
  }) ?? [];

  const total = data?.pagination.total ?? 0;
  const selectedIds = Object.keys(selected);
  const selectedCount = selectedIds.length;

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
              Observations
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
              Every measured value across all your uploaded documents.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/health-data/trends"
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              Trends
            </Link>
            <Link
              href="/health-data/imaging"
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              Imaging
            </Link>
            <Link
              href="/health-data/clinical-notes"
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              Clinical Notes
            </Link>
            <Link
              href="/upload/files"
              className="rounded-[12px] bg-[var(--foreground)] px-4 py-2 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity no-underline"
            >
              + Upload
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search test name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-[10px] border border-black/[0.1] bg-white px-3 text-[13px] text-[var(--text-primary)] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 w-48"
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="h-9 rounded-[10px] border border-black/[0.1] bg-white px-3 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{fmt(c)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setFlagOnly((v) => !v); setPage(1); }}
            className={[
              "h-9 rounded-[10px] border px-4 text-[13px] font-medium transition-colors",
              flagOnly
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-black/[0.1] bg-white text-[var(--text-primary)] hover:bg-black/[0.03]",
            ].join(" ")}
          >
            Flagged only
          </button>

          {selectedCount > 0 && (
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                if (!confirm(`Delete ${selectedCount} observation${selectedCount !== 1 ? "s" : ""}? This cannot be undone.`)) return;
                setDeleting(true);
                try {
                  const res = await fetch("/api/health-data/observations", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ observationIds: selectedIds }),
                  });
                  if (!res.ok) return;
                  setSelected({});
                  await fetchData(category, flagOnly, page);
                } finally {
                  setDeleting(false);
                }
              }}
              className="h-9 rounded-[10px] border border-red-200 bg-red-50 px-4 text-[13px] font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40"
            >
              {deleting ? "Deleting…" : `Delete (${selectedCount})`}
            </button>
          )}
        </div>

        {/* Table */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-3 py-16 justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
              <span className="text-[14px] text-[var(--text-secondary)]">Loading…</span>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={!!(category || flagOnly || search)} />
          ) : (
            <>
              <div className="text-[12px] text-black/35 mb-3">
                {search ? `${filtered.length} matching` : `${total} total`} observation{total !== 1 ? "s" : ""}
              </div>
              <div className="rounded-[18px] border border-black/[0.07] bg-white overflow-hidden">
                {/* Column headers */}
                <div className="hidden grid-cols-[26px_2fr_1fr_1.1fr_1fr_1fr_1fr] gap-4 border-b border-black/[0.05] px-5 py-2.5 sm:grid">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={filtered.length > 0 && filtered.every((o) => selected[o.observationId])}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const next: Record<string, true> = {};
                          for (const o of filtered) next[o.observationId] = true;
                          setSelected(next);
                        } else {
                          setSelected({});
                        }
                      }}
                      className="h-4 w-4 rounded border-black/20"
                    />
                  </div>
                  {["Test", "Value", "Status", "Range", "Date", "Category"].map((h) => (
                    <p key={h} className="text-[11px] font-semibold uppercase tracking-wide text-black/35">{h}</p>
                  ))}
                </div>
                <div className="divide-y divide-black/[0.04]">
                  {filtered.map((obs) => (
                    <ObsRow
                      key={obs.observationId}
                      obs={obs}
                      checked={!!selected[obs.observationId]}
                      onToggle={() =>
                        setSelected((prev) => {
                          const next = { ...prev };
                          if (next[obs.observationId]) delete next[obs.observationId];
                          else next[obs.observationId] = true;
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {(data?.pagination.totalPages ?? 1) > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-[10px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] text-[var(--text-primary)] hover:bg-black/[0.03] disabled:opacity-30 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-[12px] text-black/40">
                    Page {page} of {data?.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === (data?.pagination.totalPages ?? 1)}
                    className="rounded-[10px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] text-[var(--text-primary)] hover:bg-black/[0.03] disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

function ObsRow({
  obs,
  checked,
  onToggle,
}: {
  obs: Observation;
  checked: boolean;
  onToggle: () => void;
}) {
  const name = obs.displayName ?? obs.metricName ?? obs.canonicalMetricName ?? "—";
  const date = obs.observationDate
    ? new Date(obs.observationDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[26px_2fr_1fr_1.1fr_1fr_1fr_1fr] sm:items-center sm:gap-4">
      <div className="hidden sm:flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${name}`}
          className="h-4 w-4 rounded border-black/20"
        />
      </div>
      <div>
        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{name}</p>
        {obs.flag && <p className={["text-[11px]", flagColor(obs.flag)].join(" ")}>{obs.flag}</p>}
      </div>
      <p className={["text-[13px] tabular-nums", flagColor(obs.flag)].join(" ")}>
        {obs.numericValue != null ? obs.numericValue : (obs.valueText ?? "—")}
        {obs.unit && <span className="ml-1 text-[11px] font-normal text-black/35">{obs.unit}</span>}
      </p>
      <div className="py-1">
        <RangePill obs={obs} />
      </div>
      <p className="text-[12px] text-black/40">{obs.referenceRange ?? "—"}</p>
      <p className="text-[12px] text-black/40">{date}</p>
      <p className="text-[12px] text-black/40">{fmt(obs.category)}</p>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-3xl">📋</span>
      <p className="mt-4 text-[15px] font-medium text-[var(--text-primary)]">
        {hasFilters ? "No matching observations" : "No observations yet"}
      </p>
      <p className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-xs">
        {hasFilters
          ? "Try adjusting your filters or clearing the search."
          : "Upload a health document and The Arc will extract your results automatically."}
      </p>
      {!hasFilters && (
        <Link
          href="/upload"
          className="mt-6 inline-flex h-10 items-center rounded-[12px] bg-[var(--foreground)] px-5 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity no-underline"
        >
          Upload health data
        </Link>
      )}
    </div>
  );
}

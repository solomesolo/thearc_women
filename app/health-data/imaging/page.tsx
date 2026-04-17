"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

type ImagingRecord = {
  documentId: string;
  reportDate: string | null;
  modality: string | null;
  bodyPart: string | null;
  findings: string | null;
  impression: string | null;
  recommendations: string | null;
  diagnoses: string[];
  source: string;
  parsingWarnings: string[];
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Section({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/35">
        {title}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.6] text-[var(--text-primary)]">
        {text}
      </p>
    </div>
  );
}

export default function ImagingPage() {
  const [data, setData] = useState<{ records: ImagingRecord[]; pagination: Pagination } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchData = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), pageSize: "20" });
      const res = await fetch(`/api/health-data/imaging?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Container className="py-12 md:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Health Data
            </p>
            <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Imaging
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
              Findings, impressions, diagnoses, and recommendations from imaging reports.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/health-data/observations"
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              Observations
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

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center gap-3 py-16 justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
              <span className="text-[14px] text-[var(--text-secondary)]">Loading…</span>
            </div>
          ) : (data?.records.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-3xl">🩻</span>
              <p className="mt-4 text-[15px] font-medium text-[var(--text-primary)]">
                No imaging reports yet
              </p>
              <p className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-xs">
                Upload an imaging report (MRI, CT, X-ray, ultrasound) to add it here.
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
              <div className="space-y-3">
                {data!.records.map((r) => (
                  <div key={r.documentId} className="rounded-[18px] border border-black/[0.07] bg-white px-5 py-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {r.modality ?? "Imaging report"}
                          {r.bodyPart ? <span className="text-black/40 font-normal"> · {r.bodyPart}</span> : null}
                        </p>
                        <p className="mt-1 text-[12px] text-black/45">
                          {fmtDate(r.reportDate)} · Source: {r.source}
                        </p>
                        {r.diagnoses.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.diagnoses.slice(0, 6).map((d, i) => (
                              <span
                                key={`${r.documentId}-dx-${i}`}
                                className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] text-[var(--text-secondary)]"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={busyId === r.documentId}
                          onClick={async () => {
                            setBusyId(r.documentId);
                            try {
                              const res = await fetch(`/api/health-data/imaging/${r.documentId}/preview`);
                              if (!res.ok) return;
                              const body = await res.json();
                              if (body?.url) window.open(body.url, "_blank", "noopener,noreferrer");
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="text-[12px] text-black/50 hover:text-black/70 transition-colors"
                        >
                          {busyId === r.documentId ? "Opening…" : "Preview original"}
                        </button>
                        <Link
                          href={`/upload/${r.documentId}`}
                          className="text-[12px] text-black/50 hover:text-black/70 transition-colors no-underline"
                        >
                          View processing →
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === r.documentId}
                          onClick={async () => {
                            if (!confirm("Delete this imaging record? This cannot be undone.")) return;
                            setBusyId(r.documentId);
                            try {
                              const res = await fetch("/api/health-data/imaging", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ documentIds: [r.documentId] }),
                              });
                              if (!res.ok) return;
                              await fetchData(page);
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="text-[12px] text-red-600 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <Section title="Findings" text={r.findings} />
                    <Section title="Impression" text={r.impression} />
                    <Section title="Recommendations" text={r.recommendations} />

                    {r.parsingWarnings.length > 0 && (
                      <div className="mt-4 rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-[12px] font-medium text-amber-800">Notes</p>
                        <ul className="mt-1 space-y-1">
                          {r.parsingWarnings.slice(0, 3).map((w, i) => (
                            <li key={`${r.documentId}-w-${i}`} className="text-[12px] text-amber-700">
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

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


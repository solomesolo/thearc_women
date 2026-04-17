"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

// ── Types ─────────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "started" | "completed" | "failed" | "skipped" | "retrying";

type Step = {
  key:         string;
  label:       string;
  status:      StepStatus;
  isActive:    boolean;
  durationMs:  number | null;
  errorMessage: string | null;
};

type StatusData = {
  documentId:       string;
  fileName:         string;
  jobStatus:        string;
  processingStatus: string;
  progressPct:      number;
  currentStep:      string | null;
  completedSteps:   string[];
  retryCount:       number;
  lastError:        string | null;
  steps:            Step[];
  ocrStatus:        string | null;
  avgConfidence:    number | null;
  pageCount:        number | null;
  lowConfidencePages: number[];
  isComplete:       boolean;
  isSuccess:        boolean;
};

type ResultsData = {
  fileName:   string;
  classification: { documentType: string; confidence: number } | null;
  bins:       { assignedBins: string[] } | null;
  sensitivity: { sensitivityLevel: string } | null;
  observations: {
    active:   number;
    flagged:  number;
    byCategory: Record<string, number>;
  };
  recentObservations: {
    name:      string | null;
    value:     unknown;
    unit:      string | null;
    flag:      string | null;
    category:  string | null;
    date:      string | null;
    reference: string | null;
  }[];
};

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

type ClinicalNoteRecord = {
  documentId: string;
  reportDate: string | null;
  documentType: string;
  summary: string | null;
  diagnoses: string[];
  recommendations: string | null;
  medications: unknown;
  rawNotes: string | null;
  source: string;
  parsingWarnings: string[];
  updatedAt: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function stepIcon(s: Step): React.ReactNode {
  if (s.status === "completed")
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0c0c0c] text-[11px] text-white font-bold">✓</span>;
  if (s.status === "failed")
    return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-[11px] text-red-600 font-bold">✕</span>;
  if (s.isActive || s.status === "started" || s.status === "retrying")
    return (
      <span className="flex h-6 w-6 items-center justify-center">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/70" />
      </span>
    );
  return <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.12] bg-transparent" />;
}

function flagColor(flag: string | null): string {
  if (!flag) return "";
  const upper = flag.toUpperCase();
  if (upper === "H" || upper === "HH" || upper === "CRITICAL" || upper === "PANIC")
    return "text-red-600";
  if (upper === "L" || upper === "LL")
    return "text-amber-600";
  return "";
}

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDocType(dt: string): string {
  return dt
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

// ── Processing View ────────────────────────────────────────────────────────────

function ProcessingView({ status, documentId }: { status: StatusData; documentId: string }) {
  const isFailed = status.jobStatus === "failed";

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
        Health Data Upload
      </p>
      <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {isFailed ? "Processing failed" : "Analysing your document"}
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
        {isFailed
          ? "Something went wrong during processing. You can retry below."
          : `${status.fileName} — this usually takes 30–90 seconds.`}
      </p>

      {/* Progress bar */}
      {!isFailed && (
        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full bg-[var(--foreground)] transition-all duration-500"
            style={{ width: `${status.progressPct}%` }}
          />
        </div>
      )}

      {/* Step list */}
      <div className="mt-6 space-y-2.5">
        {status.steps.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            {stepIcon(step)}
            <div className="flex-1">
              <span
                className={[
                  "text-[13px]",
                  step.status === "completed" ? "text-[var(--text-primary)] font-medium" : "",
                  step.isActive || step.status === "started" ? "text-[var(--text-primary)] font-medium" : "",
                  step.status === "pending" || step.status === "skipped" ? "text-black/35" : "",
                  step.status === "failed" ? "text-red-600 font-medium" : "",
                ].join(" ")}
              >
                {step.label}
              </span>
              {step.status === "retrying" && (
                <span className="ml-2 text-[11px] text-amber-600">Retrying…</span>
              )}
              {step.durationMs != null && step.status === "completed" && (
                <span className="ml-2 text-[11px] text-black/30">
                  {step.durationMs < 1000 ? `${step.durationMs}ms` : `${(step.durationMs / 1000).toFixed(1)}s`}
                </span>
              )}
              {step.errorMessage && step.status === "failed" && (
                <p className="mt-0.5 text-[11px] text-red-500 leading-[1.4]">{step.errorMessage}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Retry */}
      {isFailed && (
        <div className="mt-8 rounded-[18px] border border-red-100 bg-red-50 px-5 py-5">
          <p className="text-[13px] font-medium text-red-700">Processing stopped</p>
          {status.lastError && (
            <p className="mt-1 text-[12px] leading-[1.5] text-red-500">{status.lastError}</p>
          )}
          <div className="mt-4 flex gap-3">
            <RetryButton documentId={documentId} />
            <Link
              href="/upload/files"
              className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
            >
              Upload again
            </Link>
          </div>
        </div>
      )}

      {/* Low confidence warning */}
      {status.ocrStatus === "partial" && !isFailed && (
        <div className="mt-6 rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-4">
          <p className="text-[12px] leading-[1.55] text-amber-700">
            Some pages had low OCR confidence ({status.lowConfidencePages.join(", ")}). Results may be incomplete — consider re-uploading a clearer scan.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Results View ───────────────────────────────────────────────────────────────

function ResultsView({ results, documentId, status }: { results: ResultsData; documentId: string; status: StatusData }) {
  const obs = results.observations;
  const categories = Object.entries(obs.byCategory).sort((a, b) => b[1] - a[1]);
  const isImaging = results.classification?.documentType === "imaging_report";
  const isClinicalNote =
    !!results.classification?.documentType &&
    results.classification.documentType !== "lab_report" &&
    results.classification.documentType !== "imaging_report";
  const [imaging, setImaging] = useState<ImagingRecord | null>(null);
  const [clinical, setClinical] = useState<ClinicalNoteRecord | null>(null);

  useEffect(() => {
    if (!isImaging) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/health-data/imaging/${documentId}`);
        if (!res.ok) return;
        const data: ImagingRecord = await res.json();
        if (!cancelled) setImaging(data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [isImaging, documentId]);

  useEffect(() => {
    if (!isClinicalNote) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/health-data/clinical-notes/${documentId}`);
        if (!res.ok) return;
        const data: ClinicalNoteRecord = await res.json();
        if (!cancelled) setClinical(data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [isClinicalNote, documentId]);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
        Health Data Upload
      </p>
      <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        Processing complete
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
        {results.fileName}
      </p>

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label={isImaging ? "Observations found" : "Results found"}
          value={String(obs.active)}
          sub={obs.flagged > 0 ? `${obs.flagged} flagged` : undefined}
          flagged={obs.flagged > 0}
        />
        <SummaryCard
          label="Document type"
          value={results.classification ? formatDocType(results.classification.documentType) : "—"}
          sub={results.classification ? `${Math.round(results.classification.confidence * 100)}% confidence` : undefined}
        />
        <SummaryCard
          label="OCR quality"
          value={status.avgConfidence != null ? `${Math.round(status.avgConfidence)}%` : "—"}
          sub={`${status.pageCount ?? 0} page${status.pageCount !== 1 ? "s" : ""}`}
        />
        <SummaryCard
          label="Privacy"
          value={results.sensitivity?.sensitivityLevel
            ? formatDocType(results.sensitivity.sensitivityLevel)
            : "Standard"}
        />
      </div>

      {/* Imaging narrative */}
      {isImaging && (
        <div className="mt-8 rounded-[18px] border border-black/[0.07] bg-white px-5 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                Imaging report saved to your record
              </p>
              <p className="mt-1 text-[12px] text-black/45">
                View it in the Imaging section (findings, impression/diagnosis, and recommendations).
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/health-data/imaging"
                className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
              >
                Imaging
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/health-data/imaging/${documentId}/preview`);
                    if (!res.ok) return;
                    const body = await res.json();
                    if (body?.url) window.open(body.url, "_blank", "noopener,noreferrer");
                  } catch {}
                }}
                className="rounded-[12px] bg-[var(--foreground)] px-4 py-2 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity"
              >
                Preview original
              </button>
            </div>
          </div>

          {imaging ? (
            <>
              {imaging.diagnoses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {imaging.diagnoses.slice(0, 8).map((d, i) => (
                    <span
                      key={`${imaging.documentId}-dx-${i}`}
                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] text-[var(--text-secondary)]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
              <Section title="Findings" text={imaging.findings} />
              <Section title="Impression" text={imaging.impression} />
              <Section title="Recommendations" text={imaging.recommendations} />
            </>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
              <span className="text-[13px] text-[var(--text-secondary)]">
                Loading imaging summary…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Clinical notes narrative */}
      {isClinicalNote && (
        <div className="mt-8 rounded-[18px] border border-black/[0.07] bg-white px-5 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                Clinical note saved to your record
              </p>
              <p className="mt-1 text-[12px] text-black/45">
                View it in Clinical Notes (summary, diagnoses, and recommendations).
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/health-data/clinical-notes"
                className="rounded-[12px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:bg-black/[0.03] transition-colors no-underline"
              >
                Clinical Notes
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/health-data/clinical-notes/${documentId}/preview`);
                    if (!res.ok) return;
                    const body = await res.json();
                    if (body?.url) window.open(body.url, "_blank", "noopener,noreferrer");
                  } catch {}
                }}
                className="rounded-[12px] bg-[var(--foreground)] px-4 py-2 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity"
              >
                Preview original
              </button>
            </div>
          </div>

          {clinical ? (
            <>
              {clinical.diagnoses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {clinical.diagnoses.slice(0, 8).map((d, i) => (
                    <span
                      key={`${clinical.documentId}-dx-${i}`}
                      className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] text-[var(--text-secondary)]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
              <Section title="Summary" text={clinical.summary} />
              <Section title="Recommendations" text={clinical.recommendations} />
              <Section title="Notes" text={clinical.rawNotes} />
            </>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
              <span className="text-[13px] text-[var(--text-secondary)]">
                Loading clinical note…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Categories extracted</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map(([cat, count]) => (
              <span
                key={cat}
                className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] text-[var(--text-secondary)]"
              >
                {formatCategory(cat)} · {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent observations table */}
      {results.recentObservations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
            Recent results
          </h2>
          <div className="mt-3 divide-y divide-black/[0.05] rounded-[18px] border border-black/[0.07] bg-white overflow-hidden">
            {results.recentObservations.map((obs, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                    {obs.name ?? "—"}
                  </p>
                  {obs.date && (
                    <p className="text-[11px] text-black/35">{obs.date}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={["text-[13px] font-medium tabular-nums", flagColor(obs.flag)].join(" ")}>
                    {obs.value != null ? String(obs.value) : "—"}
                    {obs.unit && <span className="ml-1 text-[11px] font-normal text-black/40">{obs.unit}</span>}
                  </p>
                  {obs.flag && (
                    <p className={["text-[11px] font-semibold", flagColor(obs.flag)].join(" ")}>
                      {obs.flag}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="mt-8">
        <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
          What you can do next
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <NextStepCard
            href="/health-data/observations"
            icon="📋"
            label="All observations"
            desc="Browse and filter every result across your documents"
          />
          <NextStepCard
            href="/health-data/trends"
            icon="📈"
            label="Trends"
            desc="See how your values change over time"
          />
          <NextStepCard
            href="/health-data/care-gaps"
            icon="🗓"
            label="Care plan"
            desc="Missing tests and upcoming follow-ups"
          />
        </div>
      </div>

      {/* Upload another */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/upload/files"
          className="text-[13px] text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)] transition-colors no-underline"
        >
          Upload another document
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, flagged }: { label: string; value: string; sub?: string; flagged?: boolean }) {
  return (
    <div className="rounded-[14px] border border-black/[0.07] bg-white px-4 py-4">
      <p className="text-[11px] text-black/40">{label}</p>
      <p className={["mt-1 text-[17px] font-semibold tracking-tight", flagged ? "text-red-600" : "text-[var(--text-primary)]"].join(" ")}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-black/35">{sub}</p>}
    </div>
  );
}

function NextStepCard({ href, icon, label, desc }: { href: string; icon: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-[14px] border border-black/[0.07] bg-white px-4 py-4 no-underline hover:border-black/[0.15] hover:bg-black/[0.01] transition-colors"
    >
      <span className="text-[18px]">{icon}</span>
      <p className="mt-2 text-[13px] font-semibold text-[var(--text-primary)]">{label}</p>
      <p className="mt-0.5 text-[12px] leading-[1.5] text-black/45">{desc}</p>
    </Link>
  );
}

function RetryButton({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    try {
      await fetch(`/api/ocr/${documentId}/retry`, { method: "POST" });
    } catch {}
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={loading}
      className="rounded-[12px] bg-[var(--foreground)] px-4 py-2.5 text-[13px] font-medium text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? "Retrying…" : "Retry processing"}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DocumentProcessingPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = use(params);

  const [status, setStatus] = useState<StatusData | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/health-data/upload/${documentId}/status`);
      if (!res.ok) {
        if (res.status === 401) { setError("You’re signed out. Please log in again."); return false; }
        if (res.status === 403) { setError("Access denied for this document."); return false; }
        if (res.status === 404) { setError("Document not found."); return false; }
        try {
          const body = await res.json();
          if (body?.error) setError(String(body.error));
          else setError("Unable to load processing status.");
        } catch {
          setError("Unable to load processing status.");
        }
        return false;
      }
      const data: StatusData = await res.json();
      setStatus(data);
      return data.isComplete;
    } catch {
      setError("Network error while loading status.");
      return false;
    }
  }, [documentId]);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/health-data/upload/${documentId}/results`);
      if (res.ok) {
        const data: ResultsData = await res.json();
        setResults(data);
      }
    } catch {}
  }, [documentId]);

  // Poll until complete
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const done = await fetchStatus();
      if (!done) {
        timer = setTimeout(poll, 2000);
      } else {
        await fetchResults();
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [fetchStatus, fetchResults]);

  // Re-poll on visibility change (tab focus)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && status && !status.isComplete) {
        fetchStatus();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status, fetchStatus]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Container className="py-16">
          <div className="mx-auto max-w-xl">
            <p className="text-[14px] text-[var(--text-secondary)]">{error}</p>
            <Link href="/upload/files" className="mt-4 block text-[13px] underline underline-offset-2 no-underline hover:opacity-70">
              Return to upload
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Container className="py-16">
          <div className="mx-auto max-w-xl flex items-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/60" />
            <span className="text-[14px] text-[var(--text-secondary)]">Loading…</span>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Container className="py-12 md:py-16 lg:py-20">
        {status.isSuccess && results ? (
          <ResultsView results={results} documentId={documentId} status={status} />
        ) : (
          <ProcessingView status={status} documentId={documentId} />
        )}
      </Container>
    </div>
  );
}

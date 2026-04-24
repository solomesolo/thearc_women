import { useMemo, useState } from "react";

export type TimelineStatus = "not_started" | "planned" | "done";
export type TimelinePriority = "do_now" | "do_soon" | "lower_priority";

export type HealthCheck = {
  id: string;
  title: string;
  priority: TimelinePriority;
  status: TimelineStatus;
  scheduledMonthOffset: number; // 0..11
  estimatedEffort?: string;
  category: string;
  biomarkers?: string[];
  whyThisMatters: string;
};

export type HealthTimelineProps = {
  checks: HealthCheck[];
  currentDate?: Date;
  onStatusChange: (checkId: string, status: TimelineStatus) => void;
};

type MonthBucket = {
  offset: number;
  label: string;
  checks: HealthCheck[];
};

function addMonths(d: Date, n: number) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function monthLabel(d: Date) {
  return d.toLocaleString("en", { month: "short", year: "numeric" });
}

function priorityPill(priority: TimelinePriority) {
  if (priority === "do_now") return { text: "Do now", cls: "bg-[#0c0c0c] text-white" };
  if (priority === "do_soon") return { text: "Do soon", cls: "bg-[#525252] text-white" };
  return { text: "Optional", cls: "bg-[#f5f5f4] text-[#404040] border border-black/[0.08]" };
}

function statusDot(status: TimelineStatus) {
  if (status === "done") return "bg-[#0c0c0c]";
  if (status === "planned") return "bg-[#525252]";
  return "bg-[#d4d4d4]";
}

function monthStateLabel(checks: HealthCheck[], isCurrent: boolean) {
  if (isCurrent) return "This month";
  if (!checks.length) return "No checks planned";
  const done = checks.filter((c) => c.status === "done").length;
  const planned = checks.filter((c) => c.status === "planned").length;
  if (done === checks.length) return "Completed";
  if (planned > 0) return "In progress";
  return "Upcoming";
}

function TimelineMilestoneBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[0.75rem] font-medium text-[#404040] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      {label}
    </span>
  );
}

function TimelineCheckItem({
  check,
  expanded,
  onToggle,
  onStatusChange,
}: {
  check: HealthCheck;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: TimelineStatus) => void;
}) {
  const pill = priorityPill(check.priority);
  const isDone = check.status === "done";
  const ctaLabel = check.status === "not_started" ? "Start planning" : check.status === "planned" ? "Mark completed" : "Completed";
  const nextStatus: TimelineStatus = check.status === "not_started" ? "planned" : check.status === "planned" ? "done" : "done";

  return (
    <div className="rounded-[14px] border border-black/[0.06] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${pill.cls}`}>
              {pill.text}
            </span>
            <span className="inline-flex items-center gap-2 text-[0.8125rem] text-[#737373]">
              <span className={`h-2 w-2 rounded-full ${statusDot(check.status)}`} aria-hidden />
              {check.status === "done" ? "Done" : check.status === "planned" ? "Planned" : "Not started"}
            </span>
            {check.estimatedEffort && (
              <span className="rounded-full border border-black/[0.08] bg-[#fafaf9] px-2.5 py-0.5 text-[0.75rem] text-[#525252]">
                {check.estimatedEffort}
              </span>
            )}
          </div>
          <p className="mt-2 truncate text-[0.9375rem] font-medium text-[#0c0c0c]">{check.title}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
          >
            {expanded ? "Hide" : "Details"}
          </button>
          <button
            type="button"
            disabled={isDone}
            onClick={() => onStatusChange(check.id, nextStatus)}
            className="rounded-[12px] bg-[#0c0c0c] px-3.5 py-2 text-[0.8125rem] font-medium text-white transition-[filter] hover:brightness-[0.88] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 rounded-[12px] border border-black/[0.06] bg-[#fafaf9] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">Why this matters</p>
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#404040]">{check.whyThisMatters}</p>
          {!!check.biomarkers?.length && (
            <>
              <div className="mt-3 border-t border-black/[0.06] pt-3" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">Biomarkers included</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {check.biomarkers.slice(0, 6).map((b) => (
                  <span key={b} className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[0.75rem] text-[#525252]">
                    {b}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function HealthTimeline({ checks, currentDate, onStatusChange }: HealthTimelineProps) {
  const now = useMemo(() => currentDate ?? new Date(), [currentDate]);

  const months: MonthBucket[] = useMemo(() => {
    const buckets: MonthBucket[] = [];
    for (let i = 0; i < 12; i++) {
      const d = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), i);
      buckets.push({ offset: i, label: monthLabel(d), checks: [] });
    }
    for (const c of checks) {
      const idx = Math.max(0, Math.min(11, c.scheduledMonthOffset));
      buckets[idx].checks.push(c);
    }
    for (const b of buckets) {
      b.checks.sort((a, z) => (a.priority === "do_now" ? 0 : a.priority === "do_soon" ? 1 : 2) - (z.priority === "do_now" ? 0 : z.priority === "do_soon" ? 1 : 2));
    }
    return buckets;
  }, [checks, now]);

  const timelineDone = checks.filter((c) => c.status === "done").length;
  const timelineTotal = checks.length;
  const pct = timelineTotal ? Math.round((timelineDone / timelineTotal) * 100) : 0;

  const baseline = checks.find((c) => c.id === "preventive_baseline");
  const firstPlanned = checks.some((c) => c.status === "planned" || c.status === "done");
  const halfway = timelineTotal > 0 && timelineDone >= Math.ceil(timelineTotal / 2);
  const annualReady = timelineTotal > 0 && timelineDone === timelineTotal;

  const milestones = [
    firstPlanned ? "Baseline started" : null,
    baseline?.status === "done" ? "Baseline complete" : null,
    halfway ? "Halfway milestone" : null,
    annualReady ? "Annual review ready" : null,
  ].filter(Boolean) as string[];

  const [expandedMonth, setExpandedMonth] = useState<number | null>(months.find((m) => m.offset === 0 && m.checks.length > 0)?.offset ?? null);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  return (
    <section className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            Your 12-month health timeline
          </p>
          <p className="mt-2 max-w-[46rem] text-[0.9375rem] leading-[1.65] text-[#737373]">
            A clear plan for when to complete each recommended check, starting this month.
          </p>
          {!!milestones.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {milestones.slice(0, 4).map((m) => (
                <TimelineMilestoneBadge key={m} label={m} />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
            Timeline progress
          </p>
          <p className="mt-1 text-[0.9375rem] font-medium text-[#0c0c0c]">
            {timelineDone} of {timelineTotal} checks completed
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Timeline progress" aria-valuenow={timelineDone} aria-valuemin={0} aria-valuemax={Math.max(1, timelineTotal)}>
            <div className="h-full rounded-full bg-[#0c0c0c] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Desktop horizontal timeline */}
      <div className="mt-6 hidden md:block">
        <div className="overflow-x-auto rounded-[16px] border border-black/[0.06] bg-gradient-to-b from-[#ffffff] to-[#fafaf9] p-4">
          <div className="grid min-w-[960px] grid-cols-12 gap-3">
            {months.map((m) => {
              const isCurrent = m.offset === 0;
              const doneCount = m.checks.filter((c) => c.status === "done").length;
              const state = monthStateLabel(m.checks, isCurrent);
              const compactEmpty = m.checks.length === 0;

              return (
                <div
                  key={m.offset}
                  className={`rounded-[16px] border border-black/[0.06] p-3 transition-colors ${isCurrent ? "bg-[#0c0c0c] text-white" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                        {m.label}
                      </p>
                      <p className={`mt-1 text-[0.8125rem] ${isCurrent ? "text-white" : "text-[#404040]"}`}>
                        {state}
                      </p>
                    </div>
                    {m.checks.length > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-[0.75rem] tabular-nums ${isCurrent ? "bg-white/10 text-white" : "bg-[#fafaf9] text-[#737373] border border-black/[0.06]"}`}>
                        {doneCount}/{m.checks.length}
                      </span>
                    )}
                  </div>

                  {compactEmpty ? (
                    <p className={`mt-3 text-[0.8125rem] ${isCurrent ? "text-white/70" : "text-[#a3a3a3]"}`}>
                      No checks planned
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {m.checks.slice(0, 2).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setExpandedMonth(m.offset);
                            setExpandedCheck((k) => (k === c.id ? null : c.id));
                          }}
                          className={`w-full rounded-[12px] border border-black/[0.06] px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#fafaf9] ${isCurrent ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-[#0c0c0c]"}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate">{c.title}</span>
                            <span className={`h-2 w-2 rounded-full ${isCurrent ? "bg-white" : statusDot(c.status)}`} aria-hidden />
                          </span>
                        </button>
                      ))}
                      {m.checks.length > 2 && (
                        <p className={`text-[0.75rem] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                          +{m.checks.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Expanded month detail */}
        {expandedMonth != null && months[expandedMonth] && months[expandedMonth].checks.length > 0 && (
          <div className="mt-4 rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {months[expandedMonth].label}
                </p>
                <p className="mt-1 text-[0.9375rem] text-[#737373]">
                  {monthStateLabel(months[expandedMonth].checks, expandedMonth === 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedMonth(null)}
                className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {months[expandedMonth].checks.map((c) => (
                <TimelineCheckItem
                  key={c.id}
                  check={c}
                  expanded={expandedCheck === c.id}
                  onToggle={() => setExpandedCheck((k) => (k === c.id ? null : c.id))}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile vertical timeline */}
      <div className="mt-6 md:hidden">
        <div className="space-y-3">
          {months.map((m) => {
            const hasChecks = m.checks.length > 0;
            const isCurrent = m.offset === 0;
            const open = (expandedMonth === m.offset) || (hasChecks && m.offset === 0);

            return (
              <div key={m.offset} className="rounded-[20px] border border-black/[0.08] bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedMonth((v) => (v === m.offset ? null : m.offset))}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">{m.label}</p>
                    <p className="mt-1 text-[0.875rem] text-[#404040]">{monthStateLabel(m.checks, isCurrent)}</p>
                  </div>
                  <span className="text-[0.8125rem] text-[#737373]">{open ? "Hide" : "View"}</span>
                </button>

                {open && (
                  <div className="border-t border-black/[0.06] p-4">
                    {hasChecks ? (
                      <div className="space-y-3">
                        {m.checks.map((c) => (
                          <TimelineCheckItem
                            key={c.id}
                            check={c}
                            expanded={expandedCheck === c.id}
                            onToggle={() => setExpandedCheck((k) => (k === c.id ? null : c.id))}
                            onStatusChange={onStatusChange}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[0.875rem] text-[#737373]">No checks planned</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


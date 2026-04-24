import { useMemo, useState } from "react";

export type RoadmapStatus = "not_started" | "planned" | "done";
export type RoadmapPriority = "do_now" | "do_soon" | "lower_priority";

export type RoadmapCheck = {
  id: string;
  title: string;
  priority: RoadmapPriority;
  status: RoadmapStatus;
  scheduledMonthOffset: number; // 0..11
  estimatedEffort?: string;
  category: string;
  biomarkers?: string[];
  whyThisMatters: string;
};

export type HealthRoadmapTimelineProps = {
  checks: RoadmapCheck[];
  currentDate?: Date;
  onStatusChange: (checkId: string, status: RoadmapStatus) => void;
};

const PHASES = [
  {
    id: "now",
    label: "Now",
    range: [0, 0] as const,
    description: "Start with your highest-impact checks.",
  },
  {
    id: "next",
    label: "Next",
    range: [1, 3] as const,
    description: "Complete the checks that help build your baseline.",
  },
  {
    id: "build",
    label: "Build",
    range: [4, 6] as const,
    description: "Add useful lower-priority checks when the core plan is underway.",
  },
  {
    id: "maintain",
    label: "Maintain",
    range: [7, 11] as const,
    description: "Use follow-ups and annual checks to keep your plan current.",
  },
] as const;

function addMonths(d: Date, n: number) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function monthLabel(d: Date) {
  return d.toLocaleString("en", { month: "short", year: "numeric" });
}

function offsetToMonthLabel(now: Date, offset: number) {
  const d = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), offset);
  return monthLabel(d);
}

function rangeLabel(now: Date, startOffset: number, endOffset: number) {
  if (startOffset === endOffset) return offsetToMonthLabel(now, startOffset);
  const start = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), startOffset);
  const end = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), endOffset);
  const startM = start.toLocaleString("en", { month: "short" });
  const endM = end.toLocaleString("en", { month: "short" });
  const startY = start.getFullYear();
  const endY = end.getFullYear();
  return startY === endY ? `${startM}–${endM} ${startY}` : `${startM} ${startY} – ${endM} ${endY}`;
}

function priorityPill(priority: RoadmapPriority) {
  if (priority === "do_now") return { text: "Do now", cls: "bg-[#0c0c0c] text-white" };
  if (priority === "do_soon") return { text: "Do soon", cls: "bg-[#525252] text-white" };
  return { text: "Optional", cls: "bg-[#f5f5f4] text-[#404040] border border-black/[0.08]" };
}

function statusDot(status: RoadmapStatus) {
  if (status === "done") return "bg-[#0c0c0c]";
  if (status === "planned") return "bg-[#525252]";
  return "bg-[#d4d4d4]";
}

function PhaseCheckCard({
  check,
  expanded,
  onToggle,
  onStatusChange,
}: {
  check: RoadmapCheck;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: RoadmapStatus) => void;
}) {
  const pill = priorityPill(check.priority);
  const isDone = check.status === "done";
  const ctaLabel =
    check.status === "not_started" ? "Start planning" : check.status === "planned" ? "Mark completed" : "Completed";
  const nextStatus: RoadmapStatus =
    check.status === "not_started" ? "planned" : check.status === "planned" ? "done" : "done";

  return (
    <div className="rounded-[16px] border border-black/[0.06] bg-white px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-medium text-[#0c0c0c]">{check.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
        <div className="mt-3 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-3.5 py-3">
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

function MilestoneBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[0.75rem] font-medium text-[#404040] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      {label}
    </span>
  );
}

export function HealthRoadmapTimeline({ checks, currentDate, onStatusChange }: HealthRoadmapTimelineProps) {
  const now = useMemo(() => currentDate ?? new Date(), [currentDate]);

  const { phaseItems, monthHasChecks } = useMemo(() => {
    const monthHasChecks = new Array(12).fill(false) as boolean[];
    for (const c of checks) {
      const idx = Math.max(0, Math.min(11, c.scheduledMonthOffset));
      monthHasChecks[idx] = true;
    }

    const phaseItems = PHASES.map((p) => {
      const [start, end] = p.range;
      const items = checks
        .filter((c) => c.scheduledMonthOffset >= start && c.scheduledMonthOffset <= end)
        .sort((a, b) => a.scheduledMonthOffset - b.scheduledMonthOffset);
      return { ...p, items };
    });

    return { phaseItems, monthHasChecks };
  }, [checks]);

  const done = checks.filter((c) => c.status === "done").length;
  const total = checks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const baseline = checks.find((c) => c.id === "preventive_baseline");
  const firstPlanned = checks.some((c) => c.status === "planned" || c.status === "done");
  const halfway = total > 0 && done >= Math.ceil(total / 2);
  const annualReady = total > 0 && done === total;
  const milestones = [
    firstPlanned ? "Baseline started" : null,
    baseline?.status === "done" ? "Baseline complete" : null,
    halfway ? "Halfway milestone" : null,
    annualReady ? "Annual review ready" : null,
  ].filter(Boolean) as string[];

  const [expandedPhase, setExpandedPhase] = useState<(typeof PHASES)[number]["id"]>("now");
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  return (
    <section className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
            Your 12-month health roadmap
          </p>
          <p className="mt-2 max-w-[50rem] text-[0.9375rem] leading-[1.65] text-[#737373]">
            A guided plan for what to do now, what to do next, and what can wait.
          </p>
          {!!milestones.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {milestones.slice(0, 4).map((m) => (
                <MilestoneBadge key={m} label={m} />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-[14px] border border-black/[0.06] bg-[#fafaf9] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
            Roadmap progress
          </p>
          <p className="mt-1 text-[0.9375rem] font-medium text-[#0c0c0c]">
            {done} of {total} checks completed
          </p>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white"
            role="progressbar"
            aria-label="Roadmap progress"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={Math.max(1, total)}
          >
            <div className="h-full rounded-full bg-[#0c0c0c] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Desktop roadmap path */}
      <div className="mt-6 hidden md:block">
        <div className="relative rounded-[18px] border border-black/[0.06] bg-gradient-to-b from-white to-[#fafaf9] p-5">
          <div className="absolute left-6 right-6 top-[44px] h-px bg-black/[0.08]" aria-hidden />

          <div className="grid grid-cols-4 gap-4">
            {phaseItems.map((p, idx) => {
              const isCurrent = p.id === expandedPhase;
              const doneCount = p.items.filter((c) => c.status === "done").length;
              const totalCount = p.items.length;
              return (
                <div key={p.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setExpandedPhase(p.id)}
                    aria-expanded={isCurrent}
                    className={`w-full rounded-[16px] border border-black/[0.06] px-4 py-3 text-left transition-colors ${isCurrent ? "bg-[#0c0c0c] text-white" : "bg-white hover:bg-[#fafaf9]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                          {p.label}
                        </p>
                        <p className={`mt-1 text-[0.875rem] ${isCurrent ? "text-white" : "text-[#404040]"}`}>
                          {rangeLabel(now, p.range[0], p.range[1])}
                        </p>
                        <p className={`mt-2 text-[0.8125rem] leading-[1.55] ${isCurrent ? "text-white/70" : "text-[#737373]"}`}>
                          {p.description}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.75rem] tabular-nums ${isCurrent ? "bg-white/10 text-white" : "bg-[#fafaf9] text-[#737373] border border-black/[0.06]"}`}>
                        {doneCount}/{Math.max(1, totalCount)}
                      </span>
                    </div>
                  </button>

                  {/* Node */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`h-3.5 w-3.5 rounded-full ${idx === 0 ? "bg-[#0c0c0c]" : "border border-black/[0.2] bg-white"} ${isCurrent ? "ring-4 ring-black/[0.08]" : ""}`}
                      aria-hidden
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: p.range[1] - p.range[0] + 1 }).map((_, i) => {
                        const offset = p.range[0] + i;
                        const has = monthHasChecks[offset];
                        const isThis = offset === 0;
                        if (!has) {
                          return (
                            <span key={offset} className="h-1.5 w-1.5 rounded-full bg-black/[0.14]" aria-label={`${offsetToMonthLabel(now, offset)}: no checks planned`} />
                          );
                        }
                        return (
                          <span
                            key={offset}
                            className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${isThis ? "bg-[#0c0c0c] text-white" : "bg-white text-[#404040] border border-black/[0.08]"}`}
                            aria-label={`${offsetToMonthLabel(now, offset)}${isThis ? ": this month" : ""}`}
                          >
                            {isThis ? "This month" : offsetToMonthLabel(now, offset)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile vertical roadmap */}
      <div className="mt-6 md:hidden">
        <div className="space-y-3">
          {phaseItems.map((p, idx) => {
            const open = expandedPhase === p.id;
            const doneCount = p.items.filter((c) => c.status === "done").length;
            const totalCount = p.items.length;
            return (
              <div key={p.id} className="rounded-[20px] border border-black/[0.08] bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedPhase(p.id)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-3.5 w-3.5 rounded-full ${idx === 0 ? "bg-[#0c0c0c]" : "border border-black/[0.2] bg-white"} ${open ? "ring-4 ring-black/[0.08]" : ""}`}
                      aria-hidden
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{p.label}</p>
                      <p className="mt-1 text-[0.875rem] text-[#404040]">{rangeLabel(now, p.range[0], p.range[1])}</p>
                      <p className="mt-2 text-[0.8125rem] leading-[1.55] text-[#737373]">{p.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-black/[0.06] bg-[#fafaf9] px-2 py-0.5 text-[0.75rem] tabular-nums text-[#737373]">
                    {doneCount}/{Math.max(1, totalCount)}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-black/[0.06] p-4">
                    {/* Months inside phase */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {Array.from({ length: p.range[1] - p.range[0] + 1 }).map((_, i) => {
                        const offset = p.range[0] + i;
                        const has = monthHasChecks[offset];
                        const isThis = offset === 0;
                        if (!has) {
                          return (
                            <span key={offset} className="rounded-full border border-black/[0.06] bg-[#fafaf9] px-2.5 py-1 text-[0.75rem] text-[#a3a3a3]">
                              {offsetToMonthLabel(now, offset)} · No checks planned
                            </span>
                          );
                        }
                        return (
                          <span
                            key={offset}
                            className={`rounded-full px-2.5 py-1 text-[0.75rem] font-medium ${isThis ? "bg-[#0c0c0c] text-white" : "border border-black/[0.08] bg-white text-[#404040]"}`}
                          >
                            {isThis ? "This month" : offsetToMonthLabel(now, offset)}
                          </span>
                        );
                      })}
                    </div>

                    {p.items.length ? (
                      <div className="space-y-3">
                        {p.items.map((c) => (
                          <PhaseCheckCard
                            key={c.id}
                            check={c}
                            expanded={expandedCheck === c.id}
                            onToggle={() => setExpandedCheck((k) => (k === c.id ? null : c.id))}
                            onStatusChange={onStatusChange}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[0.875rem] text-[#737373]">No checks planned in this phase.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded phase details (desktop) */}
      <div className="mt-5 hidden md:block">
        {(() => {
          const p = phaseItems.find((x) => x.id === expandedPhase);
          if (!p) return null;
          const byMonth = new Map<number, RoadmapCheck[]>();
          for (const c of p.items) {
            if (!byMonth.has(c.scheduledMonthOffset)) byMonth.set(c.scheduledMonthOffset, []);
            byMonth.get(c.scheduledMonthOffset)!.push(c);
          }
          const offsets = Array.from({ length: p.range[1] - p.range[0] + 1 }).map((_, i) => p.range[0] + i);
          return (
            <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">{p.label}</p>
                  <p className="mt-1 text-[0.9375rem] text-[#737373]">{rangeLabel(now, p.range[0], p.range[1])}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedPhase("now")}
                  className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2 text-[0.8125rem] font-medium text-[#404040] hover:text-[#0c0c0c]"
                >
                  Back to Now
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {offsets.map((off) => {
                  const monthChecks = byMonth.get(off) ?? [];
                  if (!monthChecks.length) {
                    return (
                      <div key={off} className="rounded-[16px] border border-black/[0.06] bg-[#fafaf9] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                          {offsetToMonthLabel(now, off)}
                        </p>
                        <p className="mt-2 text-[0.875rem] text-[#a3a3a3]">No checks planned</p>
                      </div>
                    );
                  }
                  const doneCount = monthChecks.filter((c) => c.status === "done").length;
                  return (
                    <div key={off} className="rounded-[16px] border border-black/[0.06] bg-[#fafaf9] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                          {off === 0 ? "This month" : offsetToMonthLabel(now, off)}
                        </p>
                        <span className="rounded-full border border-black/[0.06] bg-white px-2 py-0.5 text-[0.75rem] tabular-nums text-[#737373]">
                          {doneCount}/{monthChecks.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-3">
                        {monthChecks.map((c) => (
                          <PhaseCheckCard
                            key={c.id}
                            check={c}
                            expanded={expandedCheck === c.id}
                            onToggle={() => setExpandedCheck((k) => (k === c.id ? null : c.id))}
                            onStatusChange={onStatusChange}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}


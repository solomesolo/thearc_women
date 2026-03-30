"use client";

import { useState, useEffect } from "react";
import type { DashboardPayload, DashboardKeyArea, DashboardSignal } from "@/lib/dashboard/types";
import type {
  StartingLineViewModel,
  StartingLineKeyArea,
  StartingLineSignal,
} from "@/lib/dashboard/startingLineTypes";
import type { Lens, RootPattern, System } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";
import { HealthStatusChip, type HealthStatus } from "./HealthStatusChip";

// ─── helpers ──────────────────────────────────────────────────────────────────

const AREA_LABELS: Record<string, string> = {
  sleep: "Sleep",
  stress: "Stress",
  energy: "Energy",
  recovery: "Recovery",
  hormones: "Hormones",
  cycle: "Cycle",
  metabolism: "Metabolism",
  nutrition: "Nutrition",
  cardiovascular: "Cardiovascular",
  gut: "Gut Health",
  skin_hair: "Skin & Hair",
};

const SYSTEM_STATUS_LABEL: Record<string, string> = {
  stable: "Stable",
  variable: "Variable",
  needs_attention: "Needs attention",
};

function severityToStatus(severity: string | null): HealthStatus {
  if (!severity || severity === "stable") return "Within expected range";
  return "Worth attention";
}

function stateToStatus(stateCode: string): HealthStatus {
  if (stateCode === "stable" || stateCode === "optimal") return "Within expected range";
  return "Worth attention";
}

// Score bar: score is expected to be 0–100
function ScoreBar({ score, severity }: { score: number; severity: string | null }) {
  const pct = Math.min(100, Math.max(0, score));
  const isAttention = severity && severity !== "stable";
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[12px] text-black/45 mb-1">
        <span>Score</span>
        <span className="font-semibold text-black/60">{Math.round(pct)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/[0.07] overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            isAttention ? "bg-amber-400" : "bg-emerald-400",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Key area cards ───────────────────────────────────────────────────────────

function KeyAreaCard({ ka }: { ka: DashboardKeyArea }) {
  const [open, setOpen] = useState(false);
  const status = severityToStatus(ka.severity);
  const label = AREA_LABELS[ka.area] ?? ka.title;

  return (
    <DashboardCard as="div" hover={false} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{label}</p>
        <HealthStatusChip status={status} className="shrink-0" />
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-black/75">{ka.shortBody}</p>
      <ScoreBar score={ka.score} severity={ka.severity} />
      {ka.whyItMatters && (
        <div className="mt-3 border-t border-black/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[12px] font-medium text-black/50 hover:text-black/70 transition-colors"
            aria-expanded={open}
          >
            Why it matters {open ? "▴" : "▾"}
          </button>
          {open && (
            <p className="mt-2 text-[13px] leading-relaxed text-black/65">{ka.whyItMatters}</p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

function EngineKeyAreaCard({ ka }: { ka: StartingLineKeyArea }) {
  const [open, setOpen] = useState(false);
  const status = stateToStatus(ka.stateCode);
  const label = AREA_LABELS[ka.code] ?? ka.title ?? ka.code;

  return (
    <DashboardCard as="div" hover={false} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">{label}</p>
        <HealthStatusChip status={status} className="shrink-0" />
      </div>
      {ka.shortBody && (
        <p className="mt-2 text-[13px] leading-relaxed text-black/75">{ka.shortBody}</p>
      )}
      <ScoreBar score={ka.score} severity={ka.stateCode === "stable" ? "stable" : "attention"} />
      {ka.whyItMatters && (
        <div className="mt-3 border-t border-black/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[12px] font-medium text-black/50 hover:text-black/70 transition-colors"
            aria-expanded={open}
          >
            Why it matters {open ? "▴" : "▾"}
          </button>
          {open && (
            <p className="mt-2 text-[13px] leading-relaxed text-black/65">{ka.whyItMatters}</p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

// ─── Signals band ─────────────────────────────────────────────────────────────

function LegacySignalsBand({ signals }: { signals: DashboardSignal[] }) {
  if (signals.length === 0) return null;
  const top = signals.slice(0, 8);
  return (
    <div className="mt-5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-3">
        Signals detected
      </p>
      <div className="flex flex-wrap gap-2">
        {top.map((s) => {
          const isAttention = s.severity && s.severity !== "stable";
          return (
            <span
              key={s.signalCode}
              title={s.interpretation ?? undefined}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium",
                isAttention
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-black/[0.09] bg-black/[0.02] text-black/65",
              ].join(" ")}
            >
              {s.title}
            </span>
          );
        })}
        {signals.length > 8 && (
          <span className="inline-flex items-center rounded-full border border-black/[0.09] bg-transparent px-3 py-1 text-[12px] text-black/40">
            +{signals.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}

function EngineSignalsBand({ signals }: { signals: StartingLineSignal[] }) {
  if (signals.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-3">
        Signals detected
      </p>
      <div className="flex flex-wrap gap-2">
        {signals.slice(0, 8).map((s) => {
          const isAttention = s.strength === "strong" || s.strength === "moderate";
          return (
            <span
              key={s.code}
              title={`${s.strength} · ${s.confidence} confidence`}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium",
                isAttention
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-black/[0.09] bg-black/[0.02] text-black/65",
              ].join(" ")}
            >
              {s.label}
            </span>
          );
        })}
        {signals.length > 8 && (
          <span className="inline-flex items-center rounded-full border border-black/[0.09] bg-transparent px-3 py-1 text-[12px] text-black/40">
            +{signals.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Engine panel (right column) ──────────────────────────────────────────────

type EnginePanel = { lens: Lens; systems: System[]; rootPatterns: RootPattern[] };

function EngineLensCard({ lens }: { lens: Lens }) {
  return (
    <div className="rounded-[18px] border border-black/[0.08] bg-black/[0.015] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40 mb-2">
        Primary focus lens
      </p>
      <p className="text-[16px] font-semibold text-[var(--text-primary)]">{lens.title}</p>
      {lens.oneLine && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-black/65">{lens.oneLine}</p>
      )}
    </div>
  );
}

function EngineRootPatterns({ patterns }: { patterns: RootPattern[] }) {
  if (patterns.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-3">
        Underlying patterns
      </p>
      <div className="space-y-2">
        {patterns.slice(0, 4).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-[var(--background)] px-4 py-3"
          >
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{p.title}</p>
            <span
              className={[
                "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                p.evidence === "strong" || p.evidence === "established"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-black/[0.10] bg-transparent text-black/40",
              ].join(" ")}
            >
              {p.evidence}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngineSystemsGrid({ systems }: { systems: System[] }) {
  if (systems.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-3">
        Body systems
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {systems.slice(0, 6).map((s) => {
          const statusLabel = SYSTEM_STATUS_LABEL[s.status ?? "stable"] ?? s.status;
          const isAttention = s.status === "needs_attention";
          return (
            <div
              key={s.id}
              className={[
                "rounded-xl border px-3 py-3",
                isAttention
                  ? "border-amber-200 bg-amber-50"
                  : s.status === "variable"
                    ? "border-yellow-100 bg-yellow-50/50"
                    : "border-black/[0.07] bg-transparent",
              ].join(" ")}
            >
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {s.label}
              </p>
              <p
                className={[
                  "mt-0.5 text-[11px] font-medium",
                  isAttention
                    ? "text-amber-700"
                    : s.status === "variable"
                      ? "text-yellow-700"
                      : "text-black/40",
                ].join(" ")}
              >
                {statusLabel}
              </p>
              {s.micro && (
                <p className="mt-1 text-[11px] leading-snug text-black/50 line-clamp-2">
                  {s.micro}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Props = {
  payload: DashboardPayload | null;
  startingLine: StartingLineViewModel | null;
};

export function StartingLineSection({ payload, startingLine }: Props) {
  const [engine, setEngine] = useState<EnginePanel | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);

  // Determine rendering mode:
  // "engine" = render from resolved StartingLineViewModel (user-specific engine run)
  // "legacy" = render from DashboardPayload (old Python engine / Supabase scored rows)
  const isEngineResolved =
    startingLine !== null && startingLine.debug.source === "resolved_run";

  // For the "has data" check: engine mode or legacy has hero
  const hasRealData = isEngineResolved || (!!payload?.hero && payload?.responseSessionId !== "none");

  // Legacy-mode hero card expansion
  const [heroExpanded, setHeroExpanded] = useState(false);
  // Engine-mode explainer expansion
  const [explainerExpanded, setExplainerExpanded] = useState(false);

  // Fetch Python engine panel data (lens, systems, rootPatterns) from /api/dashboard
  // Only needed as a supplementary right-column panel, not for the hero card.
  useEffect(() => {
    if (!hasRealData) return;
    setEngineLoading(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as Record<string, unknown>;
        const source = d._source as string;
        let output: Record<string, unknown> | null = null;
        if (source === "survey" && d.output) {
          output = d.output as Record<string, unknown>;
        } else if (source === "dummy" && d.payload) {
          const p = d.payload as Record<string, unknown>;
          setEngine({
            lens: p.lens as Lens,
            systems: (p.systems as System[]) ?? [],
            rootPatterns: (p.rootPatterns as RootPattern[]) ?? [],
          });
          return;
        }
        if (!output) return;

        const sections = (output.dashboard_sections ?? {}) as Record<string, unknown>;
        const lensCard = (sections.primary_lens_card ?? {}) as Record<string, unknown>;
        const lensResult = (output.lens ?? {}) as Record<string, unknown>;
        const lens: Lens = {
          id: (lensResult.primary_lens_id as string) ?? "LENS_BASELINE",
          title: (lensCard.title as string) ?? "Your health lens",
          oneLine: (lensCard.body as string) ?? "",
        };

        const systemItems =
          ((sections.systems_map as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [];
        const systems: System[] = systemItems.map((item) => ({
          id: (item.system_id as string) ?? "",
          label: (item.label as string) ?? (item.system_id as string) ?? "",
          status: (item.status as "stable" | "variable" | "needs_attention") ?? "stable",
          micro: item.short_explanation as string | undefined,
        }));

        const patternList =
          ((sections.root_patterns_panel as Record<string, unknown>)?.root_patterns as Array<Record<string, unknown>>) ?? [];
        const rootPatterns: RootPattern[] = patternList.map((p) => {
          const ev = p.evidence_level as string | null;
          const evidence: RootPattern["evidence"] =
            ev === "High" ? "strong" :
            ev === "Moderate" ? "established" :
            ev === "Emerging" ? "emerging" : "exploratory";
          return {
            id: (p.pattern_id as string) ?? "",
            title: (p.pattern_id as string) ?? "",
            summary: `Confidence ${(p.confidence as number) ?? 0}%.`,
            signalTags: [],
            evidence,
          };
        });

        setEngine({ lens, systems, rootPatterns });
      })
      .catch(() => {/* silent — section degrades gracefully */})
      .finally(() => setEngineLoading(false));
  }, [hasRealData]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!hasRealData) {
    return (
      <section
        className="dashboard-section dashboard-shell"
        aria-labelledby="starting-line-heading"
      >
        <DashboardCard as="div" hover={false} className="p-8">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45">
            Your Starting Line
          </p>
          <h2
            id="starting-line-heading"
            className="mt-3 text-[22px] font-semibold tracking-tight text-[var(--text-primary)]"
          >
            Complete the survey to see your personalized baseline
          </h2>
          <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-black/65">
            Once you&apos;ve answered the health questions, we&apos;ll show you your real baseline
            across all body systems — connected to your survey responses and scored by our health
            engine.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-black/90 px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
          >
            Take the survey
          </button>
        </DashboardCard>
      </section>
    );
  }

  // ── Engine-resolved render (user-specific, from new TS engine output tables) ──
  if (isEngineResolved) {
    const sl = startingLine!;
    return (
      <section
        className="dashboard-section dashboard-shell"
        aria-labelledby="starting-line-heading"
      >
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-1">
          Your Starting Line
        </p>
        <p className="text-[13px] text-black/50 mb-6">
          Based on your survey answers · Last updated{" "}
          {new Date(sl.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="dashboard-grid-12 items-start gap-7">
          {/* ── Left column ── */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            {/* Hero statement */}
            <DashboardCard as="article" hover={false} className="p-6">
              <h2
                id="starting-line-heading"
                className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[26px]"
              >
                {sl.hero.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-black/70">
                {sl.hero.subtitle}
              </p>

              {sl.explainers.primary.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setExplainerExpanded((v) => !v)}
                    aria-expanded={explainerExpanded}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-black/50 hover:text-black/75 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
                  >
                    What&apos;s behind this
                    <span aria-hidden className="text-black/35">
                      {explainerExpanded ? "▴" : "▾"}
                    </span>
                  </button>
                  {explainerExpanded && (
                    <div className="mt-4 rounded-[16px] border border-black/[0.08] bg-black/[0.02] p-5 space-y-2">
                      {sl.explainers.primary.map((text, i) => (
                        <p key={i} className="text-[13px] leading-relaxed text-black/70">
                          {text}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Single most important focus */}
              {sl.focus && (
                <div className="mt-6 rounded-[18px] border border-black/[0.10] bg-black/[0.02] px-5 py-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-1">
                    Your single most important focus
                  </p>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {sl.focus.label}
                  </p>
                </div>
              )}
            </DashboardCard>

            {/* Key areas */}
            {sl.keyAreas.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-3">
                  Key areas of your health right now
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sl.keyAreas.slice(0, 6).map((ka) => (
                    <EngineKeyAreaCard key={ka.code} ka={ka} />
                  ))}
                </div>
              </div>
            )}

            {/* Signals band */}
            <EngineSignalsBand signals={sl.contributingSignals} />
          </div>

          {/* ── Right column ── */}
          <aside className="col-span-12 lg:col-span-5 flex flex-col gap-5">
            {engineLoading && !engine && (
              <div className="rounded-[24px] border border-black/[0.07] bg-black/[0.01] p-6">
                <div className="h-4 w-32 rounded bg-black/[0.07] animate-pulse mb-3" />
                <div className="h-3 w-full rounded bg-black/[0.05] animate-pulse mb-2" />
                <div className="h-3 w-3/4 rounded bg-black/[0.05] animate-pulse" />
              </div>
            )}

            {engine && (
              <DashboardCard as="div" hover={false} className="p-6">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-4">
                  Engine analysis
                </p>
                <EngineLensCard lens={engine.lens} />
                <EngineRootPatterns patterns={engine.rootPatterns} />
                <EngineSystemsGrid systems={engine.systems} />
              </DashboardCard>
            )}

            {/* What's influencing your patterns */}
            {sl.keyAreas.some((ka) => ka.whyItMatters) && (
              <DashboardCard as="div" hover={false} className="p-5">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
                  What&apos;s influencing your patterns
                </p>
                <div className="space-y-3">
                  {sl.keyAreas
                    .slice(0, 3)
                    .filter((ka) => ka.whyItMatters)
                    .map((ka) => (
                      <div
                        key={ka.code}
                        className="border-t border-black/[0.06] pt-3 first:border-0 first:pt-0"
                      >
                        <p className="text-[12px] font-semibold text-black/55 mb-1">
                          {AREA_LABELS[ka.code] ?? ka.title ?? ka.code}
                        </p>
                        <p className="text-[13px] leading-relaxed text-black/65">
                          {ka.whyItMatters}
                        </p>
                      </div>
                    ))}
                </div>
              </DashboardCard>
            )}
          </aside>
        </div>
      </section>
    );
  }

  // ── Legacy render (DashboardPayload fallback) ────────────────────────────────
  const hero = payload?.hero ?? null;
  const keyAreas = payload?.keyAreas ?? [];
  const signals = payload?.signals ?? [];

  return (
    <section
      className="dashboard-section dashboard-shell"
      aria-labelledby="starting-line-heading"
    >
      <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-1">
        Your Starting Line
      </p>
      <p className="text-[13px] text-black/50 mb-6">
        Based on your survey answers · Last updated{" "}
        {payload?.generatedAt
          ? new Date(payload.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "recently"}
      </p>

      <div className="dashboard-grid-12 items-start gap-7">
        {/* ── Left column: legacy data ── */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {hero && (
            <DashboardCard as="article" hover={false} className="p-6">
              <h2
                id="starting-line-heading"
                className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[26px]"
              >
                {hero.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-black/70">
                {hero.shortBody}
              </p>

              {hero.longBody && (
                <>
                  <button
                    type="button"
                    onClick={() => setHeroExpanded((v) => !v)}
                    aria-expanded={heroExpanded}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-black/50 hover:text-black/75 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
                  >
                    What&apos;s behind this
                    <span aria-hidden className="text-black/35">
                      {heroExpanded ? "▴" : "▾"}
                    </span>
                  </button>
                  {heroExpanded && (
                    <div className="mt-4 rounded-[16px] border border-black/[0.08] bg-black/[0.02] p-5">
                      <p className="text-[13px] leading-relaxed text-black/70">{hero.longBody}</p>
                    </div>
                  )}
                </>
              )}

              {hero.keyLever && (
                <div className="mt-6 rounded-[18px] border border-black/[0.10] bg-black/[0.02] px-5 py-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-1">
                    Your single most important focus
                  </p>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {hero.keyLever}
                  </p>
                </div>
              )}
            </DashboardCard>
          )}

          {keyAreas.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-3">
                Key areas of your health right now
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {keyAreas.slice(0, 6).map((ka) => (
                  <KeyAreaCard key={ka.area} ka={ka} />
                ))}
              </div>
            </div>
          )}

          <LegacySignalsBand signals={signals} />
        </div>

        {/* ── Right column ── */}
        <aside className="col-span-12 lg:col-span-5 flex flex-col gap-5">
          {engineLoading && !engine && (
            <div className="rounded-[24px] border border-black/[0.07] bg-black/[0.01] p-6">
              <div className="h-4 w-32 rounded bg-black/[0.07] animate-pulse mb-3" />
              <div className="h-3 w-full rounded bg-black/[0.05] animate-pulse mb-2" />
              <div className="h-3 w-3/4 rounded bg-black/[0.05] animate-pulse" />
            </div>
          )}

          {engine && (
            <DashboardCard as="div" hover={false} className="p-6">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-black/45 mb-4">
                Engine analysis
              </p>
              <EngineLensCard lens={engine.lens} />
              <EngineRootPatterns patterns={engine.rootPatterns} />
              <EngineSystemsGrid systems={engine.systems} />
            </DashboardCard>
          )}

          {keyAreas.length > 0 && (
            <DashboardCard as="div" hover={false} className="p-5">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
                What&apos;s influencing your patterns
              </p>
              <div className="space-y-3">
                {keyAreas.slice(0, 3).map((ka) =>
                  ka.whatInfluencesThis ? (
                    <div
                      key={ka.area}
                      className="border-t border-black/[0.06] pt-3 first:border-0 first:pt-0"
                    >
                      <p className="text-[12px] font-semibold text-black/55 mb-1">
                        {AREA_LABELS[ka.area] ?? ka.title}
                      </p>
                      <p className="text-[13px] leading-relaxed text-black/65">
                        {ka.whatInfluencesThis}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </DashboardCard>
          )}
        </aside>
      </div>
    </section>
  );
}

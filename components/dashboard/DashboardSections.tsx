"use client";

import type { DashboardVM } from "@/types/dashboard";

function SectionShell({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="dashboard-section border-t border-black/5 first:border-t-0">
      <div className="dashboard-frame">
        <h2 className="dashboard-reading-col text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
          {title}
        </h2>
        <div className="dashboard-reading-col mt-4 text-base leading-relaxed text-[var(--text-secondary)] md:mt-6 md:text-lg">
          {children}
        </div>
      </div>
    </section>
  );
}

export function LensSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="lens" title="Lens">
      <p className="font-medium text-[var(--text-primary)]">{vm.lens.title}</p>
      <p className="mt-2">{vm.lens.oneLine}</p>
    </SectionShell>
  );
}

export function SystemsSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="systems" title="Systems">
      <ul className="list-inside list-disc space-y-1">
        {vm.systems.map((s) => (
          <li key={s.id}>{s.label}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function ClustersSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="clusters" title="Clusters">
      <ul className="list-inside list-disc space-y-1">
        {vm.clusters.map((c) => (
          <li key={c.id}>{c.label}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function MonitoringAreasSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="monitoring" title="Monitoring areas">
      <ul className="list-inside list-disc space-y-1">
        {vm.monitoringAreas.map((m) => (
          <li key={m.id}>{m.label}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function KnowledgeCardsSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="knowledge" title="Article recommendations">
      <ul className="list-inside list-disc space-y-1">
        {vm.knowledgeCards.map((k) => (
          <li key={k.id}>{k.title}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function LabsSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="labs" title="Labs">
      <ul className="list-inside list-disc space-y-1">
        {vm.labs.map((l) => (
          <li key={l.id}>{l.name}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function PrioritiesSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="priorities" title="Priorities">
      <ol className="list-inside list-decimal space-y-1">
        {vm.priorities.map((p) => (
          <li key={p.id}>{p.label}: {p.focus}</li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function TrackingSignalsSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="signals" title="Tracking signals">
      <ul className="list-inside list-disc space-y-1">
        {vm.trackingSignals.map((s) => (
          <li key={s.id}>{s.label}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function RootPatternsSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="root-patterns" title="Root patterns">
      <ul className="list-inside list-disc space-y-1">
        {vm.rootPatterns.map((r) => (
          <li key={r.id}>{r.title}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

export function WeeklyInsightsSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="weekly-insights" title="Weekly insights">
      {vm.weeklyInsights.map((w) => (
        <div key={w.id} className="mb-4">
          <p className="font-medium text-[var(--text-primary)]">
            {w.title} {w.weekLabel && `· ${w.weekLabel}`}
          </p>
          <ul className="mt-1 list-inside list-disc text-[var(--text-secondary)]">
            {w.noticed.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <p className="mt-2">{w.interpretation}</p>
        </div>
      ))}
    </SectionShell>
  );
}

export function TracesSection({ vm }: { vm: DashboardVM }) {
  return (
    <SectionShell id="traces" title="Reasoning traces">
      <ul className="list-inside list-disc space-y-1">
        {vm.traces.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </SectionShell>
  );
}

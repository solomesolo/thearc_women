"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageFrame } from "@/components/layout/PageFrame";
import { Section } from "@/components/layout/Section";
import { EvidencePill } from "@/components/system2/EvidencePill";
import { Tabs } from "@/components/system2/Tabs";
import { Stepper } from "@/components/system2/Stepper";
import { ReasoningTraceDrawer } from "@/components/system2/ReasoningTraceDrawer";
import { SystemMap2 } from "@/components/system2/SystemMap2";
import { ProofPillsWithPanel } from "@/components/system2/ProofPillsWithPanel";
import { TimelineWithDetailRail } from "@/components/system2/TimelineWithDetailRail";
import { SystemCTA } from "@/components/system2/SystemCTA";
import {
  DOMAINS,
  TRACES,
  SIGNALS,
  EDGES,
  INSIGHTS,
  PIPELINE_STEPS,
  HEALTH_MEMORY_MONTHS,
  WEEKLY_BRIEF,
  EVIDENCE_LEVELS,
  SYSTEM2_HERO,
  SYSTEM2_CTA,
  type ReasoningTrace,
  type WeeklyBriefTab,
} from "@/content/systemPageData";
import {
  systemTraceOpened,
  systemDomainSelected,
  systemSignalSelected,
  systemEdgeSelected,
  systemWeeklyTabChanged,
} from "@/lib/analyticsSystem2";

const SIGNAL_CATEGORIES: { id: SignalCategory; label: string }[] = [
  { id: "wearables", label: "Wearables" },
  { id: "symptoms", label: "Symptoms" },
  { id: "cycle", label: "Cycle" },
  { id: "labs", label: "Labs" },
];

type SignalCategory = "wearables" | "symptoms" | "cycle" | "labs";

const WEEKLY_TABS: { id: WeeklyBriefTab; label: string }[] = [
  { id: "patterns", label: "Patterns" },
  { id: "interactions", label: "System interactions" },
  { id: "research", label: "Research insight" },
];

function useTraceFromUrl(): [ReasoningTrace | null, (id: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const traceId = searchParams.get("trace");

  const trace = useMemo(
    () => (traceId ? TRACES.find((t) => t.id === traceId) ?? null : null),
    [traceId]
  );

  const setTrace = useCallback(
    (id: string | null) => {
      const url = id ? `${pathname}?trace=${id}` : pathname;
      if (id) router.push(url);
      else router.push(pathname);
    },
    [pathname, router]
  );

  return [trace, setTrace];
}

function getNodeInsight(domainId: string): { sentence: string; signals: string[]; traceId: string } | null {
  const domain = DOMAINS.find((d) => d.id === domainId);
  if (!domain?.traceId) return null;
  const t = TRACES.find((tr) => tr.id === domain.traceId);
  if (!t) return null;
  return {
    sentence: t.interpretation,
    signals: t.signals.slice(0, 3),
    traceId: t.id,
  };
}

function System2PageContent() {
  const [trace, setTrace] = useTraceFromUrl();
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [pipelineStep, setPipelineStep] = useState(PIPELINE_STEPS[0].id);
  const [signalCategory, setSignalCategory] = useState<SignalCategory>("wearables");
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ a: string; b: string } | null>(null);
  const [weeklyTab, setWeeklyTab] = useState<WeeklyBriefTab>("patterns");
  const [evidenceLevel, setEvidenceLevel] = useState<string>(EVIDENCE_LEVELS[0].id);

  const openTrace = useCallback(
    (id: string, sourceSection?: string, sourceElement?: string) => {
      setTrace(id);
      systemTraceOpened(id, sourceSection ?? "unknown", sourceElement);
    },
    [setTrace]
  );

  const closeDrawer = useCallback(() => {
    setTrace(null);
    setSelectedNode(null);
  }, [setTrace]);

  const filteredSignals = useMemo(
    () => SIGNALS.filter((s) => s.category === signalCategory),
    [signalCategory]
  );

  const selectedSignal = useMemo(
    () => (selectedSignalId ? SIGNALS.find((s) => s.id === selectedSignalId) : null),
    [selectedSignalId]
  );


  const connections: [string, string][] = useMemo(
    () => EDGES.map((e) => [e.domainA, e.domainB]),
    []
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PageFrame variant="standard">
        {/* 1) Hero */}
        <Section noPadding divider={false}>
          <div className="py-12 md:py-20">
            <div className="grid grid-cols-12 gap-8 md:gap-12 items-start">
              <div className="col-span-12 lg:col-span-6">
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
                  {SYSTEM2_HERO.h1}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-black/70 md:text-lg">
                  {SYSTEM2_HERO.lead}
                </p>
                <div className="mt-6">
                  <ProofPillsWithPanel
                    items={SYSTEM2_HERO.proofPanels}
                    selectedDomainId={selectedDomainId}
                    onSelect={setSelectedDomainId}
                    onOpenTrace={(id) => openTrace(id, "hero", "proof-panel")}
                    microLabel={SYSTEM2_HERO.proofLabel}
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-6">
                <SystemMap2
                  domains={DOMAINS}
                  connections={connections}
                  getNodeInsight={getNodeInsight}
                  selectedNodeId={selectedNode}
                  onNodeHover={() => {}}
                  onNodeClick={(id) => {
                    setSelectedNode(id);
                    systemDomainSelected(id);
                    const d = DOMAINS.find((x) => x.id === id);
                    if (d?.traceId) openTrace(d.traceId, "hero", "system-map");
                  }}
                  onOpenTrace={(id) => openTrace(id, "hero", "insight-card")}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* 2) How Arc Thinks */}
        <Section id="reasoning-pipeline" title="How Arc Thinks" subtitle="A 4-step pipeline from signals to awareness.">
          <Stepper
            steps={PIPELINE_STEPS}
            activeId={pipelineStep}
            onStepChange={setPipelineStep}
            onExampleTrace={(id) => openTrace(id, "reasoning-pipeline", "example")}
          />
        </Section>

        {/* 3) Signals Explorer */}
        <Section id="signals-explorer" title="Signals Explorer" subtitle="Raw inputs and what they connect to.">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4">
              <div className="flex flex-wrap gap-1 border-b border-black/10 pb-2">
                {SIGNAL_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSignalCategory(c.id)}
                    className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium ${
                      signalCategory === c.id ? "bg-black/8 text-[var(--text-primary)]" : "text-black/60 hover:bg-black/[0.04]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <ul className="mt-4 space-y-1">
                {filteredSignals.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSignalId(selectedSignalId === s.id ? null : s.id);
                        if (selectedSignalId !== s.id) systemSignalSelected(s.id);
                      }}
                      className={`w-full text-left rounded-lg px-3 py-2 text-sm min-h-[44px] ${
                        selectedSignalId === s.id ? "bg-black/8 text-[var(--text-primary)]" : "text-black/80 hover:bg-black/[0.04]"
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-12 md:col-span-8">
              <AnimatePresence mode="wait">
                {selectedSignal ? (
                  <motion.div
                    key={selectedSignal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/30 p-5"
                  >
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{selectedSignal.label}</h3>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-black/50">What it is</p>
                    <p className="mt-1 text-sm text-black/80">{selectedSignal.whatItIs}</p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">What it can connect to</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedSignal.connectedDomains.map((d) => (
                        <span key={d} className="rounded-md border border-black/10 px-2 py-0.5 text-xs text-black/75">{d}</span>
                      ))}
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">Common patterns</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-black/80">
                      {selectedSignal.patterns.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                    {selectedSignal.traceId && (
                      <button
                        type="button"
                        onClick={() => openTrace(selectedSignal.traceId!, "signals-explorer", "show-reasoning")}
                        className="mt-4 text-sm font-medium text-[var(--text-primary)] hover:underline"
                      >
                        Show reasoning
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-black/45"
                  >
                    Select a signal
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Section>

        {/* 4) System Interactions */}
        <Section id="interactions" title="System Interactions" subtitle="Click a connection to see why it matters.">
          <SystemInteractionsExplorer
            edges={EDGES}
            insights={INSIGHTS}
            selectedEdge={selectedEdge}
            onSelectEdge={(e) => {
              setSelectedEdge(e);
              if (e) systemEdgeSelected(`${e.a}-${e.b}`);
            }}
            onOpenTrace={(id) => openTrace(id, "interactions", "show-reasoning")}
          />
        </Section>

        {/* 5) Health Memory Timeline */}
        <Section id="health-memory" title="Health Memory Timeline" subtitle="Patterns require time.">
          <TimelineWithDetailRail
            months={HEALTH_MEMORY_MONTHS}
            selectedIndex={selectedMonthIndex}
            onSelectIndex={setSelectedMonthIndex}
            onOpenTrace={(id) => openTrace(id, "health-memory", "month-card")}
          />
        </Section>

        {/* 6) Weekly Brief Preview */}
        <Section id="weekly-brief" title="Weekly Brief Preview">
          <Tabs
            tabs={WEEKLY_TABS}
            activeId={weeklyTab}
            onChange={(id) => {
              setWeeklyTab(id);
              systemWeeklyTabChanged(id);
            }}
          >
            {(activeId) => {
              const content = WEEKLY_BRIEF[activeId];
              return (
                <div className="rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/30 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-black/50">This week we noticed</p>
                  <ul className="mt-2 space-y-1 text-sm text-black/80">
                    {content.noticed.map((n, i) => (
                      <li key={i}>• {n}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">Interpretation</p>
                  <p className="mt-1 text-sm text-black/80">{content.interpretation}</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">What to watch next</p>
                  <ul className="mt-1 space-y-1 text-sm text-black/80">
                    {content.watchNext.map((w, i) => (
                      <li key={i}>
                        • {w}
                        {content.traceIds?.[i] && (
                          <button
                            type="button"
                            onClick={() => openTrace(content.traceIds![i], "weekly-brief", "why")}
                            className="ml-2 text-xs text-[var(--text-primary)] hover:underline"
                            aria-label="Why?"
                          >
                            why?
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }}
          </Tabs>
        </Section>

        {/* 7) Evidence & Transparency */}
        <Section id="evidence" title="Evidence & Transparency">
          <div className="flex flex-wrap gap-2 border-b border-black/10 pb-4">
            {EVIDENCE_LEVELS.map((lev) => (
              <button
                key={lev.id}
                type="button"
                onClick={() => setEvidenceLevel(lev.id)}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium ${
                  evidenceLevel === lev.id ? "bg-black/8 text-[var(--text-primary)]" : "text-black/60 hover:bg-black/[0.04]"
                }`}
              >
                {lev.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {EVIDENCE_LEVELS.filter((l) => l.id === evidenceLevel).map((lev) => (
              <motion.div
                key={lev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-6"
              >
                <p className="text-base text-black/80">{lev.definition}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-black/50">What we include here</p>
                <ul className="mt-1 space-y-0.5 text-sm text-black/80">
                  {lev.whatWeInclude.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-black/80">Example: {lev.exampleInsight}</p>
                <button
                  type="button"
                  onClick={() => openTrace(lev.exampleTraceId, "evidence", "show-reasoning")}
                  className="mt-3 text-sm font-medium text-[var(--text-primary)] hover:underline"
                >
                  Show reasoning
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </Section>

        {/* 8) Final CTA */}
        <Section id="cta" divider className="py-20 md:py-24">
          <SystemCTA data={SYSTEM2_CTA} />
        </Section>
      </PageFrame>

      <AnimatePresence>
        {trace && (
          <ReasoningTraceDrawer trace={trace} onClose={closeDrawer} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function System2Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <System2PageContent />
    </Suspense>
  );
}

const EDGE_POSITIONS: Record<string, { x: number; y: number }> = {
  Hormones: { x: 50, y: 12 },
  Metabolism: { x: 82, y: 32 },
  Stress: { x: 18, y: 50 },
  Sleep: { x: 50, y: 88 },
  Recovery: { x: 82, y: 68 },
  Biomarkers: { x: 18, y: 28 },
};

function SystemInteractionsExplorer({
  edges,
  insights,
  selectedEdge,
  onSelectEdge,
  onOpenTrace,
}: {
  edges: typeof EDGES;
  insights: typeof INSIGHTS;
  selectedEdge: { a: string; b: string } | null;
  onSelectEdge: (e: { a: string; b: string } | null) => void;
  onOpenTrace: (id: string) => void;
}) {
  const getInsight = (a: string, b: string) => {
    const edge = edges.find(
      (e) =>
        (e.domainA === a && e.domainB === b) || (e.domainA === b && e.domainB === a)
    );
    return edge ? insights.find((i) => i.id === edge.insightId) ?? null : null;
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-7">
        <div className="relative aspect-square max-w-md w-full">
          <svg viewBox="0 0 100 100" className="h-full w-full" style={{ overflow: "visible" }}>
            {edges.map((e) => {
              const pa = EDGE_POSITIONS[e.domainA];
              const pb = EDGE_POSITIONS[e.domainB];
              if (!pa || !pb) return null;
              const midX = (pa.x + pb.x) / 2;
              const midY = (pa.y + pb.y) / 2;
              const isSelected =
                selectedEdge &&
                ((selectedEdge.a === e.domainA && selectedEdge.b === e.domainB) ||
                  (selectedEdge.a === e.domainB && selectedEdge.b === e.domainA));
              return (
                <g key={`${e.domainA}-${e.domainB}`}>
                  <line
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke="var(--text-primary)"
                    strokeOpacity={isSelected ? 0.5 : 0.15}
                    strokeWidth={isSelected ? 1.2 : 0.5}
                  />
                  <line
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke="transparent"
                    strokeWidth={12}
                    onClick={() => onSelectEdge(isSelected ? null : { a: e.domainA, b: e.domainB })}
                    style={{ cursor: "pointer" }}
                  />
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    fontSize="2"
                    fill="var(--text-primary)"
                    fillOpacity={0.5}
                  >
                    ↔
                  </text>
                </g>
              );
            })}
            {DOMAINS.map((d) => {
              const pos = EDGE_POSITIONS[d.id];
              if (!pos) return null;
              return (
                <g key={d.id}>
                  <circle cx={pos.x} cy={pos.y} r="6" fill="var(--background)" stroke="var(--text-primary)" strokeOpacity="0.3" />
                  <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize="2.6" fill="var(--text-primary)" fontWeight="500">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="col-span-12 md:col-span-5">
        <AnimatePresence mode="wait">
          {selectedEdge ? (
            (() => {
              const ins = getInsight(selectedEdge.a, selectedEdge.b);
              if (!ins) return null;
              return (
                <motion.div
                  key={`${selectedEdge.a}-${selectedEdge.b}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-black/[0.06] bg-[var(--color-surface)]/30 p-5"
                >
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{ins.title}</h3>
                  <p className="mt-2 text-sm text-black/80">{ins.sentence}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ins.signalTags.map((s, i) => (
                      <span key={i} className="rounded-md border border-black/10 px-2 py-0.5 text-xs text-black/75">{s}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenTrace(ins.traceId)}
                    className="mt-4 text-sm font-medium text-[var(--text-primary)] hover:underline"
                  >
                    Show reasoning
                  </button>
                </motion.div>
              );
            })()
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-black/10 text-sm text-black/45"
            >
              Click a connection (edge) on the graph
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

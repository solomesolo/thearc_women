"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { DashboardCard } from "./DashboardCard";
import { DashboardToast } from "./DashboardToast";
import {
  StrategyDetailDrawer,
  type StrategyDetail,
} from "./StrategyDetailDrawer";

type Category = "Sleep" | "Stress" | "Recovery" | "Hormones" | "Nutrition" | "Cycle support";

type Strategy = {
  id: string;
  title: string;
  category: Category;
};

const CATEGORIES: Category[] = [
  "Sleep",
  "Stress",
  "Recovery",
  "Hormones",
  "Nutrition",
  "Cycle support",
];

const STRATEGIES: Strategy[] = [
  { id: "sleep-rhythm", title: "Build a more consistent sleep rhythm", category: "Sleep" },
  { id: "recovery-dips", title: "Reduce recovery dips during high-stress weeks", category: "Recovery" },
  { id: "cycle-energy", title: "Support energy through your cycle", category: "Cycle support" },
  { id: "nutrition-recovery", title: "Nutrition habits that support recovery", category: "Nutrition" },
];

const DETAILS: Record<string, StrategyDetail> = {
  "sleep-rhythm": {
    id: "sleep-rhythm",
    title: "Build a more consistent sleep rhythm",
    relevanceLine:
      "Especially helpful for you because sleep variability may be affecting recovery and next-day energy.",
    tags: ["Sleep", "Recovery"],
    why: [
      "Your sleep timing appears less consistent than usual",
      "Recovery tends to drop when sleep becomes less predictable",
      "This is one of the clearest ways to improve energy without doing more",
    ],
    tryThisWeek: [
      "Keep sleep and wake times within a similar range each day",
      "Start winding down earlier on high-stress evenings",
      "Protect one or two nights this week for full recovery",
    ],
    mayImprove: ["More stable energy", "Better recovery", "Less sleep-related stress"],
    trackSignals: ["Sleep consistency", "Recovery / HRV", "Morning energy"],
    lookDeeper:
      "If sleep remains disrupted for several weeks, it may be worth reviewing with your doctor.",
    relatedIds: ["recovery-dips", "cycle-energy"],
  },
  "recovery-dips": {
    id: "recovery-dips",
    title: "Reduce recovery dips during high-stress weeks",
    relevanceLine:
      "This may help because your stress patterns appear to be affecting recovery and energy.",
    tags: ["Recovery", "Stress"],
    why: [
      "Recovery tends to dip when stress load builds up",
      "Lower recovery may be contributing to fatigue and slower bounce-back",
      "Small changes during busy weeks can prevent a bigger crash later",
    ],
    tryThisWeek: [
      "Reduce intensity on your highest-stress day",
      "Add a short recovery block during the afternoon or evening",
      "Prioritize sleep over extra productivity when you feel depleted",
    ],
    mayImprove: ["More resilient recovery", "Fewer energy crashes", "Better stress tolerance"],
    trackSignals: ["Recovery / HRV", "Resting heart rate", "Stress load", "Energy"],
    lookDeeper:
      "If fatigue keeps building even after recovery-focused changes, it may be helpful to discuss it during your next check-up.",
    relatedIds: ["sleep-rhythm", "nutrition-recovery"],
  },
  "cycle-energy": {
    id: "cycle-energy",
    title: "Support energy through your cycle",
    relevanceLine:
      "This may help because your energy appears to shift with your cycle phase rather than randomly.",
    tags: ["Hormones", "Metabolism"],
    why: [
      "Your recent patterns suggest energy may be lower in this phase",
      "Recognizing cycle-linked changes can make your week feel more manageable",
      "This can help you plan with your body instead of against it",
    ],
    tryThisWeek: [
      "Plan demanding tasks for stronger-energy days when possible",
      "Protect more recovery time in lower-energy phases",
      "Track when energy dips feel typical versus unusual",
    ],
    mayImprove: ["Less frustration with energy changes", "Better planning", "More consistent wellbeing across the month"],
    trackSignals: ["Energy", "Cycle symptoms", "Sleep consistency", "Stress load"],
    lookDeeper:
      "If energy changes become stronger, more disruptive, or less predictable, it may help to prepare questions for your doctor.",
    relatedIds: ["sleep-rhythm", "nutrition-recovery"],
  },
  "nutrition-recovery": {
    id: "nutrition-recovery",
    title: "Nutrition habits that support recovery",
    relevanceLine:
      "This may help because recovery is often influenced by both stress load and how consistently you refuel.",
    tags: ["Nutrition", "Recovery"],
    why: [
      "Irregular eating patterns can make energy and recovery less stable",
      "Recovery often improves when nutrition is more consistent",
      "This strategy can support the work you’re already doing around sleep and stress",
    ],
    tryThisWeek: [
      "Avoid long gaps without eating on demanding days",
      "Prioritize a balanced recovery meal after harder days",
      "Notice whether under-fueling worsens fatigue",
    ],
    mayImprove: ["More stable energy", "Better recovery", "Less depletion after stressful days"],
    trackSignals: ["Energy", "Recovery / HRV", "Appetite patterns"],
    lookDeeper:
      "If fatigue continues despite sleep, recovery, and nutrition changes, it may be worth exploring labs like ferritin or vitamin D with your doctor.",
    relatedIds: ["recovery-dips", "cycle-energy"],
  },
};

export function PreventiveStrategiesToExplore() {
  const [active, setActive] = useState<Category | "All">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null);
  const [trackedSignals, setTrackedSignals] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<{ open: boolean; msg: string }>(() => ({
    open: false,
    msg: "",
  }));

  const filtered = useMemo(() => {
    if (active === "All") return STRATEGIES;
    return STRATEGIES.filter((s) => s.category === active);
  }, [active]);

  const detail = selectedId ? DETAILS[selectedId] ?? null : null;
  const openStrategy = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="preventive-explore-heading">
      <h2 id="preventive-explore-heading" className="text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
        Preventive strategies to explore
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        Explore strategies that match your current signals and goals.
      </p>

      <div className="mt-4 rounded-[18px] border border-black/[0.08] bg-black/[0.01] p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Filters
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive("All")}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2",
              active === "All"
                ? "border-black/[0.16] bg-black/[0.04] text-black/85"
                : "border-black/[0.10] bg-black/[0.02] text-black/65 hover:bg-black/[0.04]"
            )}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2",
                active === c
                  ? "border-black/[0.16] bg-black/[0.04] text-black/85"
                  : "border-black/[0.10] bg-black/[0.02] text-black/65 hover:bg-black/[0.04]"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-[grid-template-columns] duration-200">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openStrategy(s.id)}
            className="text-left"
          >
            <DashboardCard
              hover={true}
              className={clsx(
                "group relative h-full p-6 transition",
                currentFocusId === s.id && "border-black/[0.14] bg-black/[0.01]"
              )}
            >
              {currentFocusId === s.id ? (
                <span className="absolute right-5 top-5 rounded-full border border-black/[0.10] bg-black/[0.02] px-2.5 py-1 text-[11px] font-semibold text-black/70">
                  Current focus
                </span>
              ) : null}
              <p className="text-[15px] font-semibold text-[var(--text-primary)] group-hover:text-black">
                {s.title}
              </p>
              <p className="mt-3 hidden text-[13px] text-black/60 md:block">
                See why this may help now
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-black/55">{s.category}</span>
                <span className="text-black/35 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </div>
            </DashboardCard>
          </button>
        ))}
      </div>

      <StrategyDetailDrawer
        open={drawerOpen}
        detail={detail}
        relatedLookup={(id) => {
          const x = STRATEGIES.find((s) => s.id === id);
          return x ? { id: x.id, title: x.title } : null;
        }}
        currentFocusId={currentFocusId}
        onClose={() => setDrawerOpen(false)}
        onOpenRelated={(id) => setSelectedId(id)}
        onUseAsFocus={() => {
          if (!detail) return;
          setCurrentFocusId(detail.id);
          setToast({ open: true, msg: "Added to your current focus" });
        }}
        onAddTracking={() => {
          if (!detail) return;
          setTrackedSignals((prev) => {
            const next = new Set(prev);
            for (const s of detail.trackSignals) next.add(s);
            return next;
          });
          setToast({ open: true, msg: "Recommended signals added to tracking" });
        }}
        onPrepareDoctor={() => {
          setToast({ open: true, msg: "Doctor prep flow coming next" });
        }}
      />

      <DashboardToast
        open={toast.open}
        message={toast.msg}
        onClose={() => setToast({ open: false, msg: "" })}
      />
    </section>
  );
}


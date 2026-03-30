"use client";

import type { DashboardKeyArea, DashboardSignal } from "@/lib/dashboard/types";
import { DashboardCard } from "./DashboardCard";

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

const FALLBACK_CARDS = [
  {
    title: "Recovery & HRV",
    body: "Track recovery score and HRV to understand how your body responds to stress and rest.",
    why: "Low recovery can lead to fatigue and slower progress.",
  },
  {
    title: "Sleep quality",
    body: "Sleep consistency directly affects energy, hormones, and recovery.",
    why: "Improving sleep is often the fastest way to improve overall balance.",
  },
  {
    title: "Energy & cycle",
    body: "Track energy patterns across your cycle to understand normal versus unusual changes.",
    why: "Energy fluctuations often reflect sleep, stress, and hormonal shifts.",
  },
];

type WatchCard = { title: string; body: string; why: string };

type Props = {
  keyAreas: DashboardKeyArea[];
  signals: DashboardSignal[];
};

export function WhatToWatchNow({ keyAreas, signals }: Props) {
  let cards: WatchCard[];

  if (keyAreas.length > 0 || signals.length > 0) {
    // Priority: key areas that are "worth attention" (non-stable severity), then by score
    const attentionAreas = keyAreas
      .filter((ka) => ka.severity && ka.severity !== "stable")
      .sort((a, b) => b.score - a.score);
    const stableAreas = keyAreas
      .filter((ka) => !ka.severity || ka.severity === "stable")
      .sort((a, b) => b.score - a.score);

    // Supplement with signals if needed
    const topSignals = signals
      .filter((s) => s.severity && s.severity !== "stable")
      .slice(0, 3);

    const merged: WatchCard[] = [];

    for (const ka of [...attentionAreas, ...stableAreas].slice(0, 3)) {
      merged.push({
        title: AREA_LABELS[ka.area] ?? ka.title,
        body: ka.shortBody,
        why: ka.whyItMatters ?? `Tracking ${AREA_LABELS[ka.area] ?? ka.area} helps you catch changes early.`,
      });
    }

    // Fill remaining slots from signals
    if (merged.length < 3) {
      for (const sig of topSignals) {
        if (merged.length >= 3) break;
        merged.push({
          title: sig.title,
          body: sig.interpretation ?? `This signal reflects your ${sig.domain} patterns.`,
          why: `Monitoring ${sig.title.toLowerCase()} can surface patterns before they become noticeable.`,
        });
      }
    }

    cards = merged.length > 0 ? merged : FALLBACK_CARDS;
  } else {
    cards = FALLBACK_CARDS;
  }

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="what-to-watch-heading">
      <h2 id="what-to-watch-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        What to watch now
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        These areas are worth paying attention to because they can influence how you feel before they become bigger issues.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <DashboardCard key={c.title} as="div" className="h-full p-5">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {c.title}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-black/75">
              {c.body}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-black/65">
              <span className="font-medium text-black/75">Why it matters:</span>{" "}
              {c.why}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex rounded-lg px-3 py-2 text-[13px] font-medium text-black/70 hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            >
              Track this
            </button>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}

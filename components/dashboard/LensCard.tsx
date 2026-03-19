"use client";

import { useMemo, useState } from "react";
import type { Lens as LensType, System as SystemType } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type LensCardProps = {
  lens: LensType;
  systems?: SystemType[];
  tags?: string[];
};

export function LensCard({
  lens,
  systems = [],
  tags = [],
}: LensCardProps) {
  const displayTags = tags.length > 0 ? tags : [lens.id.replace(/_/g, " ")];
  const [reasoningOpen, setReasoningOpen] = useState(false);

  type IndicatorVM = {
    title: string;
    statusLabel: string;
    explanation: string;
  };

  const indicators: IndicatorVM[] = useMemo(
    () => [
      {
        title: "Hormones",
        statusLabel: "Within expected range",
        explanation: "Patterns look stable with no strong signs of imbalance.",
      },
      {
        title: "Sleep",
        statusLabel: "Within expected range",
        explanation:
          "Frequent night waking may be affecting recovery and next-day energy.",
      },
      {
        title: "Stress",
        statusLabel: "Within expected range",
        explanation:
          "Sustained stress load may be impacting sleep and recovery.",
      },
      {
        title: "Energy",
        statusLabel: "Within expected range",
        explanation:
          "Energy fluctuations likely reflect sleep and stress patterns.",
      },
      {
        title: "Metabolism",
        statusLabel: "Within expected range",
        explanation:
          "Appetite and energy stability may vary with sleep and stress.",
      },
    ],
    []
  );

  const expectedRangeTooltip =
    "Within expected range means there are no strong disruption signals, but this area can still be improved.";

  return (
    <DashboardCard
      as="article"
      className="min-h-[460px] border-black/[0.10] p-6 md:min-h-[560px] md:p-8"
      hover={false}
    >
      <div className="flex flex-col gap-5 md:gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
              YOUR HEALTH BASELINE
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[30px]">
              You’re mostly stable, with a few areas that could improve your energy and overall balance.
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-black/70 md:text-[16px]">
              Sleep consistency and recovery look like the biggest opportunities right now.
            </p>
            <button
              type="button"
              onClick={() => setReasoningOpen((v) => !v)}
              aria-expanded={reasoningOpen}
              className="mt-3 inline-flex items-center gap-2 rounded text-[13px] font-medium text-black/60 underline-offset-2 hover:text-black/80 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
            >
              Show reasoning
              <span aria-hidden className="text-black/35">
                {reasoningOpen ? "▴" : "▾"}
              </span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-black/[0.08] bg-black/[0.02] px-2.5 py-1 text-[12px] font-medium text-black/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Key areas of your health right now
        </p>

        <div className="-mx-2 flex gap-5 overflow-x-auto px-2 pb-2">
          {indicators.map((card) => (
            <div
              key={card.title}
              className="min-w-[240px] flex-1 rounded-[16px] border border-black/[0.08] bg-black/[0.02] p-5 transition-colors hover:border-black/[0.14] hover:bg-black/[0.03]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {card.title}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-900">
                    {card.statusLabel}
                  </span>
                  <span
                    title={expectedRangeTooltip}
                    aria-label={expectedRangeTooltip}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.10] bg-[var(--background)] text-[12px] font-semibold text-black/55 hover:bg-black/[0.03]"
                  >
                    i
                  </span>
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-black/75">
                {card.explanation}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-black/5 pt-5 md:pt-6" />

        <div className="rounded-[18px] border border-black/[0.10] bg-black/[0.02] p-6 md:p-7">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            What will help you feel better fastest
          </p>
          <ol className="mt-3 space-y-2 text-[14px] leading-relaxed text-black/80">
            <li>1. 🌙 Improve sleep consistency</li>
            <li>2. 🔄 Support hormonal balance through recovery</li>
            <li>3. 🧠 Reduce overall stress load</li>
          </ol>
        </div>

        {reasoningOpen ? (
          <div className="rounded-[16px] border border-black/[0.08] bg-[var(--background)] p-5">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              Why we’re seeing this
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-black/75">
              Your responses suggest generally stable patterns across most systems.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-black/75">
              However, sleep variability and sustained stress signals are likely contributing to fluctuations in energy and recovery.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-black/75">
              These patterns are common and often improve with better sleep consistency and reduced stress load.
            </p>
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}

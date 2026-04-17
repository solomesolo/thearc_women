"use client";

import { useState } from "react";
import type { DashboardHero, DashboardKeyArea } from "@/lib/dashboard/types";
import { DashboardCard } from "./DashboardCard";
import { HealthStatusChip, type HealthStatus } from "./HealthStatusChip";

const TOOLTIP_WITHIN =
  "Within expected range means there are no strong disruption signals, but this area can still be improved.";
const TOOLTIP_ATTENTION =
  "Worth attention means this area may be influencing how you feel and is worth monitoring or improving.";

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

const KEY_LEVER_LABELS: Record<string, string> = {
  sleep_consistency: "Improve sleep consistency",
  recovery: "Prioritize recovery",
  stress_reduction: "Reduce overall stress load",
  energy_stability: "Support energy stability",
  metabolic_stability: "Support metabolic stability",
  nutrition_timing: "Optimize nutrition timing",
  cycle_alignment: "Align activity with your cycle",
  hormonal_balance: "Support hormonal balance",
  iron_support: "Support iron and energy levels",
};

function severityToStatus(severity: string | null): HealthStatus {
  if (!severity || severity === "stable") return "Within expected range";
  return "Worth attention";
}

type Props = {
  hero: DashboardHero | null;
  keyAreas: DashboardKeyArea[];
};

export function HeroHealthBaseline({ hero, keyAreas }: Props) {
  const [open, setOpen] = useState(false);

  const hasRealData = !!hero && !!hero.title;

  // Hero copy
  const heroTitle = hasRealData
    ? hero!.title
    : "You're mostly stable, with a few areas that could improve your energy and overall balance.";
  const heroSubtitle = hasRealData
    ? hero!.shortBody
    : "Sleep consistency and recovery look like the biggest opportunities right now.";
  const heroLongBody = hasRealData && hero!.longBody
    ? hero!.longBody
    : "Your responses suggest generally steady patterns across most systems. However, sleep variability and sustained stress signals are likely contributing to fluctuations in energy and recovery. These patterns are common and often improve with better sleep consistency and reduced stress load.";

  // Indicators: use real key areas when available, fall back to placeholders
  const indicators = keyAreas.length > 0
    ? keyAreas.slice(0, 6).map((ka) => ({
        title: AREA_LABELS[ka.area] ?? ka.title,
        status: severityToStatus(ka.severity) as HealthStatus,
        body: ka.shortBody,
      }))
    : [
        { title: "Hormones", status: "Within expected range" as HealthStatus, body: "Patterns look stable with no strong signs of imbalance." },
        { title: "Sleep", status: "Worth attention" as HealthStatus, body: "Frequent night waking may be affecting recovery and next-day energy." },
        { title: "Stress", status: "Worth attention" as HealthStatus, body: "Sustained stress load may be impacting sleep and recovery." },
        { title: "Energy", status: "Within expected range" as HealthStatus, body: "Energy fluctuations likely reflect sleep and stress patterns." },
        { title: "Metabolism", status: "Within expected range" as HealthStatus, body: "Appetite and energy stability may vary with sleep and stress." },
      ];

  // "What will help you feel better fastest" — key lever + top 2 key area titles
  const keyLeverLabel = hero?.keyLever
    ? (KEY_LEVER_LABELS[hero.keyLever] ?? hero.keyLever)
    : null;
  const priorities: string[] = keyLeverLabel ? [keyLeverLabel] : [];
  for (const ka of keyAreas.slice(0, 3)) {
    const label = ka.title || AREA_LABELS[ka.area];
    if (label && !priorities.includes(label)) priorities.push(label);
    if (priorities.length >= 3) break;
  }
  if (priorities.length === 0) {
    priorities.push("Improve sleep consistency", "Support hormonal balance through recovery", "Reduce overall stress load");
  }

  return (
    <section aria-label="Your health baseline">
      <DashboardCard as="article" hover={false} className="p-6">
        <div className="flex flex-col gap-5 md:gap-6">
          {/* Section label */}
          <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
            Your health baseline
          </p>

          {/* Main summary */}
          <div className="max-w-[72ch]">
            <h2 className="text-[26px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[32px]">
              {heroTitle}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-black/70 md:text-[16px]">
              {heroSubtitle}
            </p>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="mt-3 inline-flex items-center gap-2 rounded text-[13px] font-medium text-black/60 underline-offset-2 hover:text-black/80 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
            >
              Why we&apos;re seeing this
              <span aria-hidden className="text-black/35">
                {open ? "▴" : "▾"}
              </span>
            </button>
            {open ? (
              <div className="mt-4 rounded-[16px] border border-black/[0.08] bg-[var(--background)] p-5">
                <p className="text-[13px] leading-relaxed text-black/75">
                  {heroLongBody}
                </p>
              </div>
            ) : null}
          </div>

          {/* Key health indicators */}
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
              Key areas of your health right now
            </p>
            <div className="-mx-2 mt-3 flex flex-wrap gap-4 px-2">
              {indicators.map((c) => (
                <div
                  key={c.title}
                  className="min-w-[240px] flex-1 rounded-[16px] border border-black/[0.08] bg-black/[0.02] p-5 transition-colors hover:border-black/[0.14] hover:bg-black/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {c.title}
                    </p>
                    <HealthStatusChip
                      status={c.status}
                      tooltip={
                        c.status === "Within expected range"
                          ? TOOLTIP_WITHIN
                          : c.status === "Worth attention"
                            ? TOOLTIP_ATTENTION
                            : undefined
                      }
                      className="shrink-0"
                    />
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-black/75">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top priorities */}
          <div className="border-t border-black/5 pt-6">
            <div className="rounded-[18px] border border-black/[0.10] bg-black/[0.02] p-6 md:p-7">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                What will help you feel better fastest
              </p>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-black/80">
                {priorities.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DashboardCard>
    </section>
  );
}

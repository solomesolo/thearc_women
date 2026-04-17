"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { DashboardHero } from "@/lib/dashboard/types";

export function LiveHeroBaselineCard({
  hero,
  updatedAt,
}: {
  hero: DashboardHero;
  updatedAt: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DashboardCard as="section" hover={false}>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
        Your health baseline
      </p>
      <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[30px]">
        {hero.title}
      </h2>
      <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-black/75">
        {hero.shortBody}
      </p>

      {hero.longBody ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex rounded text-[13px] font-medium text-black/60 underline-offset-2 hover:text-black/80 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
            aria-expanded={open}
          >
            Why this is showing
          </button>
          {open ? (
            <div className="mt-3 rounded-[16px] border border-black/[0.08] bg-black/[0.02] p-4">
              <p className="text-[14px] leading-relaxed text-black/75">{hero.longBody}</p>
            </div>
          ) : null}
        </>
      ) : null}

      {(hero.keyLever || updatedAt) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-black/55">
          {hero.keyLever ? (
            <span className="rounded-full border border-black/[0.10] bg-black/[0.02] px-2.5 py-1 font-medium">
              Key lever: {hero.keyLever}
            </span>
          ) : null}
          {updatedAt ? <span>Last updated: {new Date(updatedAt).toLocaleString()}</span> : null}
        </div>
      )}
    </DashboardCard>
  );
}


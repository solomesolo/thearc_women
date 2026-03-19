"use client";

import { DashboardCard } from "./DashboardCard";

type Rec = {
  title: string;
  tags: string[];
};

const RECS: Rec[] = [
  {
    title: "Why sleep consistency matters more than total sleep",
    tags: ["Sleep", "Recovery"],
  },
  {
    title: "How stress can influence recovery and cycle symptoms",
    tags: ["Stress", "Recovery", "Hormones"],
  },
  {
    title: "What to expect when energy shifts across your cycle",
    tags: ["Hormones", "Metabolism"],
  },
];

export function RecommendedForYou() {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="recommended-for-you-heading">
      <h2 id="recommended-for-you-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        Recommended for you
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        Based on your current patterns, these topics may help you understand and improve what you’re seeing.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RECS.map((c) => (
          <DashboardCard key={c.title} as="div" className="h-full p-5">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">
              {c.title}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-black/[0.10] bg-black/[0.02] px-2.5 py-1 text-[12px] font-medium text-black/65"
                >
                  {t}
                </span>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}


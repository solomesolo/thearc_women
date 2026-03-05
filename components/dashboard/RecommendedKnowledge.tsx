"use client";

import Link from "next/link";
import type { KnowledgeCard } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type RecommendedKnowledgeProps = {
  cards: KnowledgeCard[];
};

export function RecommendedKnowledge({ cards }: RecommendedKnowledgeProps) {
  if (cards.length === 0) return null;

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="recommended-knowledge-heading">
      <h2 id="recommended-knowledge-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
        Recommended for you
      </h2>
      <div className="mt-4 overflow-x-auto md:overflow-visible">
        <div className="flex gap-4 pb-2 md:grid md:grid-cols-2 md:gap-6 md:pb-0 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.id} href={`/knowledge/${card.slug}`} className="block min-w-[260px] shrink-0 md:min-w-0 md:shrink">
              <DashboardCard as="div" className="h-full">
                <span className="text-[15px] font-medium text-[var(--text-primary)]">
                  {card.title}
                </span>
                <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-black/70">
                  {card.abstract}
                </p>
                <span className="mt-3 inline-block text-[14px] text-black/70 underline-offset-2 hover:underline">
                  Read
                </span>
              </DashboardCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

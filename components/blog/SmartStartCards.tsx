"use client";

import { useRouter } from "next/navigation";
import { SMART_START_CARDS } from "@/content/taxonomy";

export function SmartStartCards() {
  const router = useRouter();

  return (
    <section className="mb-10">
      <p className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
        Start with what feels most relevant
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SMART_START_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => router.push(`/blog?${card.query}`)}
            className="group rounded-[20px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-5 py-5 text-left transition-all duration-150 hover:border-[var(--text-primary)]/25 hover:bg-[var(--color-surface)]/40 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          >
            <span className="text-[1rem] font-medium leading-[1.4] text-[var(--text-primary)] group-hover:underline">
              {card.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

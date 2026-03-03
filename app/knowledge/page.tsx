"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  KNOWLEDGE_FILTERS,
  KNOWLEDGE_ARTICLES,
  type KnowledgeCategory,
} from "@/content/knowledge";
import clsx from "clsx";

export default function KnowledgePage() {
  const [filter, setFilter] = useState<KnowledgeCategory | "All">("All");
  const articles =
    filter === "All"
      ? KNOWLEDGE_ARTICLES
      : KNOWLEDGE_ARTICLES.filter((a) => a.category === filter);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Container className="py-16 md:py-24">
        {/* Top: headline + intro */}
        <div className="mx-auto max-w-[42rem] text-center">
          <h1 className="text-[1.875rem] font-medium leading-[1.2] tracking-tight md:text-[2.5rem] lg:text-[3rem]">
            Knowledge for women who think critically about their health.
          </h1>
          <p className="mt-6 text-left text-base leading-[1.65] text-[var(--text-secondary)] md:mt-8 md:text-lg md:leading-[1.7]">
            We curate emerging research and translate it into relevance.
          </p>
        </div>

        {/* Filter bar */}
        <nav
          className="mt-10 flex flex-wrap justify-center gap-2 md:mt-12"
          aria-label="Filter by category"
        >
          <button
            type="button"
            onClick={() => setFilter("All")}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]",
              filter === "All"
                ? "border-[var(--foreground)] bg-[var(--foreground)]/0.06 text-[var(--text-primary)]"
                : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/30 hover:text-[var(--text-primary)]"
            )}
          >
            All
          </button>
          {KNOWLEDGE_FILTERS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={clsx(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]",
                filter === cat
                  ? "border-[var(--foreground)] bg-[var(--foreground)]/0.06 text-[var(--text-primary)]"
                  : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/30 hover:text-[var(--text-primary)]"
              )}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Article grid: 3-col desktop, 2-col tablet, 1-col mobile */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/knowledge/${article.slug}`}
              className="group block rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-5 py-5 transition-colors hover:border-[var(--text-primary)]/20"
            >
              <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                {article.category}
              </p>
              <h2 className="mt-2 text-[1.0625rem] font-medium leading-[1.35] text-[var(--text-primary)] group-hover:underline md:text-[1.125rem]">
                {article.title}
              </h2>
              <p className="mt-2 text-sm leading-[1.55] text-[var(--text-secondary)]">
                {article.abstract}
              </p>
              {article.whyItMattersForWomen && (
                <p className="mt-2 text-xs italic text-[var(--text-secondary)]">
                  Why it matters for women: {article.whyItMattersForWomen}
                </p>
              )}
              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                {article.readTime} read · {article.date}
              </p>
            </Link>
          ))}
        </div>

        {articles.length === 0 && (
          <p className="mt-12 text-center text-[var(--text-secondary)]">
            No articles in this category yet.
          </p>
        )}
      </Container>
    </main>
  );
}

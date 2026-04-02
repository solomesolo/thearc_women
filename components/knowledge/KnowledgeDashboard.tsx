"use client";

import { useState } from "react";
import Link from "next/link";
import type { KnowledgeDashboardData } from "@/lib/knowledge/types";
import { RecentlyViewedRow } from "./RecentlyViewedRow";
import { SavedArticlesSection } from "./SavedArticlesSection";
import { CollectionsGrid } from "./CollectionsGrid";

const LOGIN_KNOWLEDGE = "/login?callbackUrl=/knowledge";

export function KnowledgeDashboard({ data }: { data: KnowledgeDashboardData }) {
  const [saved, setSaved] = useState(data.saved);
  const { isLoggedIn } = data;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {!isLoggedIn && (
        <div className="mb-8 rounded-[16px] border border-black/[0.08] bg-[#fdf8f5] px-5 py-4 md:px-6 md:py-5">
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Browse freely here. To save articles from the Knowledge Base, build collections, and see reading history across devices, sign in or create an account.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={LOGIN_KNOWLEDGE}
              className="inline-flex items-center justify-center rounded-[12px] bg-black/90 px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
            <Link
              href={LOGIN_KNOWLEDGE}
              className="inline-flex items-center justify-center rounded-[12px] border border-black/[0.12] bg-white px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:border-black/[0.2] transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="border-b border-black/[0.07] pb-6 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              My Health Dashboard
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              {isLoggedIn
                ? "Your saved articles, collections, and reading history"
                : "Save articles while reading — they appear here after you sign in"}
            </p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-[14px] border border-black/[0.09] bg-white px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:border-black/[0.16] transition-colors"
          >
            <span aria-hidden>🔍</span>
            Search Knowledge Base
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        {/* Left + center */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Recently viewed */}
          {isLoggedIn && data.recentlyViewed.length > 0 && (
            <section>
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-4">
                Recently viewed
              </h2>
              <RecentlyViewedRow articles={data.recentlyViewed} />
            </section>
          )}

          {/* Saved articles */}
          <section>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-4">
              Saved articles
            </h2>
            <SavedArticlesSection
              isLoggedIn={isLoggedIn}
              saved={saved}
              onUnsave={(articleId) =>
                setSaved((prev) => prev.filter((s) => s.articleId !== articleId))
              }
            />
          </section>

          {/* Collections */}
          <section>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-4">
              Collections
            </h2>
            <CollectionsGrid isLoggedIn={isLoggedIn} initialCollections={data.collections} />
          </section>
        </div>

        {/* Right rail — summary */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-[20px] border border-black/[0.07] bg-[#fdf8f5] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-4">
              At a glance
            </p>
            {data.saved.length > 0 ? (
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c49a6c]" aria-hidden />
                  <span className="text-[13px] text-[var(--text-secondary)]">
                    {data.saved.length} saved article{data.saved.length !== 1 ? "s" : ""}
                  </span>
                </li>
                {data.collections.length > 0 && (
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c49a6c]" aria-hidden />
                    <span className="text-[13px] text-[var(--text-secondary)]">
                      {data.collections.length} collection{data.collections.length !== 1 ? "s" : ""}
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-[13px] text-[var(--text-secondary)]">
                {isLoggedIn
                  ? "Save articles to build your personal knowledge base."
                  : "Sign in to save articles and see them here."}
              </p>
            )}

            {isLoggedIn && (
              <div className="mt-5 pt-5 border-t border-black/[0.07]">
                <Link
                  href="/plan"
                  className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)] hover:underline"
                >
                  <span aria-hidden>→</span>
                  View my health plan
                </Link>
              </div>
            )}
          </div>

          {isLoggedIn && data.unreadNotifications > 0 && (
            <Link
              href="/notifications"
              className="flex items-center justify-between rounded-[16px] border border-[#e8ddd6] bg-white px-5 py-4 hover:border-black/[0.14] transition-colors"
            >
              <span className="text-[13px] text-[var(--text-primary)]">
                {data.unreadNotifications} new notification{data.unreadNotifications !== 1 ? "s" : ""}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">
                {data.unreadNotifications}
              </span>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

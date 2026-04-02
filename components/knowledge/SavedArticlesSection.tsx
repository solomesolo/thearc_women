"use client";

import { useState } from "react";
import Link from "next/link";
import type { SavedArticleItem } from "@/lib/knowledge/types";

type Props = {
  isLoggedIn?: boolean;
  saved: SavedArticleItem[];
  onUnsave: (articleId: number) => void;
};

export function SavedArticlesSection({ isLoggedIn = true, saved, onUnsave }: Props) {
  const [removing, setRemoving] = useState<Set<number>>(new Set());

  async function handleUnsave(articleId: number) {
    setRemoving((prev) => new Set(prev).add(articleId));
    try {
      await fetch(`/api/saved-articles/${articleId}`, { method: "DELETE" });
      onUnsave(articleId);
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    }
  }

  if (saved.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-black/[0.12] px-6 py-8 text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          {isLoggedIn
            ? "No saved articles yet. Save articles while reading to find them here."
            : "Sign in to save articles. Anything you save while reading will show up here."}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {!isLoggedIn && (
            <Link
              href="/login?callbackUrl=/knowledge"
              className="text-[13px] font-semibold text-[var(--text-primary)] underline underline-offset-2"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/blog"
            className="text-[13px] font-medium text-[var(--text-primary)] underline underline-offset-2"
          >
            Browse Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-black/[0.06] rounded-[16px] border border-black/[0.07] bg-white overflow-hidden">
      {saved.map((s) => (
        <li key={s.id} className="flex items-start gap-4 px-5 py-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/blog/${s.article.slug}`}
              className="text-[14px] font-medium text-[var(--text-primary)] hover:underline underline-offset-2 line-clamp-2 no-underline"
            >
              {s.article.title}
            </Link>
            <div className="mt-1 flex items-center gap-3">
              {s.article.category && (
                <span className="text-[11px] text-black/40">{s.article.category}</span>
              )}
              {s.article.readingTimeMinutes && (
                <span className="text-[11px] text-black/35">{s.article.readingTimeMinutes} min</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleUnsave(s.articleId)}
            disabled={removing.has(s.articleId)}
            className="shrink-0 text-[11px] text-black/35 hover:text-black/60 transition-colors disabled:opacity-40 mt-0.5"
            aria-label={`Remove ${s.article.title} from saved`}
          >
            {removing.has(s.articleId) ? "…" : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  );
}

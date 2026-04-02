"use client";

import { useState } from "react";
import Link from "next/link";
import type { CollectionDetail } from "@/lib/knowledge/types";

export function CollectionDetailView({ collection }: { collection: CollectionDetail }) {
  const [articles, setArticles] = useState(collection.articles);

  async function handleRemove(articleId: number) {
    await fetch(`/api/collections/${collection.id}/articles/${articleId}`, { method: "DELETE" });
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mb-6">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-[13px] text-black/45 hover:text-black/75 transition-colors"
        >
          <span aria-hidden>←</span> My Health Dashboard
        </Link>
        <h1 className="mt-4 text-[1.5rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {collection.name}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {collection.articleCount} article{collection.articleCount !== 1 ? "s" : ""}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-black/[0.12] px-6 py-10 text-center">
          <p className="text-[13px] text-[var(--text-secondary)]">
            No articles in this collection yet. Add articles while reading.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06] rounded-[20px] border border-black/[0.07] bg-white overflow-hidden">
          {articles.map((a) => (
            <li key={a.id} className="flex items-start gap-4 px-6 py-5">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/blog/${a.slug}`}
                  className="text-[14px] font-medium text-[var(--text-primary)] hover:underline underline-offset-2 line-clamp-2 no-underline"
                >
                  {a.title}
                </Link>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--text-secondary)] line-clamp-2">
                  {a.excerpt}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {a.category && <span className="text-[11px] text-black/40">{a.category}</span>}
                  {a.readingTimeMinutes && (
                    <span className="text-[11px] text-black/35">{a.readingTimeMinutes} min</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(a.id)}
                className="shrink-0 text-[11px] text-black/35 hover:text-red-500 transition-colors mt-0.5"
                aria-label={`Remove ${a.title} from collection`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

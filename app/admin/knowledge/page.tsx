"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PipelineArticle = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  isPublished: boolean;
  evidenceLevel: string | null;
  category: string | null;
  createdAt: string | null;
  tags: { slug: string; label: string; type: string }[];
};

export default function AdminKnowledgePage() {
  const [articles, setArticles] = useState<PipelineArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchList = () => {
    setLoading(true);
    setNeedsAuth(false);
    setErrorMessage(null);
    const params = new URLSearchParams({ status: statusFilter });
    fetch(`/api/admin/knowledge?${params}`)
      .then(async (r) => {
        if (r.status === 401) {
          setNeedsAuth(true);
          return { articles: [], total: 0 };
        }
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErrorMessage((body as { message?: string }).message ?? `HTTP ${r.status}`);
          return { articles: [], total: 0 };
        }
        return body;
      })
      .then((data) => {
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((e) => {
        setErrorMessage(e instanceof Error ? e.message : "Failed to load");
        setArticles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [statusFilter]);

  async function handleApprove(id: number) {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    if (res.ok) fetchList();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-[var(--text-primary)]">
          Pipeline articles
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="pending">Need approval</option>
            <option value="approved">Approved</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        Scraper + LLM create blog articles in the same structure as the blog (Context, Why this is trending, etc.). Approve to publish on the blog.
      </p>

      {needsAuth && (
        <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-800 dark:text-amber-200">
          Sign in to see pipeline articles.{" "}
          <Link href="/login?callbackUrl=/admin/knowledge" className="underline hover:no-underline">
            Go to login
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-800 dark:text-red-200">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {statusFilter === "pending"
            ? "No articles waiting for approval."
            : "No articles."}
        </p>
      ) : (
        <ul className="space-y-4">
          {articles.map((a) => (
            <li
              key={a.id}
              className="rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--background)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="mb-2 inline-block rounded border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {!a.isPublished ? "Need approval" : "Approved"}
                  </span>
                  <h2 className="mt-1 text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                    <Link href={`/admin/articles/${a.id}`} className="no-underline hover:underline">
                      {a.title}
                    </Link>
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
                      {a.excerpt}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                    {a.evidenceLevel && ` · ${a.evidenceLevel}`}
                    {a.category && ` · ${a.category}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="text-sm text-[var(--text-primary)] underline hover:no-underline"
                  >
                    Read
                  </Link>
                  {!a.isPublished && (
                    <button
                      type="button"
                      onClick={() => handleApprove(a.id)}
                      className="rounded-[10px] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
                    >
                      Approve
                    </button>
                  )}
                  {a.isPublished && (
                    <Link
                      href={`/blog/${a.slug}`}
                      className="text-sm text-[var(--accent)] underline hover:no-underline"
                    >
                      View on blog
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {total > 0 && (
        <p className="text-xs text-[var(--text-secondary)]">
          Showing {articles.length} of {total}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  status: string;
  pillar: string | null;
  evidenceLevel: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

export function ArticleListTable() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/articles?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleAction(articleId: number, action: string) {
    const res = await fetch(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const list = await fetch(`/api/admin/articles?${params}`).then((r) => r.json());
    setArticles(list.articles ?? []);
    setTotal(list.total ?? 0);
    if (action === "duplicate") {
      const created = await res.json();
      if (created?.id) window.location.href = `/admin/articles/${created.id}`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-[var(--text-primary)]">
          Articles
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center justify-center rounded-[14px] bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--background)] no-underline hover:opacity-95"
          >
            New article
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No articles.</p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-[var(--color-border-hairline)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-hairline)] bg-[var(--color-surface)]/50">
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Title</th>
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Status</th>
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Pillar</th>
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Evidence</th>
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Updated</th>
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Published</th>
                <th className="px-4 py-3 font-medium text-[var(--text-primary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              {articles.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[var(--color-border-hairline)] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="font-medium text-[var(--text-primary)] no-underline hover:underline"
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{a.status}</td>
                  <td className="px-4 py-3">{a.pillar ?? "—"}</td>
                  <td className="px-4 py-3">{a.evidenceLevel ?? "—"}</td>
                  <td className="px-4 py-3">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {a.publishedAt
                      ? new Date(a.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAction(a.id, "duplicate")}
                        className="text-[var(--accent)] hover:underline"
                      >
                        Duplicate
                      </button>
                      {a.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => handleAction(a.id, "archive")}
                          className="text-[var(--text-secondary)] hover:underline"
                        >
                          Archive
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 && (
        <p className="text-xs text-[var(--text-secondary)]">
          Showing {articles.length} of {total}
        </p>
      )}
    </div>
  );
}

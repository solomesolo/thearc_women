"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ArticleSummary } from "@/lib/knowledge/types";

function useDebounce<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debouncedValue;
}

function ArticleResultCard({ article, privateMode }: { article: ArticleSummary; privateMode: boolean }) {
  return (
    <Link
      href={`/blog/${article.slug}${privateMode ? "?notrack=1" : ""}`}
      className="block rounded-[16px] border border-black/[0.07] bg-white px-5 py-4 hover:border-black/[0.16] transition-colors no-underline"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {article.category && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-black/35">
              {article.category}
            </span>
          )}
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-primary)] line-clamp-2">
            {article.title}
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--text-secondary)] line-clamp-2">
            {article.excerpt}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((t) => (
              <span
                key={t.slug}
                className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 text-[11px] text-black/55"
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
        {article.readingTimeMinutes && (
          <span className="shrink-0 text-[11px] text-black/35">{article.readingTimeMinutes} min</span>
        )}
      </div>
    </Link>
  );
}

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [privateMode, setPrivateMode] = useState(false);
  const [results, setResults] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const url = `/api/articles?q=${encodeURIComponent(q.trim())}&limit=20`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResults(data.articles ?? []);
        setSearched(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  // Sync query to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.replace(`/search${query.trim() ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Search header */}
      <div className="border-b border-black/[0.07] pb-5 mb-6">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)] mb-5">
          Search
        </h1>

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px]" aria-hidden>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles or topics…"
            autoFocus
            className="w-full rounded-[14px] border border-black/[0.09] bg-white py-3.5 pl-10 pr-4 text-[15px] text-[var(--text-primary)] placeholder:text-black/35 focus:outline-none focus:border-black/[0.25] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
          />
        </div>

        {/* Private mode toggle */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={privateMode}
            onClick={() => setPrivateMode((m) => !m)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              privateMode ? "bg-black/80" : "bg-black/[0.12]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                privateMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-[12px] text-black/45">
            {privateMode ? "Private browsing — views won't be saved" : "Private mode"}
          </span>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="py-8 text-center text-[13px] text-black/40">Searching…</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-black/[0.12] px-8 py-12 text-center">
          <p className="text-[14px] text-[var(--text-secondary)]">
            No articles found for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-2 text-[13px] text-black/40">Try different keywords or browse the Knowledge Base.</p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-[13px] font-medium text-[var(--text-primary)] underline underline-offset-2"
          >
            Browse Knowledge Base
          </Link>
        </div>
      )}

      {!loading && !searched && !query.trim() && (
        <div className="py-8 text-center">
          <p className="text-[14px] text-[var(--text-secondary)]">Start typing to search the Knowledge Base.</p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-[13px] text-black/45 underline underline-offset-2 hover:text-black/70 transition-colors"
          >
            Or browse the Knowledge Base →
          </Link>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[12px] text-black/40">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((a) => (
            <ArticleResultCard key={a.id} article={a} privateMode={privateMode} />
          ))}
        </div>
      )}
    </div>
  );
}

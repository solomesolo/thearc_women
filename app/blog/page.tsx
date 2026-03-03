"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FilterBar } from "@/components/blog/FilterBar";
import { ArticleCard } from "@/components/blog/ArticleCard";

type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  pillar: string | null;
  category: string | null;
  evidenceLevel: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  hasGatedContent?: boolean;
  tags: { slug: string; label: string; type: string }[];
};

type TagsByType = Record<string, { slug: string; label: string }[]>;

function buildQuery(params: URLSearchParams, overrides?: { pillar?: string; limit?: number; offset?: number }) {
  const p = new URLSearchParams(params);
  if (overrides?.pillar) p.set("pillar", overrides.pillar);
  if (overrides?.limit != null) p.set("limit", String(overrides.limit));
  if (overrides?.offset != null) p.set("offset", String(overrides.offset));
  return p.toString();
}

function BlogContent() {
  const searchParams = useSearchParams();
  const [tagsByType, setTagsByType] = useState<TagsByType>({});
  const [foundations, setFoundations] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async (query: string) => {
    const res = await fetch(`/api/articles?${query}`);
    if (!res.ok) return { articles: [], total: 0 };
    const data = await res.json();
    return { articles: data.articles ?? [], total: data.total ?? 0 };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tagsRes = await fetch("/api/tags");
      const tags = (await tagsRes.json()) as TagsByType;
      if (!cancelled) setTagsByType(tags);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const mainQuery = buildQuery(searchParams, { limit: 12 });
      const [foundationsRes, trendingRes, mainRes] = await Promise.all([
        fetchArticles(buildQuery(new URLSearchParams(), { pillar: "Foundations", limit: 4 })),
        fetchArticles(buildQuery(new URLSearchParams(), { pillar: "Trending", limit: 4 })),
        fetchArticles(mainQuery),
      ]);
      if (cancelled) return;
      setFoundations(foundationsRes.articles);
      setTrending(trendingRes.articles);
      setArticles(mainRes.articles);
      setTotal(mainRes.total);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [searchParams, fetchArticles]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Container className="py-10 md:py-14">
        <header className="mb-8">
          <h1 className="text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] lg:text-[2.75rem]">
            Knowledge for women who think critically about their health
          </h1>
          <p className="mt-4 text-base leading-[1.65] text-[var(--text-secondary)] md:text-lg">
            We curate emerging research and translate it into relevance.
          </p>
        </header>

        <FilterBar tagsByType={tagsByType} searchParams={searchParams} />

        {/* Foundations */}
        {foundations.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-medium text-[var(--text-primary)]">
                Foundations
              </h2>
              <Link
                href="/blog?pillar=Foundations"
                className="text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {foundations.map((a) => (
                <ArticleCard
                  key={a.id}
                  slug={a.slug}
                  title={a.title}
                  excerpt={a.excerpt}
                  category={a.category}
                  tags={a.tags}
                  publishedAt={a.publishedAt}
                  readingTimeMinutes={a.readingTimeMinutes}
                  evidenceLevel={a.evidenceLevel}
                  hasGatedContent={a.hasGatedContent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Science reviewed / Trending */}
        {trending.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-medium text-[var(--text-primary)]">
                Science reviewed
              </h2>
              <Link
                href="/blog?pillar=Trending"
                className="text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((a) => (
                <ArticleCard
                  key={a.id}
                  slug={a.slug}
                  title={a.title}
                  excerpt={a.excerpt}
                  category={a.category}
                  tags={a.tags}
                  publishedAt={a.publishedAt}
                  readingTimeMinutes={a.readingTimeMinutes}
                  evidenceLevel={a.evidenceLevel}
                  hasGatedContent={a.hasGatedContent}
                />
              ))}
            </div>
          </section>
        )}

        {/* All articles */}
        <section className="mt-14">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            All articles
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Loading...
            </p>
          ) : articles.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              No articles match your filters.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard
                  key={a.id}
                  slug={a.slug}
                  title={a.title}
                  excerpt={a.excerpt}
                  category={a.category}
                  tags={a.tags}
                  publishedAt={a.publishedAt}
                  readingTimeMinutes={a.readingTimeMinutes}
                  evidenceLevel={a.evidenceLevel}
                  hasGatedContent={a.hasGatedContent}
                />
              ))}
            </div>
          )}
          {total > articles.length && (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Showing {articles.length} of {total}
            </p>
          )}
        </section>
      </Container>
    </main>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogPageFallback />}>
      <BlogContent />
    </Suspense>
  );
}

function BlogPageFallback() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Container className="py-10 md:py-14">
        <header className="mb-8">
          <h1 className="text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] lg:text-[2.75rem]">
            Knowledge for women who think critically about their health
          </h1>
          <p className="mt-4 text-base leading-[1.65] text-[var(--text-secondary)] md:text-lg">
            We curate emerging research and translate it into relevance.
          </p>
        </header>
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </Container>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ArticleCard } from "@/components/blog/ArticleCard";

type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  publishedAt: string | null;
  readingTimeMinutes?: number | null;
  tags: { slug: string; label: string; type: string }[];
};

type Feed = {
  hasProfile: boolean;
  title: string;
  articles: Article[];
};

function SkeletonCard() {
  return (
    <div className="block rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-5 py-5 animate-pulse">
      <div className="h-3 w-16 rounded bg-[var(--text-secondary)]/20" />
      <div className="mt-3 h-5 w-full max-w-[90%] rounded bg-[var(--text-secondary)]/15" />
      <div className="mt-2 h-4 w-full rounded bg-[var(--text-secondary)]/10" />
      <div className="mt-2 h-4 w-3/4 rounded bg-[var(--text-secondary)]/10" />
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-14 rounded bg-[var(--text-secondary)]/10" />
        <div className="h-5 w-16 rounded bg-[var(--text-secondary)]/10" />
      </div>
      <div className="mt-3 h-3 w-20 rounded bg-[var(--text-secondary)]/10" />
    </div>
  );
}

export function KnowledgeSection() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/home/feed")
      .then((res) => {
        if (!res.ok) throw new Error("Feed failed");
        return res.json();
      })
      .then((data: Feed) => {
        setFeed(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const title = feed?.title ?? "Clarity in a world of health noise";
  const articles = feed?.articles ?? [];
  const showEmpty = !loading && !error && articles.length === 0;

  return (
    <Section id="knowledge-feed" variant="default" className="py-12 md:py-16">
      <Container>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-left text-[1.5rem] font-medium leading-[1.25] tracking-tight text-[var(--text-primary)] md:text-[1.75rem]">
            {loading ? (
              <span className="inline-block h-8 w-72 animate-pulse rounded bg-[var(--text-secondary)]/15" />
            ) : (
              title
            )}
          </h2>

          {loading && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!loading && showEmpty && (
            <p className="mt-6 text-sm text-[var(--text-secondary)]">
              No articles published yet.
            </p>
          )}

          {!loading && !showEmpty && articles.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                />
              ))}
            </div>
          )}

          {error && !loading && (
            <p className="mt-6 text-sm text-[var(--text-secondary)]">
              Could not load the feed.
            </p>
          )}

          {!loading && (
            <div className="mt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--foreground)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--foreground)]/0.06 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
              >
                Get My Personalized Health Map
                <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

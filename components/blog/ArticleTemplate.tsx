import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import { GatedSection } from "@/components/blog/GatedSection";
import { SourcesList } from "@/components/blog/SourcesList";
import { ArticleCard } from "@/components/blog/ArticleCard";

type Section = {
  sectionIndex: number;
  title: string | null;
  body: string;
  isGated: boolean;
  preview?: string;
};

type Source = {
  id?: number;
  label: string;
  url?: string | null;
  evidenceNote?: string | null;
};

type TagItem = { slug: string; label: string; type: string };

type RelatedArticle = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  publishedAt: string | null;
  readingTimeMinutes?: number | null;
  tags: TagItem[];
};

type ArticleTemplateProps = {
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  evidenceLevel: string | null;
  publishedAt: Date | null;
  readingTimeMinutes?: number | null;
  tags: TagItem[];
  sections: Section[];
  sources: Source[];
  relatedArticles: RelatedArticle[];
  isSubscriber?: boolean;
};

export function ArticleTemplate({
  slug,
  title,
  excerpt,
  category,
  evidenceLevel,
  publishedAt,
  readingTimeMinutes,
  tags,
  sections,
  sources,
  relatedArticles,
  isSubscriber = false,
}: ArticleTemplateProps) {
  const freeSections = sections.filter((s) => s.sectionIndex <= 5);
  const gatedSections = sections.filter((s) => s.sectionIndex >= 6);
  const dateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <article className="pb-16">
        <header className="border-b border-[var(--color-border-hairline)] pb-8">
          <Link
            href="/blog"
            className="text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            ← Blog
          </Link>
          {category && (
            <p className="mt-4 text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              {category}
            </p>
          )}
          <h1 className="mt-2 text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] lg:text-[2.5rem]">
            {title}
          </h1>
          <p className="mt-4 text-base leading-[1.65] text-[var(--text-secondary)]">
            {excerpt}
          </p>

          {/* Meta: evidence level, date, reading time */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            {evidenceLevel && (
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Evidence: {evidenceLevel}
              </span>
            )}
            {dateStr && (
              <span className="text-xs text-[var(--text-secondary)]">
                {dateStr}
              </span>
            )}
            {readingTimeMinutes != null && readingTimeMinutes > 0 && (
              <span className="text-xs text-[var(--text-secondary)]">
                {readingTimeMinutes} min read
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Tag key={t.slug} variant="muted">
                {t.label}
              </Tag>
            ))}
          </div>

          {/* Content map — what's free vs gated */}
          {sections.length > 0 && (
            <div className="mt-6 rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                This article includes
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-primary)]">
                {freeSections.length > 0 && (
                  <>
                    <li className="flex items-center gap-2">
                      <span aria-hidden>✅</span>
                      <span>Science explained (free)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden>✅</span>
                      <span>Common patterns & root causes (free)</span>
                    </li>
                  </>
                )}
                {gatedSections.length > 0 && !isSubscriber && (
                  <>
                    <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span aria-hidden>🔒</span>
                      <span>Personalized action protocol (subscriber)</span>
                    </li>
                    <li className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <span aria-hidden>🔒</span>
                      <span>Tracking & progress framework (subscriber)</span>
                    </li>
                  </>
                )}
                {gatedSections.length > 0 && isSubscriber && (
                  <>
                    <li className="flex items-center gap-2">
                      <span aria-hidden>✅</span>
                      <span>Action protocol</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden>✅</span>
                      <span>Tracking framework</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Section navigation (anchor list) */}
          {sections.length > 0 && (
            <nav className="mt-6" aria-label="Article sections">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                Sections
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {sections.map((s) => (
                  <li key={s.sectionIndex}>
                    <a
                      href={`#section-${s.sectionIndex}`}
                      className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
                    >
                      {s.title ?? `Section ${s.sectionIndex}`}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        {/* Sections 1–5: free */}
        <div className="mt-10 space-y-10">
          {freeSections.map((s) => (
            <section
              key={s.sectionIndex}
              id={`section-${s.sectionIndex}`}
              className="scroll-mt-24"
            >
              {s.title && (
                <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                  {s.title}
                </h2>
              )}
              <div className="mt-2 whitespace-pre-wrap text-base leading-[1.7] text-[var(--text-secondary)]">
                {s.body}
              </div>
            </section>
          ))}

          {/* Sections 6–7: gated */}
          {gatedSections.map((s) => (
            <GatedSection
              key={s.sectionIndex}
              sectionIndex={s.sectionIndex}
              title={s.title}
              body={s.body}
              isGated={s.isGated}
              preview={s.preview}
              isSubscriber={isSubscriber}
            />
          ))}
        </div>

        <div className="mt-14">
          <SourcesList sources={sources} defaultOpen={false} />
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <aside className="border-t border-[var(--color-border-hairline)] pt-10">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Related articles
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            By shared focus and tags
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.slice(0, 3).map((a) => (
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
        </aside>
      )}
    </main>
  );
}

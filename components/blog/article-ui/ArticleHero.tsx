/**
 * ArticleHero — above-the-fold two-column header for article pages.
 *
 * Desktop (≥ lg): left 7/12 (title, excerpt, meta, tags, content map)
 *                 right 5/12 (SignalSummaryCard)
 * Mobile: stacked — content top, card below
 *
 * All text content is unchanged from props — layout only.
 */
import Link from "next/link";
import { clsx } from "clsx";
import { SignalSummaryCard } from "./SignalSummaryCard";

type Section = { sectionIndex: number; title: string | null; isGated: boolean };
type TagItem = { slug: string; label: string; type: string };

type ArticleHeroProps = {
  articleId: number;
  articleSlug: string;
  title: string;
  excerpt: string;
  category: string | null;
  evidenceLevel: string | null;
  publishedAt: Date | string | null;
  readingTimeMinutes?: number | null;
  tags: TagItem[];
  sections: Section[];
  isLoggedIn: boolean;
  initialSaved: boolean;
  isSubscriber?: boolean;
};

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function EvidenceDot({ level }: { level: string | null }) {
  const color =
    level === "high-evidence"
      ? "bg-emerald-400"
      : level === "moderate-evidence"
        ? "bg-amber-400"
        : level === "emerging-evidence"
          ? "bg-sky-400"
          : "bg-black/25";
  return <span className={clsx("inline-block h-1.5 w-1.5 rounded-full", color)} />;
}

/** Friendly display label for evidence level codes */
function evidenceDisplay(level: string | null): string {
  if (!level) return "";
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Content map — what is free vs gated in this article */
function ContentMap({
  sections,
  isSubscriber,
}: {
  sections: Section[];
  isSubscriber: boolean;
}) {
  const hasGated = sections.some((s) => s.isGated);
  if (!hasGated && sections.length === 0) return null;

  return (
    <div className="rounded-[14px] border border-black/[0.07] bg-[#f8f7f5] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-2.5">
        This article includes
      </p>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2.5 text-[13px] text-black/75">
          <span className="text-emerald-500" aria-hidden>✓</span>
          Science explained
        </li>
        <li className="flex items-center gap-2.5 text-[13px] text-black/75">
          <span className="text-emerald-500" aria-hidden>✓</span>
          Common patterns &amp; root causes
        </li>
        {hasGated && !isSubscriber ? (
          <>
            <li className="flex items-center gap-2.5 text-[13px] text-black/40">
              <span aria-hidden>⟐</span>
              Personalized action protocol
              <span className="ml-auto rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-black/45">
                Members
              </span>
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-black/40">
              <span aria-hidden>⟐</span>
              Tracking &amp; progress framework
              <span className="ml-auto rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-black/45">
                Members
              </span>
            </li>
          </>
        ) : hasGated ? (
          <>
            <li className="flex items-center gap-2.5 text-[13px] text-black/75">
              <span className="text-emerald-500" aria-hidden>✓</span>
              Action protocol
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-black/75">
              <span className="text-emerald-500" aria-hidden>✓</span>
              Tracking framework
            </li>
          </>
        ) : null}
      </ul>
    </div>
  );
}

export function ArticleHero({
  articleId,
  articleSlug,
  title,
  excerpt,
  category,
  evidenceLevel,
  publishedAt,
  readingTimeMinutes,
  tags,
  sections,
  isLoggedIn,
  initialSaved,
  isSubscriber = false,
}: ArticleHeroProps) {
  const hasGated = sections.some((s) => s.isGated);
  // Show first 5 tags in hero, favour topical ones
  const displayTags = tags.slice(0, 6);

  return (
    <header className="border-b border-black/[0.07] pb-8 md:pb-10">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black/45 hover:text-black/75 transition-colors"
      >
        <span aria-hidden>←</span>
        Knowledge Base
      </Link>

      {/* Two-column grid */}
      <div className="mt-7 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        {/* ── Left: Title + meta ── */}
        <div className="lg:col-span-7">
          {/* Category badge */}
          {category && (
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full bg-[#fdf3ec] border border-[#e8cbb5] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#a06b43]">
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-[1.875rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] md:text-[2.25rem] lg:text-[2.5rem]">
            {title}
          </h1>

          {/* Excerpt / subtitle */}
          <p className="mt-4 text-[15px] leading-[1.7] text-[var(--text-secondary)] md:text-[16px]">
            {excerpt}
          </p>

          {/* Metadata row */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {evidenceLevel && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-black/55">
                <EvidenceDot level={evidenceLevel} />
                {evidenceDisplay(evidenceLevel)}
              </span>
            )}
            {publishedAt && (
              <span className="text-[12px] text-black/40">
                {formatDate(publishedAt)}
              </span>
            )}
            {readingTimeMinutes != null && readingTimeMinutes > 0 && (
              <span className="text-[12px] text-black/40">
                {readingTimeMinutes} min read
              </span>
            )}
          </div>

          {/* Topic tags */}
          {displayTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {displayTags.map((t) => (
                <span
                  key={t.slug}
                  className="inline-flex items-center rounded-full border border-black/[0.09] bg-black/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-black/60"
                >
                  {t.label}
                </span>
              ))}
              {tags.length > 6 && (
                <span className="inline-flex items-center rounded-full border border-black/[0.06] bg-transparent px-2.5 py-0.5 text-[11px] text-black/35">
                  +{tags.length - 6} more
                </span>
              )}
            </div>
          )}

          {/* Content map */}
          <div className="mt-6">
            <ContentMap sections={sections} isSubscriber={isSubscriber} />
          </div>
        </div>

        {/* ── Right: Signal summary card ── */}
        <div className="lg:col-span-5">
          <SignalSummaryCard
            articleId={articleId}
            articleSlug={articleSlug}
            evidenceLevel={evidenceLevel}
            tags={tags}
            isLoggedIn={isLoggedIn}
            initialSaved={initialSaved}
            isSubscriber={isSubscriber}
            hasGatedContent={hasGated}
          />
        </div>
      </div>
    </header>
  );
}

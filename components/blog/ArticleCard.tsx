import Link from "next/link";
import { Tag } from "@/components/ui/Tag";

type ArticleCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  tags: { slug: string; label: string; type: string }[];
  publishedAt: string | null;
  readingTimeMinutes?: number | null;
  evidenceLevel?: string | null;
  hasGatedContent?: boolean;
};

export function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  tags,
  publishedAt,
  readingTimeMinutes,
  evidenceLevel,
  hasGatedContent,
}: ArticleCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const displayTags = tags.slice(0, 3);

  return (
    <Link
      href={`/blog/${slug}`}
      className="block rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-5 py-5 transition-colors hover:border-[var(--text-primary)]/20"
    >
      <div className="flex flex-wrap items-center gap-2">
        {category && (
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {category}
          </span>
        )}
        {evidenceLevel && (
          <span className="rounded border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/50 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Evidence: {evidenceLevel}
          </span>
        )}
        {hasGatedContent && (
          <span className="text-[0.65rem] text-[var(--text-secondary)]" title="Includes subscriber-only content">
            🔒
          </span>
        )}
      </div>
      <h2 className="mt-2 text-[1.0625rem] font-medium leading-[1.35] text-[var(--text-primary)] md:text-[1.125rem]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-[1.55] text-[var(--text-secondary)]">
        {excerpt}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {displayTags.map((t) => (
          <Tag key={t.slug} variant="muted">
            {t.label}
          </Tag>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        {date && <span>{date}</span>}
        {readingTimeMinutes != null && readingTimeMinutes > 0 && (
          <span>{readingTimeMinutes} min read</span>
        )}
      </div>
    </Link>
  );
}

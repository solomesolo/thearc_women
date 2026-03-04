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
  /** Editorial: taller card, only category/title/subtext/evidence; date & tags on hover */
  variant?: "default" | "editorial";
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
  variant = "default",
}: ArticleCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const displayTags = tags.slice(0, 3);
  const isEditorial = variant === "editorial";

  return (
    <Link
      href={`/blog/${slug}`}
      className={`group block transition-colors ${
        isEditorial
          ? "rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-6 py-6 hover:border-[var(--text-primary)]/15 hover:shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
          : "rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-5 py-5 hover:border-[var(--text-primary)]/20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {category && (
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {category}
          </span>
        )}
        {evidenceLevel && (
          <span className="rounded border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/50 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {evidenceLevel}
          </span>
        )}
        {hasGatedContent && (
          <span className="text-[0.65rem] text-[var(--text-secondary)]" title="Includes subscriber-only content">
            🔒
          </span>
        )}
      </div>
      <h2 className={`font-medium leading-[1.35] text-[var(--text-primary)] ${
        isEditorial ? "mt-3 text-[1.125rem] md:text-[1.25rem]" : "mt-2 text-[1.0625rem] md:text-[1.125rem]"
      }`}>
        {title}
      </h2>
      <p className={`text-[var(--text-secondary)] ${
        isEditorial ? "mt-2 text-sm leading-[1.6]" : "mt-2 text-sm leading-[1.55]"
      }`}>
        {excerpt}
      </p>
      {!isEditorial && (
        <>
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
        </>
      )}
      {isEditorial && (
        <div className="mt-4 flex flex-wrap items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {displayTags.map((t) => (
            <Tag key={t.slug} variant="muted">
              {t.label}
            </Tag>
          ))}
          <span className="text-xs text-[var(--text-secondary)]">
            {date}
            {readingTimeMinutes != null && readingTimeMinutes > 0 && ` · ${readingTimeMinutes} min`}
          </span>
        </div>
      )}
    </Link>
  );
}

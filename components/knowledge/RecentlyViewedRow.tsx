import Link from "next/link";
import type { ArticleSummary } from "@/lib/knowledge/types";

export function RecentlyViewedRow({ articles }: { articles: ArticleSummary[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {articles.map((a) => (
        <Link
          key={a.id}
          href={`/blog/${a.slug}`}
          className="flex-shrink-0 w-[220px] rounded-[16px] border border-black/[0.07] bg-white p-4 hover:border-black/[0.14] transition-colors no-underline"
        >
          {a.category && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-black/35">
              {a.category}
            </span>
          )}
          <p className="mt-1.5 text-[13px] font-medium leading-[1.4] text-[var(--text-primary)] line-clamp-3">
            {a.title}
          </p>
          {a.readingTimeMinutes && (
            <p className="mt-2 text-[11px] text-black/35">{a.readingTimeMinutes} min read</p>
          )}
        </Link>
      ))}
    </div>
  );
}

import Link from "next/link";
import { clsx } from "clsx";
import type { CollectionWithCount } from "@/lib/knowledge/types";

const COLOR_MAP: Record<string, string> = {
  stone:  "bg-stone-300",
  rose:   "bg-rose-300",
  teal:   "bg-teal-300",
  amber:  "bg-amber-300",
  violet: "bg-violet-300",
  sky:    "bg-sky-300",
};

export function CollectionCard({ collection }: { collection: CollectionWithCount }) {
  const dotColor = COLOR_MAP[collection.colorKey] ?? COLOR_MAP.stone;

  return (
    <Link
      href={`/knowledge/collections/${collection.id}`}
      className="group flex items-center gap-3 rounded-[14px] border border-black/[0.07] bg-white px-4 py-3 hover:border-black/[0.16] transition-colors no-underline"
    >
      <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", dotColor)} aria-hidden />
      <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)] truncate">
        {collection.name}
      </span>
      <span className="shrink-0 text-[11px] text-black/35">
        {collection.articleCount}
      </span>
    </Link>
  );
}

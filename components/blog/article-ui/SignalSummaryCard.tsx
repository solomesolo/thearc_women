/**
 * SignalSummaryCard — right-column card in the article hero.
 * Shows: evidence status badge, signal chips (from tags), CTA buttons.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { InsightCard } from "./InsightCard";
import { ARTICLE_SAVE_EVENT, dispatchArticleSaved, type ArticleSaveDetail } from "@/lib/articleSaveSync";

type TagItem = { slug: string; label: string; type: string };

type SignalSummaryCardProps = {
  articleId: number;
  articleSlug: string;
  evidenceLevel: string | null;
  tags: TagItem[];
  isLoggedIn: boolean;
  initialSaved: boolean;
  isSubscriber?: boolean;
  hasGatedContent?: boolean;
};

const EVIDENCE_COLOR: Record<string, string> = {
  "high-evidence":
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "moderate-evidence":
    "bg-amber-50 text-amber-700 border-amber-200",
  "emerging-evidence":
    "bg-sky-50 text-sky-700 border-sky-200",
  "clinical-practice-based":
    "bg-violet-50 text-violet-700 border-violet-200",
  "trend-analysis":
    "bg-orange-50 text-orange-700 border-orange-200",
  "myth-busting":
    "bg-rose-50 text-rose-700 border-rose-200",
};

function evidenceLabel(level: string | null): string {
  if (!level) return "Research-reviewed";
  return level
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SIGNAL_TYPES = ["rootCause", "symptom", "bodySystem", "goal"];

function pickSignalChips(tags: TagItem[], max = 3): TagItem[] {
  const ordered: TagItem[] = [];
  for (const type of SIGNAL_TYPES) {
    ordered.push(...tags.filter((t) => t.type === type));
  }
  for (const t of tags) {
    if (!ordered.find((o) => o.slug === t.slug)) ordered.push(t);
  }
  return ordered.slice(0, max);
}

const loginCallback = (path: string) =>
  `/login?callbackUrl=${encodeURIComponent(path)}`;

export function SignalSummaryCard({
  articleId,
  articleSlug,
  evidenceLevel,
  tags,
  isLoggedIn,
  initialSaved,
  isSubscriber = false,
  hasGatedContent = false,
}: SignalSummaryCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const articlePath = pathname || `/blog/${articleSlug}`;

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    function onSynced(e: Event) {
      const ce = e as CustomEvent<ArticleSaveDetail>;
      if (ce.detail?.articleId === articleId) setSaved(ce.detail.saved);
    }
    window.addEventListener(ARTICLE_SAVE_EVENT, onSynced);
    return () => window.removeEventListener(ARTICLE_SAVE_EVENT, onSynced);
  }, [articleId]);

  async function handleSave() {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/saved-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (res.status === 401) {
        router.push(loginCallback(articlePath));
        return;
      }
      const data = await res.json();
      setSaved(data.saved);
      dispatchArticleSaved({ articleId, saved: data.saved });
    } finally {
      setSaveLoading(false);
    }
  }

  const signalChips = pickSignalChips(tags);
  const badgeClass =
    (evidenceLevel && EVIDENCE_COLOR[evidenceLevel]) ||
    "bg-[#f5f1ec] text-[#8a6a50] border-[#ddd0c6]";

  return (
    <InsightCard variant="warm" className="p-6">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-2">
          Evidence status
        </p>
        <span
          className={clsx(
            "inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold",
            badgeClass
          )}
        >
          {evidenceLabel(evidenceLevel)}
        </span>
      </div>

      {signalChips.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-black/40 mb-2">
            Key signals
          </p>
          <div className="flex flex-wrap gap-2">
            {signalChips.map((t) => (
              <span
                key={t.slug}
                className="inline-flex items-center rounded-full bg-white border border-black/[0.09] px-3 py-1 text-[12px] font-medium text-black/70"
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="my-5 border-t border-black/[0.07]" />

      <div className="flex flex-col gap-2.5">
        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saveLoading}
            className={clsx(
              "w-full inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-[13px] font-semibold transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 disabled:opacity-50",
              saved
                ? "bg-emerald-600 text-white hover:opacity-90"
                : "bg-black/90 text-white hover:opacity-85"
            )}
          >
            {saved ? "✓ Saved" : saveLoading ? "…" : "Save article"}
          </button>
        ) : (
          <Link
            href={loginCallback(articlePath)}
            className="w-full inline-flex h-11 items-center justify-center rounded-[14px] bg-black/90 px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
          >
            Save article
          </Link>
        )}

        {hasGatedContent && !isSubscriber ? (
          <button
            type="button"
            className="w-full inline-flex h-11 items-center justify-center rounded-[14px] border border-black/[0.15] bg-transparent px-5 text-[13px] font-semibold text-black/80 transition-colors hover:bg-black/[0.04] focus:outline-none"
          >
            Unlock full access
          </button>
        ) : isLoggedIn ? (
          <Link
            href="/plan"
            className="w-full inline-flex h-11 items-center justify-center rounded-[14px] border border-black/[0.12] bg-transparent px-5 text-[13px] font-medium text-black/65 transition-colors hover:bg-black/[0.04] focus:outline-none"
          >
            Add to my health plan
          </Link>
        ) : (
          <Link
            href={loginCallback("/plan")}
            className="w-full inline-flex h-11 items-center justify-center rounded-[14px] border border-black/[0.12] bg-transparent px-5 text-[13px] font-medium text-black/65 transition-colors hover:bg-black/[0.04] focus:outline-none"
          >
            Add to my health plan
          </Link>
        )}
      </div>
    </InsightCard>
  );
}

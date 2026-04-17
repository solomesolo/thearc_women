"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ARTICLE_SAVE_EVENT,
  POST_SAVE_PROTOCOL_EVENT,
  dispatchArticleSaved,
  type ArticleSaveDetail,
} from "@/lib/articleSaveSync";
import type { PlanSummary } from "@/lib/knowledge/types";
import { PostSaveProtocolModal } from "@/components/blog/PostSaveProtocolModal";

type Props = {
  articleId: number;
  articleTitle: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
};

function PlanPickerPopover({
  articleId,
  articleTitle,
  onClose,
}: {
  articleId: number;
  articleTitle: string;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function addToPlan(planId: number) {
    const protoRes = await fetch(`/api/articles/${articleId}/action-protocol`);
    const proto = await protoRes.json().catch(() => ({}));
    const items = Array.isArray(proto.items) ? proto.items : [];

    if (items.length > 0) {
      await fetch(`/api/plans/${planId}/items/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          items: items.map((i: { title: string; description: string }) => ({
            title: i.title,
            description: i.description,
            timing: "anytime",
          })),
        }),
      });
    } else {
      await fetch(`/api/plans/${planId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: articleTitle, articleId, timing: "anytime" }),
      });
    }
    setAdded((prev) => new Set(prev).add(planId));
  }

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 rounded-[16px] border border-black/[0.09] bg-white shadow-[0_8px_32px_rgba(12,12,12,0.12)] overflow-hidden">
      <div className="border-b border-black/[0.07] px-4 py-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Add to plan</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-black/35 hover:text-black/60"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="px-4 py-4 text-[13px] text-black/40">Loading plans…</div>
      ) : plans.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-[13px] text-[var(--text-secondary)]">No plans yet.</p>
          <Link
            href={`/plan/builder?sourceArticleId=${articleId}`}
            className="mt-2 inline-block text-[13px] font-medium text-[var(--text-primary)] underline underline-offset-2"
          >
            Create a plan
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[13px] text-[var(--text-primary)] truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => addToPlan(p.id)}
                disabled={added.has(p.id)}
                className="shrink-0 rounded-[8px] border border-black/[0.09] px-3 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:border-black/[0.25] transition-colors disabled:text-emerald-500 disabled:border-emerald-200"
              >
                {added.has(p.id) ? "Added ✓" : "Add"}
              </button>
            </li>
          ))}
          <li className="px-4 py-3">
            <Link
              href={`/plan/builder?sourceArticleId=${articleId}`}
              className="text-[12px] text-black/45 hover:text-black/70 transition-colors"
            >
              + Create new plan
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

type ProtocolItem = { title: string; description: string };

export function ArticleStickyBar({ articleId, articleTitle, initialSaved, isLoggedIn }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [protocolItems, setProtocolItems] = useState<ProtocolItem[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const checkProtocolAndOpen = useCallback(() => {
    fetch(`/api/articles/${articleId}/action-protocol`)
      .then((r) => r.json())
      .then((d: { items?: ProtocolItem[] }) => {
        const list = d.items ?? [];
        if (list.length === 0) return;
        setProtocolItems(list);
        setProtocolModalOpen(true);
      })
      .catch(() => {});
  }, [articleId]);

  // Track view on mount
  useEffect(() => {
    fetch("/api/article-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    }).catch(() => {});
  }, [articleId]);

  useEffect(() => {
    function onSynced(e: Event) {
      const ce = e as CustomEvent<ArticleSaveDetail>;
      if (ce.detail?.articleId === articleId) setSaved(ce.detail.saved);
    }
    window.addEventListener(ARTICLE_SAVE_EVENT, onSynced);
    return () => window.removeEventListener(ARTICLE_SAVE_EVENT, onSynced);
  }, [articleId]);

  useEffect(() => {
    function onPostSave(e: Event) {
      const ce = e as CustomEvent<{ articleId: number }>;
      if (ce.detail?.articleId !== articleId) return;
      checkProtocolAndOpen();
    }
    window.addEventListener(POST_SAVE_PROTOCOL_EVENT, onPostSave);
    return () => window.removeEventListener(POST_SAVE_PROTOCOL_EVENT, onPostSave);
  }, [articleId, checkProtocolAndOpen]);

  // Close popover on outside click
  useEffect(() => {
    if (!planOpen) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPlanOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [planOpen]);

  async function handleSave() {
    const priorSaved = saved;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/saved-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (res.status === 401) {
        const callback = pathname || `/blog`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
        return;
      }
      const data = await res.json();
      setSaved(data.saved);
      dispatchArticleSaved({ articleId, saved: data.saved });
      if (data.saved && !priorSaved && isLoggedIn) {
        checkProtocolAndOpen();
      }
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.07] bg-white/95 backdrop-blur-md px-4 py-3 print:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <p className="hidden sm:block text-[13px] text-[var(--text-secondary)] truncate max-w-xs">
          {articleTitle}
        </p>

        <div className="flex items-center gap-2 ml-auto">
          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 rounded-[12px] border px-4 py-2.5 text-[13px] font-medium transition-all ${
              saved
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-black/[0.09] bg-white text-[var(--text-primary)] hover:border-black/[0.2]"
            } disabled:opacity-50`}
          >
            {saved ? "✓ Saved" : saveLoading ? "…" : "Save"}
          </button>

          {/* Add to plan — requires account */}
          {isLoggedIn && (
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setPlanOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-[12px] border border-black/[0.09] bg-white px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:border-black/[0.2] transition-colors"
              >
                + Add to plan
              </button>
              {planOpen && (
                <PlanPickerPopover
                  articleId={articleId}
                  articleTitle={articleTitle}
                  onClose={() => setPlanOpen(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    <PostSaveProtocolModal
      open={protocolModalOpen}
      onClose={() => setProtocolModalOpen(false)}
      articleId={articleId}
      articleTitle={articleTitle}
      items={protocolItems}
    />
    </>
  );
}

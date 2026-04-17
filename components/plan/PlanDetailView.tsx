"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { PlanDetail, PlanItemRow, ActionLogRow } from "@/lib/knowledge/types";

const TIMING_ORDER = ["morning", "evening", "weekly", "anytime"];
const TIMING_LABEL: Record<string, string> = {
  morning: "Morning", evening: "Evening", weekly: "Weekly", anytime: "Any time",
};

type Props = {
  plan: PlanDetail;
  recentLogs: ActionLogRow[];
};

export function PlanDetailView({ plan: initial, recentLogs }: Props) {
  const [items, setItems] = useState(initial.items);
  const [status, setStatus] = useState(initial.status);
  const [logNote, setLogNote] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [logSaving, setLogSaving] = useState(false);

  async function toggleItem(itemId: number, current: boolean) {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, isDone: !current } : i));
    await fetch(`/api/plans/${initial.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !current }),
    });
  }

  async function toggleStatus() {
    const next = status === "active" ? "paused" : "active";
    setStatus(next);
    await fetch(`/api/plans/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  async function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logNote.trim()) return;
    setLogSaving(true);
    try {
      await fetch("/api/action-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: initial.id, note: logNote.trim() }),
      });
      setLogNote("");
      setLogOpen(false);
    } finally {
      setLogSaving(false);
    }
  }

  const grouped = TIMING_ORDER.reduce<Record<string, PlanItemRow[]>>((acc, t) => {
    const groupItems = items.filter((i) => i.timing === t);
    if (groupItems.length) acc[t] = groupItems;
    return acc;
  }, {});

  const doneCount = items.filter((i) => i.isDone).length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Back + header */}
      <Link
        href="/plan"
        className="inline-flex items-center gap-1.5 text-[13px] text-black/45 hover:text-black/75 transition-colors"
      >
        <span aria-hidden>←</span> My Health Plan
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {initial.name}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {doneCount}/{items.length} actions completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLogOpen((o) => !o)}
            className="rounded-[12px] border border-black/[0.09] px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:border-black/[0.2] transition-colors"
          >
            + Log note
          </button>
          <button
            type="button"
            onClick={toggleStatus}
            className="rounded-[12px] border border-black/[0.09] px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:border-black/[0.2] transition-colors"
          >
            {status === "active" ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mt-5 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${Math.round((doneCount / items.length) * 100)}%` }}
          />
        </div>
      )}

      {/* Log note form */}
      {logOpen && (
        <form onSubmit={submitLog} className="mt-5 rounded-[16px] border border-black/[0.09] bg-white p-4">
          <textarea
            autoFocus
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            placeholder="What did you do or notice today?"
            rows={3}
            className="w-full rounded-[10px] border border-black/[0.09] bg-[#f8f7f5] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-black/35 resize-none focus:outline-none focus:border-black/[0.25]"
          />
          <div className="mt-2.5 flex gap-2">
            <button
              type="submit"
              disabled={!logNote.trim() || logSaving}
              className="rounded-[10px] bg-black/90 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40 hover:opacity-85 transition-opacity"
            >
              {logSaving ? "Saving…" : "Save log"}
            </button>
            <button
              type="button"
              onClick={() => { setLogOpen(false); setLogNote(""); }}
              className="rounded-[10px] border border-black/[0.09] px-4 py-2 text-[12px] text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items grouped by timing */}
      <div className="mt-8 space-y-6">
        {Object.entries(grouped).map(([timing, groupItems]) => (
          <section key={timing}>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-3">
              {TIMING_LABEL[timing]}
            </h2>
            <ul className="divide-y divide-black/[0.06] rounded-[16px] border border-black/[0.07] bg-white overflow-hidden">
              {groupItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3.5 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, item.isDone)}
                    className={clsx(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      item.isDone
                        ? "border-emerald-400 bg-emerald-400 text-white"
                        : "border-black/[0.15] hover:border-black/30"
                    )}
                    aria-label={item.isDone ? "Mark undone" : "Mark done"}
                  >
                    {item.isDone && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={clsx("text-[14px] text-[var(--text-primary)]", item.isDone && "line-through opacity-50")}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{item.description}</p>
                    )}
                    {item.articleSlug && (
                      <Link
                        href={`/blog/${item.articleSlug}`}
                        className="mt-1 inline-block text-[11px] text-black/40 hover:text-black/60 underline underline-offset-2 transition-colors"
                      >
                        {item.articleTitle ?? "Source article"} →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {items.length === 0 && (
        <div className="mt-8 rounded-[16px] border border-dashed border-black/[0.12] px-8 py-10 text-center">
          <p className="text-[13px] text-[var(--text-secondary)]">No items in this plan yet.</p>
        </div>
      )}

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-3">
            Log history
          </h2>
          <ul className="space-y-2">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 rounded-[12px] border border-black/[0.07] bg-white px-4 py-3">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-black/25" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-secondary)]">{log.note}</p>
                  <p className="text-[11px] text-black/35">
                    {new Date(log.loggedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

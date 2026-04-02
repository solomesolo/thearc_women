"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlanSummary } from "@/lib/knowledge/types";

type PlanItemPayload = { title: string; description: string };

type Props = {
  open: boolean;
  onClose: () => void;
  articleId: number;
  articleTitle: string;
  items: PlanItemPayload[];
};

export function PostSaveProtocolModal({ open, onClose, articleId, articleTitle, items }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donePlanId, setDonePlanId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError(null);
    setDonePlanId(null);
    setSubmitting(false);
    const short = articleTitle.length > 48 ? `${articleTitle.slice(0, 45)}…` : articleTitle;
    setNewPlanName(`From: ${short}`);
  }, [open, articleTitle]);

  useEffect(() => {
    if (!open || step !== 2) return;
    setPlansLoading(true);
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => {
        const list: PlanSummary[] = d.plans ?? [];
        setPlans(list);
        if (list.length > 0) {
          setMode("existing");
          setSelectedPlanId(list[0]!.id);
        } else {
          setMode("new");
          setSelectedPlanId(null);
        }
      })
      .finally(() => setPlansLoading(false));
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const count = items.length;

  async function postItemsToPlan(planId: number): Promise<boolean> {
    const res = await fetch(`/api/plans/${planId}/items/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        items: items.map((i) => ({ title: i.title, description: i.description })),
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j.error as string) || "Could not add items");
      return false;
    }
    setDonePlanId(planId);
    return true;
  }

  async function handleConfirm() {
    setError(null);
    if (mode === "existing" && plans.length > 0) {
      if (selectedPlanId == null) {
        setError("Choose a plan");
        return;
      }
      setSubmitting(true);
      try {
        await postItemsToPlan(selectedPlanId);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const name = newPlanName.trim();
    if (!name) {
      setError("Enter a plan name");
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sourceType: "article_protocol" }),
      });
      if (!createRes.ok) {
        setError("Could not create plan");
        return;
      }
      const plan = (await createRes.json()) as { id: number };
      await postItemsToPlan(plan.id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-save-protocol-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[20px] border border-black/[0.08] bg-white shadow-[0_20px_60px_rgba(12,12,12,0.18)]">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <h2 id="post-save-protocol-title" className="text-[16px] font-semibold text-[var(--text-primary)]">
            Add to health plan
          </h2>
        </div>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
          {donePlanId != null ? (
            <div className="space-y-3">
              <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
                Added {count} action{count !== 1 ? "s" : ""} from this article&apos;s protocol to your plan.
              </p>
              <Link
                href={`/plan/${donePlanId}`}
                className="inline-flex w-full items-center justify-center rounded-[12px] bg-black/90 py-2.5 text-[13px] font-semibold text-white no-underline hover:opacity-90"
              >
                Open plan
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-[12px] border border-black/[0.1] py-2.5 text-[13px] font-medium text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
                This article includes an action protocol with{" "}
                <span className="font-medium text-[var(--text-primary)]">{count} key action</span>
                {count !== 1 ? "s" : ""}. Add them to your health plan so you can track them alongside your other
                goals?
              </p>
              <ul className="rounded-[12px] border border-black/[0.06] bg-[#fdf8f5] px-4 py-3 text-[12px] text-black/65 max-h-32 overflow-y-auto space-y-1">
                {items.slice(0, 8).map((it, i) => (
                  <li key={i} className="truncate">
                    • {it.title}
                  </li>
                ))}
                {items.length > 8 && <li className="text-black/40">+ {items.length - 8} more…</li>}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)]"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-[12px] bg-black/90 px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
                >
                  Yes, add to plan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-[var(--text-secondary)]">
                Choose an existing plan or create a new one. Each key action becomes its own plan item, linked to this
                article.
              </p>

              {plansLoading ? (
                <p className="text-[13px] text-black/40">Loading plans…</p>
              ) : plans.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="sr-only">Plan destination</legend>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                    <input
                      type="radio"
                      name="plan-mode"
                      checked={mode === "existing"}
                      onChange={() => setMode("existing")}
                      className="accent-black"
                    />
                    Add to existing plan
                  </label>
                  {mode === "existing" && (
                    <select
                      value={selectedPlanId ?? ""}
                      onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                      className="mt-1 w-full rounded-[12px] border border-black/[0.1] bg-white px-3 py-2.5 text-[13px]"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 pt-2 text-[13px]">
                    <input
                      type="radio"
                      name="plan-mode"
                      checked={mode === "new"}
                      onChange={() => setMode("new")}
                      className="accent-black"
                    />
                    Create a new plan
                  </label>
                </fieldset>
              ) : (
                <p className="text-[13px] text-[var(--text-secondary)]">You don&apos;t have a plan yet — name your first one below.</p>
              )}

              {(mode === "new" || plans.length === 0) && (
                <div>
                  <label htmlFor="new-plan-name" className="text-[11px] font-semibold uppercase tracking-widest text-black/40">
                    Plan name
                  </label>
                  <input
                    id="new-plan-name"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.1] px-3 py-2.5 text-[13px]"
                    placeholder="e.g. Sleep focus — March"
                  />
                </div>
              )}

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="rounded-[12px] border border-black/[0.1] px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting || (mode === "existing" && plans.length > 0 && selectedPlanId == null)}
                  className="rounded-[12px] bg-black/90 px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Adding…" : `Add ${count} action${count !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

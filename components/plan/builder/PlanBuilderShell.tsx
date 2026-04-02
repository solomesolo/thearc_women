"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Step1SourceSelection } from "./Step1SourceSelection";
import { Step2ItemBuilder } from "./Step2ItemBuilder";
import { Step3Review } from "./Step3Review";

export type PlanBuilderItem = {
  title: string;
  description: string;
  timing: string;
  articleId?: number | null;
};

export type BuilderState = {
  name: string;
  sourceType: string;
  items: PlanBuilderItem[];
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? "bg-emerald-400 w-8" : i === current ? "bg-black/90 w-8" : "bg-black/[0.1] w-5"
          }`}
        />
      ))}
      <span className="ml-2 text-[12px] text-black/40">Step {current + 1} of {total}</span>
    </div>
  );
}

export function PlanBuilderShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceArticleId = searchParams.get("sourceArticleId");

  const [step, setStep] = useState(0);
  const [step2Key, setStep2Key] = useState(0);
  const [state, setState] = useState<BuilderState>({
    name: "",
    sourceType: "manual",
    items: [],
  });
  const [saving, setSaving] = useState(false);

  function next(partial: Partial<BuilderState>) {
    setState((prev) => ({ ...prev, ...partial }));
    setStep((s) => s + 1);
  }

  async function completeStep1(data: Partial<BuilderState>) {
    let items: PlanBuilderItem[] = [];

    if (data.sourceType === "articles" && sourceArticleId) {
      const aid = Number(sourceArticleId);
      if (Number.isFinite(aid) && aid > 0) {
        try {
          const r = await fetch(`/api/articles/${aid}/action-protocol`);
          const j = await r.json();
          const parsed = (j.items ?? []) as { title: string; description: string }[];
          if (parsed.length > 0) {
            items = parsed.map((i) => ({
              title: i.title,
              description: i.description,
              timing: "anytime",
              articleId: aid,
            }));
          }
        } catch {
          /* ignore */
        }
      }
    }

    setState((prev) => ({ ...prev, ...data, items }));
    setStep2Key((k) => k + 1);
    setStep(1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const planRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name, sourceType: state.sourceType }),
      });
      const plan = await planRes.json();
      if (!planRes.ok) return;

      await Promise.all(
        state.items.map((item, idx) =>
          fetch(`/api/plans/${plan.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: item.title,
              description: item.description || undefined,
              timing: item.timing,
              sortOrder: idx,
              articleId: item.articleId ?? null,
            }),
          })
        )
      );

      router.push("/plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Create a plan
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
          Build a structured health action plan
        </p>
      </div>

      <StepIndicator current={step} total={3} />

      {step === 0 && (
        <Step1SourceSelection
          initialSourceArticleId={sourceArticleId ? Number(sourceArticleId) : null}
          onNext={completeStep1}
        />
      )}
      {step === 1 && (
        <Step2ItemBuilder
          key={step2Key}
          initialItems={state.items}
          onNext={(items) => next({ items })}
          onBack={back}
        />
      )}
      {step === 2 && (
        <Step3Review
          state={state}
          saving={saving}
          onBack={back}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";
import { runLensEngine } from "@/lib/startingLensEngine";
import type {
  CycleContext,
  LifeStage,
  TrainingVolume,
  Wearable,
} from "@/lib/startingLensEngine/types";

const STORAGE_KEY = "arc-personalization";
const MAX_GOALS = 2;
const MAX_SYMPTOMS = 2;
const MAX_CHANGES = 2;

const defaultContent = homepageContent.personalization;

type Option = { value: string; label: string };

type PersonalizationSectionProps = {
  headline?: string;
  explanation?: readonly string[];
  stepA?: string;
  stepB?: string;
  stepC?: string;
  stepD?: string;
  goals?: readonly string[];
  symptoms?: readonly string[];
  changes?: readonly string[];
  cycleContextLabel?: string;
  cycleContextOptions?: readonly Option[];
  lifeStageLabel?: string;
  lifeStageOptions?: readonly Option[];
  trainingVolumeLabel?: string;
  trainingVolumeOptions?: readonly Option[];
  wearableLabel?: string;
  wearableOptions?: readonly Option[];
  resetLabel?: string;
  ctaLabel?: string;
};

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-[10px] border px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${
        selected
          ? "border-[var(--text-primary)] bg-[var(--text-primary)]/0.06 text-[var(--text-primary)]"
          : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40 hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly Option[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-left text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value as T)}
              className={`rounded-[8px] border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${
                selected
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)]/0.08 text-[var(--text-primary)]"
                  : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PersonalizationSection({
  headline = defaultContent.headline,
  explanation = defaultContent.explanation,
  stepA = (defaultContent as { stepA?: string }).stepA ?? "Goals (max 2)",
  stepB = (defaultContent as { stepB?: string }).stepB ?? "What's showing up (max 2)",
  stepC = (defaultContent as { stepC?: string }).stepC ?? "What changed recently (max 2)",
  stepD = (defaultContent as { stepD?: string }).stepD ?? "System context (optional)",
  goals = (defaultContent as { goals?: readonly string[] }).goals ?? [],
  symptoms = (defaultContent as { symptoms?: readonly string[] }).symptoms ?? [],
  changes = (defaultContent as { changes?: readonly string[] }).changes ?? [],
  cycleContextLabel = (defaultContent as { cycleContextLabel?: string }).cycleContextLabel ?? "Cycle context",
  cycleContextOptions = (defaultContent as { cycleContextOptions?: readonly Option[] }).cycleContextOptions ?? [],
  lifeStageLabel = (defaultContent as { lifeStageLabel?: string }).lifeStageLabel ?? "Life stage",
  lifeStageOptions = (defaultContent as { lifeStageOptions?: readonly Option[] }).lifeStageOptions ?? [],
  trainingVolumeLabel = (defaultContent as { trainingVolumeLabel?: string }).trainingVolumeLabel ?? "Training volume",
  trainingVolumeOptions = (defaultContent as { trainingVolumeOptions?: readonly Option[] }).trainingVolumeOptions ?? [],
  wearableLabel = (defaultContent as { wearableLabel?: string }).wearableLabel ?? "Wearable",
  wearableOptions = (defaultContent as { wearableOptions?: readonly Option[] }).wearableOptions ?? [],
  resetLabel = defaultContent.resetLabel,
  ctaLabel = defaultContent.ctaLabel,
}: PersonalizationSectionProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [cycleContext, setCycleContext] = useState<CycleContext | undefined>();
  const [lifeStage, setLifeStage] = useState<LifeStage | undefined>();
  const [trainingVolume, setTrainingVolume] = useState<TrainingVolume | undefined>();
  const [wearable, setWearable] = useState<Wearable | undefined>();
  const [mounted, setMounted] = useState(false);

  const hasSelection =
    selectedGoals.length > 0 ||
    selectedSymptoms.length > 0 ||
    selectedChanges.length > 0;

  const input = {
    goals: selectedGoals,
    symptoms: selectedSymptoms,
    changes: selectedChanges,
    cycleContext,
    lifeStage,
    trainingVolume,
    wearable,
  };
  const output = runLensEngine(input);

  const persist = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          goals: selectedGoals,
          symptoms: selectedSymptoms,
          changes: selectedChanges,
          cycleContext: cycleContext ?? null,
          lifeStage: lifeStage ?? null,
          trainingVolume: trainingVolume ?? null,
          wearable: wearable ?? null,
        })
      );
    } catch {
      // ignore
    }
  }, [
    selectedGoals,
    selectedSymptoms,
    selectedChanges,
    cycleContext,
    lifeStage,
    trainingVolume,
    wearable,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as {
          goals?: string[];
          signals?: string[];
          symptoms?: string[];
          changes?: string[];
          cycleContext?: string | null;
          lifeStage?: string | null;
          trainingVolume?: string | null;
          wearable?: string | null;
        };
        if (Array.isArray(data.goals))
          setSelectedGoals(data.goals.slice(0, MAX_GOALS));
        if (Array.isArray(data.symptoms))
          setSelectedSymptoms(data.symptoms.slice(0, MAX_SYMPTOMS));
        else if (Array.isArray(data.signals))
          setSelectedSymptoms(data.signals.slice(0, MAX_SYMPTOMS));
        if (Array.isArray(data.changes))
          setSelectedChanges(data.changes.slice(0, MAX_CHANGES));
        if (data.cycleContext != null && typeof data.cycleContext === "string")
          setCycleContext(data.cycleContext as CycleContext);
        if (data.lifeStage != null && typeof data.lifeStage === "string")
          setLifeStage(data.lifeStage as LifeStage);
        if (data.trainingVolume != null && typeof data.trainingVolume === "string")
          setTrainingVolume(data.trainingVolume as TrainingVolume);
        if (data.wearable != null && typeof data.wearable === "string")
          setWearable(data.wearable as Wearable);
      }
    } catch {
      // ignore
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    persist();
  }, [mounted, persist]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : prev.length >= MAX_GOALS
          ? prev
          : [...prev, goal]
    );
  };
  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s)
        ? prev.filter((x) => x !== s)
        : prev.length >= MAX_SYMPTOMS
          ? prev
          : [...prev, s]
    );
  };
  const toggleChange = (c: string) => {
    setSelectedChanges((prev) =>
      prev.includes(c)
        ? prev.filter((x) => x !== c)
        : prev.length >= MAX_CHANGES
          ? prev
          : [...prev, c]
    );
  };

  const reset = () => {
    setSelectedGoals([]);
    setSelectedSymptoms([]);
    setSelectedChanges([]);
    setCycleContext(undefined);
    setLifeStage(undefined);
    setTrainingVolume(undefined);
    setWearable(undefined);
  };

  const scrollToPreview = () => {
    document
      .getElementById("personalization-preview")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Section id="personalization" variant="default" className="py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12 lg:gap-16 md:items-start">
          <div className="md:col-span-5">
            <h2 className="text-left text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] md:leading-[1.18] lg:text-[2.5rem]">
              {headline}
            </h2>
            <div className="mt-4 space-y-2">
              {(explanation ?? []).map((line, i) => (
                <p
                  key={i}
                  className="text-left text-base leading-[1.65] text-[var(--text-secondary)] md:text-lg md:leading-[1.7]"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="md:col-span-7 md:col-start-6 space-y-6">
            {/* Step A — Goals */}
            <div>
              <p className="text-left text-sm font-medium text-[var(--text-primary)] md:text-base">
                {stepA}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(goals ?? []).map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    selected={selectedGoals.includes(goal)}
                    onToggle={() => toggleGoal(goal)}
                  />
                ))}
              </div>
            </div>

            {/* Step B — Symptoms */}
            <div>
              <p className="text-left text-sm font-medium text-[var(--text-primary)] md:text-base">
                {stepB}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(symptoms ?? []).map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={selectedSymptoms.includes(s)}
                    onToggle={() => toggleSymptom(s)}
                  />
                ))}
              </div>
            </div>

            {/* Step C — Changes */}
            <div>
              <p className="text-left text-sm font-medium text-[var(--text-primary)] md:text-base">
                {stepC}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(changes ?? []).map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    selected={selectedChanges.includes(c)}
                    onToggle={() => toggleChange(c)}
                  />
                ))}
              </div>
            </div>

            {/* Step D — Context toggles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cycleContextOptions.length > 0 && (
                <ToggleGroup
                  label={cycleContextLabel}
                  value={cycleContext}
                  options={[...cycleContextOptions]}
                  onChange={(v) => setCycleContext(v as CycleContext)}
                />
              )}
              {lifeStageOptions.length > 0 && (
                <ToggleGroup
                  label={lifeStageLabel}
                  value={lifeStage}
                  options={[...lifeStageOptions]}
                  onChange={(v) => setLifeStage(v as LifeStage)}
                />
              )}
              {trainingVolumeOptions.length > 0 && (
                <ToggleGroup
                  label={trainingVolumeLabel}
                  value={trainingVolume}
                  options={[...trainingVolumeOptions]}
                  onChange={(v) => setTrainingVolume(v as TrainingVolume)}
                />
              )}
              {wearableOptions.length > 0 && (
                <ToggleGroup
                  label={wearableLabel}
                  value={wearable}
                  options={[...wearableOptions]}
                  onChange={(v) => setWearable(v as Wearable)}
                />
              )}
            </div>

            {/* Output panel */}
            <div className="mt-8 rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/50 px-5 py-5 md:px-6 md:py-6">
              <p className="text-left text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                Starting lens
              </p>
              {hasSelection ? (
                <>
                  <p className="mt-2 text-left text-[1.125rem] font-medium leading-[1.3] text-[var(--text-primary)] md:text-[1.25rem]">
                    {output.lens.title}
                  </p>
                  <p className="mt-1.5 text-left text-sm leading-[1.6] text-[var(--text-secondary)] md:text-base">
                    {output.lens.oneLine}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-left text-sm italic leading-[1.5] text-[var(--text-secondary)]">
                  Choose options above to see your starting lens.
                </p>
              )}

              {hasSelection && output.contributors.length > 0 && (
                <div className="mt-5">
                  <p className="text-left text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    Likely contributors
                  </p>
                  <ul className="mt-2 space-y-3">
                    {output.contributors.map((c) => (
                      <li key={c.id} className="text-left">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {c.confidence} confidence
                        </span>
                        <p className="mt-0.5 text-sm text-[var(--text-primary)]">
                          {c.whyThisFits}
                        </p>
                        {c.checkNext.length > 0 && (
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Check next: {c.checkNext.join("; ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasSelection && (
              <div
                id="personalization-preview"
                className="mt-6 rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-4 py-4"
              >
                <p className="text-left text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  Next 7 days
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {output.next7Days.goal}
                </p>
                <ul className="mt-3 space-y-3">
                  {output.next7Days.plan.map((block, i) => (
                    <li key={i}>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        {block.dayRange}
                      </span>
                      <p className="mt-0.5 text-sm text-[var(--text-primary)]">
                        {block.focus.join(" · ")}
                      </p>
                      <ul className="mt-1 list-inside list-disc text-xs text-[var(--text-secondary)]">
                        {block.details.map((d, j) => (
                          <li key={j}>{d}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      Without wearable
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-primary)]">
                      {output.next7Days.monitor.noWearable.join("; ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      With wearable
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-primary)]">
                      {output.next7Days.monitor.wearable.join("; ")}
                    </p>
                  </div>
                </div>
              </div>
              )}

              {hasSelection && output.predictions.length > 0 && (
                <div className="mt-5">
                  <p className="text-left text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    If… then likely
                  </p>
                  <ul className="mt-2 space-y-2">
                    {output.predictions.map((p, i) => (
                      <li key={i} className="text-sm text-[var(--text-primary)]">
                        <strong>{p.label}</strong> → {p.expected}{" "}
                        <span className="text-[var(--text-secondary)]">
                          ({p.confidence})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasSelection && (
                <p className="mt-5 text-left text-xs italic text-[var(--text-secondary)]">
                  {output.medicalSafety.escalation}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={reset}
                className="text-sm text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
              >
                {resetLabel}
              </button>
              <button
                type="button"
                onClick={scrollToPreview}
                className="rounded-[14px] border border-[var(--foreground)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--foreground)]/0.06 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

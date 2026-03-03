"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";
import { getPersonalizationOutput } from "@/lib/personalizationRules";

const STORAGE_KEY = "arc-personalization";
const MAX_GOALS = 3;
const MAX_SIGNALS = 2;

const defaultContent = homepageContent.personalization;

type PersonalizationSectionProps = {
  headline?: string;
  explanation?: readonly string[];
  goalPrompt?: string;
  signalPrompt?: string;
  goals?: readonly string[];
  signals?: readonly string[];
  resetLabel?: string;
  ctaLabel?: string;
};

export function PersonalizationSection({
  headline = defaultContent.headline,
  explanation = defaultContent.explanation,
  goalPrompt = defaultContent.goalPrompt,
  signalPrompt = defaultContent.signalPrompt,
  goals = defaultContent.goals,
  signals = defaultContent.signals,
  resetLabel = defaultContent.resetLabel,
  ctaLabel = defaultContent.ctaLabel,
}: PersonalizationSectionProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const persist = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ goals: selectedGoals, signals: selectedSignals })
      );
    } catch {
      // ignore
    }
  }, [selectedGoals, selectedSignals]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { goals?: string[]; signals?: string[] };
        if (Array.isArray(data.goals)) setSelectedGoals(data.goals.slice(0, MAX_GOALS));
        if (Array.isArray(data.signals)) setSelectedSignals(data.signals.slice(0, MAX_SIGNALS));
      }
    } catch {
      // ignore
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    persist();
  }, [mounted, selectedGoals, selectedSignals, persist]);

  const output = getPersonalizationOutput(selectedGoals, selectedSignals);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : prev.length >= MAX_GOALS ? prev : [...prev, goal]
    );
  };

  const toggleSignal = (signal: string) => {
    setSelectedSignals((prev) =>
      prev.includes(signal) ? prev.filter((s) => s !== signal) : prev.length >= MAX_SIGNALS ? prev : [...prev, signal]
    );
  };

  const reset = () => {
    setSelectedGoals([]);
    setSelectedSignals([]);
  };

  const scrollToPreview = () => {
    document.getElementById("personalization-preview")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Section id="personalization" variant="default" className="py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12 lg:gap-16 md:items-start">
          {/* Left: copy */}
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

          {/* Right: interactive */}
          <div className="md:col-span-7 md:col-start-6">
            {/* Prompt 1 */}
            <p className="text-left text-sm font-medium text-[var(--text-primary)] md:text-base">
              {goalPrompt}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Max {MAX_GOALS} selected
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(goals ?? []).map((goal) => {
                const selected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`rounded-[10px] border px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${
                      selected
                        ? "border-[var(--text-primary)] bg-[var(--text-primary)]/0.06 text-[var(--text-primary)]"
                        : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>

            {/* Prompt 2 */}
            <p className="mt-8 text-left text-sm font-medium text-[var(--text-primary)] md:text-base">
              {signalPrompt}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Max {MAX_SIGNALS} selected
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(signals ?? []).map((signal) => {
                const selected = selectedSignals.includes(signal);
                return (
                  <button
                    key={signal}
                    type="button"
                    onClick={() => toggleSignal(signal)}
                    className={`rounded-[10px] border px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] ${
                      selected
                        ? "border-[var(--text-primary)] bg-[var(--text-primary)]/0.06 text-[var(--text-primary)]"
                        : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {signal}
                  </button>
                );
              })}
            </div>

            {/* Output panel */}
            <div className="mt-8 rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/50 px-5 py-5 md:px-6 md:py-6">
              <p className="text-left text-sm font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                Starting lens
              </p>
              <p className="mt-2 text-left text-[1.125rem] font-medium leading-[1.3] text-[var(--text-primary)] md:text-[1.25rem]">
                {output.startingLensTitle}
              </p>
              <p className="mt-1.5 text-left text-sm leading-[1.6] text-[var(--text-secondary)] md:text-base">
                {output.startingLensReason}
              </p>
              <ul className="mt-4 list-none space-y-1.5 pl-0 text-left text-sm text-[var(--text-primary)] md:text-base">
                {output.threeFocusAreas.map((area, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--text-secondary)]">—</span>
                    {area}
                  </li>
                ))}
              </ul>

              <div
                id="personalization-preview"
                className="mt-6 rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-4 py-4"
              >
                <p className="text-left text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  Weekly brief preview
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      Now
                    </p>
                    <p className="mt-1 text-left text-sm text-[var(--text-primary)]">
                      {output.weeklyBriefPreview.now}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      Next
                    </p>
                    <p className="mt-1 text-left text-sm text-[var(--text-primary)]">
                      {output.weeklyBriefPreview.next}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      Preventive
                    </p>
                    <p className="mt-1 text-left text-sm text-[var(--text-primary)]">
                      {output.weeklyBriefPreview.preventive}
                    </p>
                  </div>
                </div>
              </div>
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

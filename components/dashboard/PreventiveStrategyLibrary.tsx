"use client";

import { useMemo, useState } from "react";
import type { PreventiveStrategy } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

type PreventiveStrategyLibraryProps = {
  strategies: PreventiveStrategy[];
};

type FilterKind = "lifeStage" | "symptoms" | "biomarkers";

function allLabels(strategies: PreventiveStrategy[], kind: FilterKind): string[] {
  const set = new Set<string>();
  for (const s of strategies) {
    const arr = s[kind];
    if (arr) for (const l of arr) set.add(l);
  }
  return Array.from(set).sort();
}

function matches(
  s: PreventiveStrategy,
  active: { lifeStage: string[]; symptoms: string[]; biomarkers: string[] }
): boolean {
  if (active.lifeStage.length && s.lifeStage?.length) {
    if (!active.lifeStage.some((f) => s.lifeStage!.includes(f))) return false;
  }
  if (active.symptoms.length && s.symptoms?.length) {
    if (!active.symptoms.some((f) => s.symptoms!.includes(f))) return false;
  }
  if (active.biomarkers.length && s.biomarkers?.length) {
    if (!active.biomarkers.some((f) => s.biomarkers!.includes(f))) return false;
  }
  return true;
}

export function PreventiveStrategyLibrary({
  strategies,
}: PreventiveStrategyLibraryProps) {
  const lifeStageLabels = useMemo(
    () => allLabels(strategies, "lifeStage"),
    [strategies]
  );
  const symptomLabels = useMemo(
    () => allLabels(strategies, "symptoms"),
    [strategies]
  );
  const biomarkerLabels = useMemo(
    () => allLabels(strategies, "biomarkers"),
    [strategies]
  );

  const [lifeStage, setLifeStage] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [biomarkers, setBiomarkers] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return strategies.filter((s) =>
      matches(s, {
        lifeStage,
        symptoms,
        biomarkers,
      })
    );
  }, [strategies, lifeStage, symptoms, biomarkers]);

  const toggle = (
    kind: "lifeStage" | "symptoms" | "biomarkers",
    label: string
  ) => {
    const setter =
      kind === "lifeStage"
        ? setLifeStage
        : kind === "symptoms"
          ? setSymptoms
          : setBiomarkers;
    const current =
      kind === "lifeStage"
        ? lifeStage
        : kind === "symptoms"
          ? symptoms
          : biomarkers;
    if (current.includes(label)) {
      setter(current.filter((x) => x !== label));
    } else {
      setter([...current, label]);
    }
  };

  const ChipRow = ({
    kind,
    labels,
    active,
  }: {
    kind: FilterKind;
    labels: string[];
    active: string[];
  }) => (
    <div className="flex flex-wrap gap-2">
      {labels.map((l) => {
        const isOn = active.includes(l);
        return (
          <button
            key={l}
            type="button"
            onClick={() => toggle(kind, l)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 ${
              isOn
                ? "border-black/[0.14] bg-black/[0.03] text-black/80"
                : "border-black/[0.10] bg-black/[0.02] text-black/60 hover:bg-black/[0.04]"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="strategy-library-heading">
      <h2 id="strategy-library-heading" className="text-[17px] font-semibold text-[var(--text-primary)]">
        Preventive strategy library
      </h2>
      <p className="mt-1 max-w-[680px] text-[14px] leading-relaxed text-black/70">
        Filter for strategies that match your stage and current symptoms.
      </p>

      <div className="mt-4 rounded-[18px] border border-black/[0.08] bg-black/[0.015] p-5 md:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
          Filters
        </p>
        <div className="mt-4 space-y-5">
        {lifeStageLabels.length > 0 && (
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
              Life stage
            </span>
            <div className="mt-2">
              <ChipRow kind="lifeStage" labels={lifeStageLabels} active={lifeStage} />
            </div>
          </div>
        )}
        {symptomLabels.length > 0 && (
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
              Symptoms
            </span>
            <div className="mt-2">
              <ChipRow kind="symptoms" labels={symptomLabels} active={symptoms} />
            </div>
          </div>
        )}
        {biomarkerLabels.length > 0 && (
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-black/55">
              Biomarkers
            </span>
            <div className="mt-2">
              <ChipRow kind="biomarkers" labels={biomarkerLabels} active={biomarkers} />
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <DashboardCard key={s.id} hover={false}>
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">
              {s.title}
            </span>
            <p className="mt-2 text-[14px] leading-relaxed text-black/70 line-clamp-2">
              {s.oneLine}
            </p>
            <span className="mt-3 inline-block text-[13px] font-medium text-black/70">
              Benefit: more consistent recovery and energy
            </span>
          </DashboardCard>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-4 text-[14px] text-black/60">
          No strategies match the selected filters.
        </p>
      )}
    </section>
  );
}

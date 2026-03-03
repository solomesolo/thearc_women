"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Chip } from "@/components/ui/Chip";

const LIFE_STAGE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "reproductive", label: "Reproductive" },
  { value: "perimenopause", label: "Perimenopause" },
  { value: "postmenopause", label: "Postmenopause" },
];

const CYCLE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "regular", label: "Regular" },
  { value: "irregular", label: "Irregular" },
  { value: "none", label: "Not applicable" },
];

const GOAL_OPTIONS = [
  "Training performance",
  "Energy stability",
  "Sleep quality",
  "Stress resilience",
  "Hormonal transition",
  "Preventive / risk",
];

const SYMPTOM_OPTIONS = [
  "Sleep disruption",
  "Fatigue",
  "Mood or focus shifts",
  "Cycle changes",
  "Bloating / inflammation",
];

const RISK_OPTIONS = [
  "Bone health",
  "Cardiometabolic",
  "Family history (screening)",
];

const TRAINING_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

const STRESS_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

type Profile = {
  lifeStage: string | null;
  cyclePattern: string | null;
  goals: string[];
  symptoms: string[];
  riskFactors: string[];
  trainingVolume: string | null;
  stressLevel: string | null;
};

export function SurveyForm() {
  const [lifeStage, setLifeStage] = useState("");
  const [cyclePattern, setCyclePattern] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [trainingVolume, setTrainingVolume] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/survey")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile as Profile;
          setLifeStage(p.lifeStage ?? "");
          setCyclePattern(p.cyclePattern ?? "");
          setGoals(p.goals ?? []);
          setSymptoms(p.symptoms ?? []);
          setRiskFactors(p.riskFactors ?? []);
          setTrainingVolume(p.trainingVolume ?? "");
          setStressLevel(p.stressLevel ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (arr: string[], set: (a: string[]) => void, item: string) => {
    if (arr.includes(item)) set(arr.filter((x) => x !== item));
    else set([...arr, item]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lifeStage: lifeStage || undefined,
        cyclePattern: cyclePattern || undefined,
        goals,
        symptoms,
        riskFactors,
        trainingVolume: trainingVolume || undefined,
        stressLevel: stressLevel || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) setMessage({ type: "ok", text: "Saved. Your recommendations will use this profile." });
    else setMessage({ type: "err", text: data.error ?? "Failed to save." });
  };

  if (loading) return <p className="mt-8 text-sm text-[var(--text-secondary)]">Loading…</p>;

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-8">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">Life stage</label>
        <Select
          options={LIFE_STAGE_OPTIONS}
          value={lifeStage}
          onChange={(e) => setLifeStage(e.target.value)}
          className="mt-1 max-w-xs"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">Cycle pattern</label>
        <Select
          options={CYCLE_OPTIONS}
          value={cyclePattern}
          onChange={(e) => setCyclePattern(e.target.value)}
          className="mt-1 max-w-xs"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Goals (select any)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <Chip
              key={g}
              label={g}
              selected={goals.includes(g)}
              onToggle={() => toggle(goals, setGoals, g)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Symptoms (select any)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={symptoms.includes(s)}
              onToggle={() => toggle(symptoms, setSymptoms, s)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Risk factors (select any)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RISK_OPTIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              selected={riskFactors.includes(r)}
              onToggle={() => toggle(riskFactors, setRiskFactors, r)}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">Training volume</label>
        <Select
          options={TRAINING_OPTIONS}
          value={trainingVolume}
          onChange={(e) => setTrainingVolume(e.target.value)}
          className="mt-1 max-w-xs"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)]">Stress level</label>
        <Select
          options={STRESS_OPTIONS}
          value={stressLevel}
          onChange={(e) => setStressLevel(e.target.value)}
          className="mt-1 max-w-xs"
        />
      </div>
      {message && (
        <p className={message.type === "ok" ? "text-sm text-green-700" : "text-sm text-red-600"}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-[14px] bg-[var(--foreground)] px-6 py-3 text-[var(--background)] font-medium hover:opacity-95 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

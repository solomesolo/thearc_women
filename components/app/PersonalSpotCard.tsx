"use client";

import Link from "next/link";

interface PersonalSpotCardProps {
  firstName: string | null;
  plannedScreeningsThisWeek: number;
  plannedLabTestsThisWeek: number;
  attentionCount: number;
  isDE: boolean;
}

export function PersonalSpotCard({
  firstName,
  plannedScreeningsThisWeek,
  plannedLabTestsThisWeek,
  attentionCount,
  isDE,
}: PersonalSpotCardProps) {
  const totalThisWeek = plannedScreeningsThisWeek + plannedLabTestsThisWeek;

  const greeting = firstName
    ? (isDE ? `Hallo, ${firstName}` : `Hello, ${firstName}`)
    : (isDE ? "Hallo" : "Hello");

  function pluralEN(n: number, singular: string, plural: string): string {
    return n === 1 ? singular : plural;
  }

  function buildWeekSentence(): string {
    if (isDE) {
      const sc = plannedScreeningsThisWeek;
      const lt = plannedLabTestsThisWeek;
      const scStr = sc === 1 ? "1 Screening" : `${sc} Screenings`;
      const ltStr = lt === 1 ? "1 Labortest" : `${lt} Labortests`;
      return `Diese Woche: ${scStr} und ${ltStr} geplant.`;
    }
    const scStr = `${plannedScreeningsThisWeek} ${pluralEN(plannedScreeningsThisWeek, "screening", "screenings")}`;
    const ltStr = `${plannedLabTestsThisWeek} ${pluralEN(plannedLabTestsThisWeek, "lab test", "lab tests")}`;
    return `This week: ${scStr} and ${ltStr} planned.`;
  }

  function buildAttentionSentence(): string {
    if (isDE) {
      return attentionCount === 1
        ? "1 Bereich benötigt Ihre Aufmerksamkeit."
        : `${attentionCount} Bereiche benötigen Ihre Aufmerksamkeit.`;
    }
    return attentionCount === 1
      ? "1 area needs your attention."
      : `${attentionCount} areas need your attention.`;
  }

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">

      <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
        {isDE ? "IHR PERSÖNLICHER ÜBERBLICK" : "YOUR PERSONAL SPOT"}
      </p>

      <h2 className="text-[1.375rem] font-semibold tracking-tight text-[#0c0c0c]">
        {greeting}
      </h2>

      <div className="mt-3 space-y-1.5">
        {totalThisWeek > 0 ? (
          <p className="text-[0.9375rem] text-[#404040]">{buildWeekSentence()}</p>
        ) : (
          <p className="text-[0.9375rem] text-[#737373]">
            {isDE
              ? "Diese Woche sind keine Checks geplant. Ihr nächster empfohlener Schritt ist bereit."
              : "No checks planned this week. Your next recommended step is ready."}
          </p>
        )}

        {attentionCount > 0 && (
          <p className="text-[0.9375rem] font-medium text-[#d97706]">
            {buildAttentionSentence()}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Link
          href="/results/action-plan"
          className="inline-flex rounded-[12px] bg-[#0c0c0c] px-4 py-2.5 text-[0.875rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
        >
          {isDE ? "Aktionsplan öffnen" : "Open action plan"}
        </Link>
      </div>
    </div>
  );
}

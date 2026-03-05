"use client";

import type { ArcLogicScreen } from "@/lib/survey/arcSurveySchema";

type SafetyPromptScreenProps = {
  screen: ArcLogicScreen;
  onContinue: () => void;
};

export function SafetyPromptScreen({ screen, onContinue }: SafetyPromptScreenProps) {
  const continueAction = screen.actions.find((a) => a.action === "continue") ?? screen.actions[0];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-[24px] font-medium leading-snug text-[var(--text-primary)] md:text-[26px]">
          {screen.title}
        </h2>
        <p className="text-[17px] leading-relaxed text-[var(--text-primary)] opacity-90">{screen.body}</p>
      </div>
      <div className="pt-4">
        <button
          type="button"
          onClick={onContinue}
          className="min-h-[48px] rounded-[18px] bg-black/90 px-6 py-3 text-[16px] font-medium text-white hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          {continueAction?.label ?? "Continue"}
        </button>
      </div>
    </div>
  );
}

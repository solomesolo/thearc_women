import type { StepKey } from "./navigationTypes";

export function routeForStep(step: StepKey | null | undefined): string {
  if (!step || step === "start") return "/onboarding/start";
  if (step === "basics") return "/onboarding/basics";
  if (step === "lifestyle") return "/onboarding/lifestyle";
  if (step === "health_context") return "/onboarding/health-context";
  if (step === "test_history") return "/onboarding/test-history";
  return "/onboarding/start";
}

export function stepFromQuestionnaireLastStepNumber(lastStepNumber: number | null | undefined): StepKey {
  // last_step_number represents the last completed step in Engine A
  const n = typeof lastStepNumber === "number" ? lastStepNumber : 0;
  if (n <= 0) return "basics";
  if (n === 1) return "lifestyle";
  if (n === 2) return "health_context";
  if (n === 3) return "test_history";
  return "test_history";
}


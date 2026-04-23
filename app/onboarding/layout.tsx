import { SurveyProvider } from "@/components/onboarding/SurveyProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <SurveyProvider>{children}</SurveyProvider>;
}

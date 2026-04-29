import { SurveyProvider } from "@/components/onboarding/SurveyProvider";

export default function HealthJourneyLayout({ children }: { children: React.ReactNode }) {
  return <SurveyProvider>{children}</SurveyProvider>;
}

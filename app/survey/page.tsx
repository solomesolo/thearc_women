import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ArcSurveyContainer } from "@/components/survey/ArcSurveyContainer";
import { SurveyDevProfiles } from "@/components/survey/SurveyDevProfiles";

export default async function SurveyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/survey");

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="dashboard-shell w-full py-8 md:py-10">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-[32px]">
          Health survey
        </h1>
        <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-black/60 md:text-[15px]">
          Help us personalize your experience. Your answers are stored securely and used only for recommendations.
        </p>
        <div className="mt-8">
          <SurveyDevProfiles />
          <ArcSurveyContainer />
        </div>
      </div>
    </main>
  );
}

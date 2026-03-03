import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { SurveyForm } from "@/components/survey/SurveyForm";

export default async function SurveyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/survey");

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Container className="py-10 md:py-14 max-w-2xl">
        <h1 className="text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)]">
          Health survey
        </h1>
        <p className="mt-4 text-base leading-[1.65] text-[var(--text-secondary)]">
          Help us personalize your experience. Your answers are stored securely and used only for recommendations.
        </p>
        <SurveyForm />
      </Container>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { PlanDashboard } from "@/components/plan/PlanDashboard";
import { getPlans, getRecentLogs } from "@/lib/plan/queries";

export default async function PlanPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/login?callbackUrl=/plan");

  let plans: Awaited<ReturnType<typeof getPlans>> = [];
  let recentLogs: Awaited<ReturnType<typeof getRecentLogs>> = [];
  try {
    plans = await getPlans(email);
  } catch (err) {
    console.error("[plan page] getPlans failed", err);
  }
  try {
    recentLogs = await getRecentLogs(email, 5);
  } catch (err) {
    console.error("[plan page] getRecentLogs failed", err);
  }

  return (
    <Container className="py-10 md:py-14">
      <PlanDashboard plans={plans} recentLogs={recentLogs} />
    </Container>
  );
}

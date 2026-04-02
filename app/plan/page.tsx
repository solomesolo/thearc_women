import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { PlanDashboard } from "@/components/plan/PlanDashboard";
import { getPlans, getRecentLogs } from "@/lib/plan/queries";

export default async function PlanPage() {
  const session = await getServerSession(authOptions);
  const email = session!.user!.email!;

  const [plans, recentLogs] = await Promise.all([
    getPlans(email),
    getRecentLogs(email, 5),
  ]);

  return (
    <Container className="py-10 md:py-14">
      <PlanDashboard plans={plans} recentLogs={recentLogs} />
    </Container>
  );
}

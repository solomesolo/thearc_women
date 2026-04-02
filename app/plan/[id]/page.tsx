import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { PlanDetailView } from "@/components/plan/PlanDetailView";
import { getPlan, getRecentLogs } from "@/lib/plan/queries";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session!.user!.email!;

  const [plan, recentLogs] = await Promise.all([
    getPlan(email, Number(id)),
    getRecentLogs(email, 10),
  ]);

  if (!plan) notFound();

  return (
    <Container className="py-10 md:py-14">
      <PlanDetailView plan={plan} recentLogs={recentLogs} />
    </Container>
  );
}

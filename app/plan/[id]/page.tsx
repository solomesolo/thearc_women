import { notFound, redirect } from "next/navigation";
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
  const email = session?.user?.email;
  if (!email) redirect(`/login?callbackUrl=${encodeURIComponent(`/plan/${id}`)}`);

  let plan: Awaited<ReturnType<typeof getPlan>> = null;
  let recentLogs: Awaited<ReturnType<typeof getRecentLogs>> = [];
  try {
    plan = await getPlan(email, Number(id));
  } catch (err) {
    console.error("[plan detail] getPlan failed", err);
  }
  try {
    recentLogs = await getRecentLogs(email, 10);
  } catch (err) {
    console.error("[plan detail] getRecentLogs failed", err);
  }

  if (!plan) notFound();

  return (
    <Container className="py-10 md:py-14">
      <PlanDetailView plan={plan} recentLogs={recentLogs} />
    </Container>
  );
}

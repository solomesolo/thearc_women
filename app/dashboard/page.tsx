import { DashboardV3 } from "@/components/dashboard/DashboardV3";
import { getLatestDashboard } from "@/lib/dashboard/getLatestDashboard";
import { getStartingLineForUser } from "@/lib/dashboard/getStartingLineForUser";

export default async function DashboardPage() {
  const [payload, startingLine] = await Promise.all([
    getLatestDashboard(),
    getStartingLineForUser(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <DashboardV3 payload={payload} startingLine={startingLine} />
    </div>
  );
}

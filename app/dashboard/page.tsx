import { DashboardV3 } from "@/components/dashboard/DashboardV3";
import { getLatestDashboard } from "@/lib/dashboard/getLatestDashboard";
import { getStartingLineForUser } from "@/lib/dashboard/getStartingLineForUser";

export const dynamic = "force-dynamic";

function isNextDynamicUsageError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.message.includes("Dynamic server usage")) return true;
    if ("digest" in err && (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE")
      return true;
  }
  return false;
}

export default async function DashboardPage() {
  let payload: Awaited<ReturnType<typeof getLatestDashboard>> = null;
  let startingLine: Awaited<ReturnType<typeof getStartingLineForUser>> | null = null;
  try {
    payload = await getLatestDashboard();
  } catch (err) {
    if (isNextDynamicUsageError(err)) throw err;
    console.error("[dashboard page] getLatestDashboard failed", err);
  }
  try {
    startingLine = await getStartingLineForUser();
  } catch (err) {
    if (isNextDynamicUsageError(err)) throw err;
    console.error("[dashboard page] getStartingLineForUser failed", err);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <DashboardV3 payload={payload} startingLine={startingLine} />
    </div>
  );
}

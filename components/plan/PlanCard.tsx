import Link from "next/link";
import { clsx } from "clsx";
import type { PlanSummary } from "@/lib/knowledge/types";

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused:    "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-black/[0.04] text-black/50 border-black/[0.08]",
};

export function PlanCard({ plan }: { plan: PlanSummary }) {
  const progress = plan.itemCount > 0 ? Math.round((plan.doneCount / plan.itemCount) * 100) : 0;

  return (
    <Link
      href={`/plan/${plan.id}`}
      className="block rounded-[20px] border border-black/[0.07] bg-white p-5 hover:border-black/[0.14] transition-colors no-underline shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-[1.3]">
          {plan.name}
        </h3>
        <span
          className={clsx(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            STATUS_STYLES[plan.status] ?? STATUS_STYLES.active
          )}
        >
          {plan.status}
        </span>
      </div>

      {plan.itemCount > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-black/40">
              {plan.doneCount}/{plan.itemCount} done
            </span>
            <span className="text-[11px] text-black/40">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";
import type { PlanSummary, ActionLogRow } from "@/lib/knowledge/types";
import { PlanCard } from "./PlanCard";

type Props = {
  plans: PlanSummary[];
  recentLogs: ActionLogRow[];
};

export function PlanDashboard({ plans, recentLogs }: Props) {
  const active = plans.filter((p) => p.status === "active");
  const paused = plans.filter((p) => p.status === "paused");
  const completed = plans.filter((p) => p.status === "completed");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-black/[0.07] pb-6 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              My Health Plan
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              Track your protocols and daily actions
            </p>
          </div>
          <Link
            href="/plan/builder"
            className="rounded-[14px] bg-black/90 px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-85 transition-opacity"
          >
            + New plan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        {/* Plans column */}
        <div className="lg:col-span-2 space-y-6">
          {plans.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-black/[0.12] px-8 py-12 text-center">
              <p className="text-[14px] text-[var(--text-secondary)]">
                No plans yet. Create your first health plan to start tracking actions.
              </p>
              <Link
                href="/plan/builder"
                className="mt-4 inline-block rounded-[14px] bg-black/90 px-5 py-2.5 text-[13px] font-semibold text-white hover:opacity-85 transition-opacity"
              >
                Create a plan
              </Link>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <section>
                  <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-3">
                    Active plans
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {active.map((p) => <PlanCard key={p.id} plan={p} />)}
                  </div>
                </section>
              )}

              {paused.length > 0 && (
                <section>
                  <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-3">
                    Paused
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {paused.map((p) => <PlanCard key={p.id} plan={p} />)}
                  </div>
                </section>
              )}

              {completed.length > 0 && (
                <section>
                  <h2 className="text-[12px] font-semibold uppercase tracking-widest text-black/35 mb-3">
                    Completed
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {completed.map((p) => <PlanCard key={p.id} plan={p} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          {recentLogs.length > 0 && (
            <div className="rounded-[20px] border border-black/[0.07] bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-4">
                Recent logs
              </p>
              <ul className="space-y-3">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-black/25" aria-hidden />
                    <div>
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        {log.note ?? "Completed an action"}
                      </p>
                      <p className="text-[11px] text-black/35">
                        {new Date(log.loggedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-[20px] border border-[#e8ddd6] bg-[#fdf8f5] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-black/35 mb-3">
              Quick links
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/knowledge" className="text-[13px] text-[var(--text-primary)] hover:underline underline-offset-2">
                  → My Health Dashboard
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-[13px] text-[var(--text-primary)] hover:underline underline-offset-2">
                  → Search for topics
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

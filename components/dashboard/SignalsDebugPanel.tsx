"use client";

import type { DashboardSignal } from "@/lib/dashboard/types";

export function SignalsDebugPanel({
  signals,
  open,
}: {
  signals: DashboardSignal[];
  open: boolean;
}) {
  if (!open) return null;
  return (
    <section className="dashboard-shell pb-8" aria-labelledby="signals-debug-heading">
      <div className="rounded-[18px] border border-black/[0.08] bg-black/[0.015] p-5">
        <h3 id="signals-debug-heading" className="text-[14px] font-semibold text-[var(--text-primary)]">
          Signals behind the scenes (debug)
        </h3>
        {signals.length === 0 ? (
          <p className="mt-2 text-[13px] text-black/60">No signal rows available for this session.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-[12px] text-black/70">
              <thead className="text-black/55">
                <tr>
                  <th className="pr-4 pb-2">Signal</th>
                  <th className="pr-4 pb-2">Domain</th>
                  <th className="pr-4 pb-2">Score</th>
                  <th className="pr-4 pb-2">Normalized</th>
                  <th className="pr-4 pb-2">Severity</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s) => (
                  <tr key={s.signalCode} className="border-t border-black/5">
                    <td className="pr-4 py-2">{s.signalCode}</td>
                    <td className="pr-4 py-2">{s.domain}</td>
                    <td className="pr-4 py-2">{s.score}</td>
                    <td className="pr-4 py-2">{s.scoreNormalized ?? "—"}</td>
                    <td className="pr-4 py-2">{s.severity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}


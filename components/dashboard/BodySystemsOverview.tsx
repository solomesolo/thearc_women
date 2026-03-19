"use client";

import { DashboardCard } from "./DashboardCard";
import { HealthStatusChip, type HealthStatus } from "./HealthStatusChip";

type SystemCard = {
  title: string;
  status: HealthStatus;
  body: string;
};

const SYSTEMS: SystemCard[] = [
  { title: "Hormonal Rhythm", status: "Steady", body: "Stable patterns with no strong disruption signals." },
  { title: "Sleep Architecture", status: "Worth attention", body: "Generally steady, with some variability in consistency." },
  { title: "Stress Response", status: "Worth attention", body: "Stress load appears manageable but worth monitoring." },
  { title: "Metabolic Health", status: "Steady", body: "No major disruption, but sensitive to sleep and stress." },
  { title: "Gut System", status: "Steady", body: "No strong disruption signals detected." },
  { title: "Micronutrient Reserves", status: "Steady", body: "No clear deficiency patterns from current signals." },
  { title: "Cardiovascular Health", status: "Steady", body: "Stable baseline with no concerning indicators." },
  { title: "Bone Health", status: "Steady", body: "No signals suggesting elevated risk." },
  { title: "Recovery Capacity", status: "Worth attention", body: "Recovery is slightly affected by sleep variability." },
  { title: "Biomarker Context", status: "Steady", body: "No strong irregular patterns detected." },
  { title: "Inflammation Context", status: "Steady", body: "No signs of elevated inflammation load." },
  { title: "Nutrition Patterns", status: "Steady", body: "Generally steady, may fluctuate with energy and stress." },
];

export function BodySystemsOverview() {
  return (
    <section className="dashboard-section dashboard-shell" aria-labelledby="systems-overview-heading">
      <h2 id="systems-overview-heading" className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
        Body systems overview
      </h2>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-black/70">
        Most of your body systems look steady. A few areas may improve further with better sleep and recovery.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SYSTEMS.map((s) => (
          <DashboardCard
            key={s.title}
            as="div"
            hover={true}
            className={[
              "h-full min-h-[120px] p-5",
              s.status === "Worth attention" ? "border-black/[0.12] bg-black/[0.02]" : "border-black/[0.07]",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                {s.title}
              </p>
              <HealthStatusChip status={s.status} className="shrink-0" />
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-black/75">
              {s.body}
            </p>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}


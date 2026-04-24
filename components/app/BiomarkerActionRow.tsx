"use client";

import Link from "next/link";
import { useState } from "react";
import { InsuranceAndDoctorGuidanceCard } from "@/components/app/InsuranceAndDoctorGuidanceCard";
import { useBiomarkerGuidance } from "@/lib/doctor-guidance/useBiomarkerGuidance";

export function BiomarkerActionRow({
  biomarkerName,
  biomarkerKey,
  country,
}: {
  biomarkerName: string;
  biomarkerKey: string;
  country: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { data: guidance, isLoading } = useBiomarkerGuidance(open ? biomarkerKey : null, country);

  return (
    <div className="overflow-hidden rounded-[18px] border border-black/[0.08] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{biomarkerName}</p>
          <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
            {open ? "Hide booking & coverage" : "Show booking & coverage"}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-[0.8125rem] font-medium text-[#737373]">
          {open ? "—" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-black/[0.07]">
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <p className="text-[0.8125rem] text-[#a3a3a3]">Upload a lab PDF or photo to save it in your wallet.</p>
            <Link
              href="/upload"
              className="shrink-0 rounded-[12px] border border-black/[0.1] px-3 py-2 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:text-[#0c0c0c]"
            >
              Upload result
            </Link>
          </div>

          <div className="grid grid-cols-1 divide-y divide-black/[0.07] md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">Book at a lab</p>
          <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">Local lab</span>
              <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">—</span>
            </div>
            <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">Choose a nearby lab</p>
            <Link
              href="#"
              className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]"
            >
              Open in Maps
            </Link>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">Home test</p>
          <div className="mt-3 rounded-[12px] border border-black/[0.07] bg-[#fafaf9] p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.9375rem] font-semibold text-[#0c0c0c]">Home test option</span>
              <span className="shrink-0 text-[0.9375rem] font-semibold text-[#0c0c0c]">—</span>
            </div>
            <p className="mt-1 text-[0.8125rem] leading-snug text-[#737373]">If available in your area</p>
            <Link
              href="#"
              className="mt-2.5 inline-flex items-center gap-1 rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-[#404040] transition-colors hover:bg-[#f0f0ef]"
            >
              Order online
            </Link>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">Through your doctor</p>
          <div className="mt-3">
            <InsuranceAndDoctorGuidanceCard guidance={guidance} isLoading={isLoading} country={country} />
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import { AboutHeroMap, type SystemMapNode } from "./AboutHeroMap";

type ProofPill = { id: string; label: string; hoverText: string };

type AboutHeroProps = {
  h1: string;
  lead: string;
  proofPills: ProofPill[];
  systemMap: {
    nodes: SystemMapNode[];
    connections: [string, string][];
  };
};

export function AboutHero({
  h1,
  lead,
  proofPills,
  systemMap,
}: AboutHeroProps) {
  const [hoverPill, setHoverPill] = useState<string | null>(null);
  const hoveredPill = hoverPill
    ? proofPills.find((p) => p.id === hoverPill)
    : null;

  return (
    <div className="grid grid-cols-12 gap-8 md:gap-12 items-start">
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-[2.25rem] leading-tight">
          {h1}
        </h1>
        <p className="text-base leading-relaxed text-black/70 md:text-lg">
          {lead}
        </p>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-black/50 mb-2">
            Proof
          </p>
          <div className="flex flex-wrap gap-2">
            {proofPills.map((pill) => (
              <div
                key={pill.id}
                className="relative group"
                onMouseEnter={() => setHoverPill(pill.id)}
                onMouseLeave={() => setHoverPill(null)}
              >
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    hoverPill === pill.id
                      ? "border-[var(--text-primary)]/30 bg-[var(--color-surface)]/60 text-[var(--text-primary)]"
                      : "border-black/12 bg-[var(--background)] text-black/80 hover:border-black/20"
                  }`}
                >
                  {pill.label}
                  <span className="ml-1 opacity-60">→</span>
                </span>
                {hoveredPill?.id === pill.id && (
                  <div className="absolute left-0 top-full z-10 mt-1.5 max-w-[280px] rounded-lg border border-black/10 bg-[var(--background)] px-3 py-2 shadow-lg text-sm leading-relaxed text-black/80">
                    {pill.hoverText}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-6">
        <AboutHeroMap
          nodes={systemMap.nodes}
          connections={systemMap.connections}
        />
      </div>
    </div>
  );
}

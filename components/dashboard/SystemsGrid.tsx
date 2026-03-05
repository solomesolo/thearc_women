"use client";

import type { System as SystemType } from "@/types/dashboard";
import { SystemTile } from "./SystemTile";

type SystemsGridProps = {
  systems: SystemType[];
  selectedId: string | null;
  onSelect: (system: SystemType) => void;
};

/**
 * Desktop: 4 cols × 2 rows. Tablet: 2 cols × 4 rows. Mobile: 1 col.
 * Gap 16–20px. No truncation; titles wrap.
 */
export function SystemsGrid({
  systems,
  selectedId,
  onSelect,
}: SystemsGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
      role="tablist"
      aria-label="Systems"
    >
      {systems.map((system) => (
        <SystemTile
          key={system.id}
          system={system}
          isSelected={selectedId === system.id}
          onSelect={() => onSelect(system)}
        />
      ))}
    </div>
  );
}

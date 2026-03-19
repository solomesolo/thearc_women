"use client";

import type { System as SystemType } from "@/types/dashboard";
import { SystemTile } from "./SystemTile";

type SystemsGridProps = {
  systems: SystemType[];
  selectedId: string | null;
  onSelect: (system: SystemType) => void;
};

/**
 * Desktop: 3 cols max. Tablet: 2 cols. Mobile: 1 col.
 * Increased spacing for readability. No truncation; titles wrap.
 */
export function SystemsGrid({
  systems,
  selectedId,
  onSelect,
}: SystemsGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6"
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

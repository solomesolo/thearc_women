"use client";

import { clsx } from "clsx";

type DashboardCardProps = {
  children: React.ReactNode;
  as?: "div" | "article" | "section";
  className?: string;
  /** Use for clickable cards (Link or button wrapper) */
  hover?: boolean;
};

/**
 * Unified card surface: warm white, border 6–8% black, radius 16–20px,
 * padding 14–16px mobile / 16–20px desktop. No shadow.
 * Hover: border 14–18%, background black 2%.
 */
export function DashboardCard({
  children,
  as: Component = "div",
  className,
  hover = true,
}: DashboardCardProps) {
  return (
    <Component
      className={clsx(
        "rounded-[18px] border border-black/[0.07] bg-[var(--background)] p-4 md:p-5",
        "transition-colors duration-200",
        hover && "hover:border-black/[0.16] hover:bg-black/[0.02]",
        className
      )}
    >
      {children}
    </Component>
  );
}

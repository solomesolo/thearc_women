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
 * Unified card surface: calm warm white, subtle border, radius 24px,
 * standard padding 24px. Soft shadow for premium touch.
 * Hover: slightly stronger border + lift.
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
        "rounded-[24px] border border-black/[0.08] bg-[var(--background)] p-6",
        "shadow-[0_1px_0_rgba(12,12,12,0.04),0_10px_22px_rgba(12,12,12,0.04)]",
        "transition duration-200",
        hover &&
          "hover:border-black/[0.14] hover:bg-black/[0.01] hover:shadow-[0_1px_0_rgba(12,12,12,0.05),0_16px_30px_rgba(12,12,12,0.06)]",
        className
      )}
    >
      {children}
    </Component>
  );
}

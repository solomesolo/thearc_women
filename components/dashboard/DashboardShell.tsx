"use client";

import { clsx } from "clsx";

type DashboardShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Page container for dashboard: max-width 1200px, padding 20/32/40px, center.
 * Use for the whole dashboard so nothing touches viewport edges.
 */
export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={clsx("dashboard-shell w-full", className)}>
      {children}
    </div>
  );
}

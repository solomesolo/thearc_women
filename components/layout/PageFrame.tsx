"use client";

import { clsx } from "clsx";

type PageFrameVariant = "standard" | "wide";

type PageFrameProps = {
  children: React.ReactNode;
  variant?: PageFrameVariant;
  className?: string;
};

/**
 * Global page wrapper: max-width, responsive padding, consistent vertical spacing.
 * Use on /about, /system, /system2 for aligned layout.
 */
export function PageFrame({
  children,
  variant = "standard",
  className,
}: PageFrameProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[1200px]",
        "px-5 md:px-8 lg:px-10",
        variant === "wide" && "lg:max-w-[1200px]",
        className
      )}
    >
      {children}
    </div>
  );
}

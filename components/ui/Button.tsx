"use client";

import Link from "next/link";
import { clsx } from "clsx";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "hero";
  className?: string;
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-[14px] bg-[var(--foreground)] text-[var(--background)] no-underline",
        "transition-[filter] duration-[180ms] ease-[cubic-bezier(0,0,0.2,1)]",
        "hover:brightness-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]",
        variant === "primary" &&
          "px-6 py-3.5 text-base font-medium",
        variant === "hero" &&
          "h-[52px] px-6 text-base font-medium tracking-tight md:px-[26px]",
        className
      )}
    >
      {children}
    </Link>
  );
}

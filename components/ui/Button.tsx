"use client";

import Link from "next/link";
import { clsx } from "clsx";

const variantClass = {
  primary: "px-6 py-3.5 text-base font-medium",
  hero: "h-[52px] px-6 text-base font-medium tracking-tight md:px-[26px]",
  outline:
    "min-h-[52px] border-2 border-[#0c0c0c] !bg-transparent px-6 text-base font-medium tracking-tight !text-[#0c0c0c] hover:!brightness-100 hover:bg-[#0c0c0c]/[0.05] md:px-[26px]",
};

const baseClass =
  "inline-flex items-center justify-center rounded-[14px] bg-[var(--foreground)] text-[var(--background)] no-underline " +
  "transition-[filter] duration-[180ms] ease-[cubic-bezier(0,0,0.2,1)] " +
  "hover:brightness-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]";

type ButtonBase = {
  children: React.ReactNode;
  variant?: "primary" | "hero" | "outline";
  className?: string;
};

type ButtonWithHref = ButtonBase & { href: string; onClick?: never };
type ButtonWithClick = ButtonBase & { onClick: () => void; href?: never };

type ButtonProps = ButtonWithHref | ButtonWithClick;

export function Button({ children, variant = "primary", className, ...rest }: ButtonProps) {
  const classes = clsx(baseClass, variantClass[variant], className);

  if ("onClick" in rest && rest.onClick) {
    return (
      <button type="button" onClick={rest.onClick} className={classes}>
        {children}
      </button>
    );
  }

  return (
    <Link href={(rest as ButtonWithHref).href} className={classes}>
      {children}
    </Link>
  );
}

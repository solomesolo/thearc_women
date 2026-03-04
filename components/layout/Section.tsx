"use client";

import { clsx } from "clsx";

type SectionProps = {
  id?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  divider?: boolean;
  className?: string;
  noPadding?: boolean;
};

export function Section({
  id,
  title,
  subtitle,
  children,
  divider = true,
  className,
  noPadding = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={clsx(
        !noPadding && "py-16 md:py-24",
        divider && "border-t border-black/5",
        className
      )}
    >
      {(title || subtitle) && (
        <header className="mb-8">
          {title && (
            <h2 className="content-reading-col text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="content-reading-col mt-4 text-base leading-relaxed text-black/70 md:mt-6 md:text-lg">
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

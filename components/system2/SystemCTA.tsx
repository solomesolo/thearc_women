"use client";

import Link from "next/link";
import type { SystemCTAData } from "@/content/systemPageData";

type SystemCTAProps = {
  data: SystemCTAData;
  className?: string;
};

export function SystemCTA({ data, className = "" }: SystemCTAProps) {
  const secondaryHref = data.secondaryCta && "href" in data.secondaryCta ? data.secondaryCta.href : undefined;
  const secondaryOnClick = data.secondaryCta && "onClick" in data.secondaryCta ? data.secondaryCta.onClick : undefined;

  return (
    <section
      className={`rounded-2xl border border-black/[0.08] bg-[var(--color-surface)]/40 py-12 px-6 md:py-16 md:px-10 ${className}`}
      aria-labelledby="system-cta-headline"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 id="system-cta-headline" className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">
          {data.headline}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-black/70 md:text-lg">
          {data.lead}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href={data.primaryCta.href}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-[var(--foreground)] bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background)] no-underline transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2"
          >
            {data.primaryCta.label}
          </Link>
          {data.secondaryCta && (
            secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-black/15 bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2"
              >
                {data.secondaryCta.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryOnClick}
                className="inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-black/15 bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2"
              >
                {data.secondaryCta.label}
              </button>
            )
          )}
        </div>
        {data.microNote && (
          <p className="mt-6 text-sm text-black/55 text-center">
            {data.microNote}
          </p>
        )}
      </div>
    </section>
  );
}

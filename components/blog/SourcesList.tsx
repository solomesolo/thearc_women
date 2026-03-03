"use client";

import { useState } from "react";

type Source = {
  id?: number;
  label: string;
  url?: string | null;
  evidenceNote?: string | null;
};

type SourcesListProps = {
  sources: Source[];
  defaultOpen?: boolean;
};

export function SourcesList({ sources, defaultOpen = false }: SourcesListProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (sources.length === 0) return null;

  return (
    <div className="border-t border-[var(--color-border-hairline)] pt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
        aria-expanded={open}
      >
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
          Sources
        </h2>
        <span className="text-sm text-[var(--text-secondary)]" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <ul className="mt-4 list-none space-y-3 pl-0 text-sm text-[var(--text-secondary)]">
          {sources.map((src, i) => (
            <li key={src.id ?? i}>
              {src.url ? (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--text-primary)]"
                >
                  {src.label}
                </a>
              ) : (
                <span>{src.label}</span>
              )}
              {src.evidenceNote && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]/90">
                  {src.evidenceNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

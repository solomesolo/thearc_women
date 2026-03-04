"use client";

import { useEffect } from "react";
import {
  ADVANCED_FILTER_TYPES,
  FILTER_GROUP_LABELS,
} from "@/content/taxonomy";

type TagsByType = Record<string, { id?: number; slug: string; label: string }[]>;

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  tagsByType: TagsByType;
  getArray: (key: string) => string[];
  toggleTag: (type: string, slug: string) => void;
};

export function FilterDrawer({
  isOpen,
  onClose,
  tagsByType,
  getArray,
  toggleTag,
}: FilterDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[var(--text-primary)]/10 transition-opacity duration-150"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-[var(--color-border-hairline)] bg-[var(--background)] shadow-xl transition-transform duration-200 ease-out md:max-w-sm"
        role="dialog"
        aria-label="Refine filters"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border-hairline)] bg-[var(--background)] px-5 py-4">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Refine further
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="space-y-6 px-5 py-6">
          {ADVANCED_FILTER_TYPES.map((type) => {
            const options = tagsByType[type] ?? [];
            if (options.length === 0) return null;
            const selected = new Set(getArray(type));
            const groupLabel = FILTER_GROUP_LABELS[type] ?? type;
            return (
              <div key={type}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  {groupLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt.slug}
                      type="button"
                      onClick={() => toggleTag(type, opt.slug)}
                      className={`rounded-[16px] border px-3 py-1.5 text-sm transition-colors ${
                        selected.has(opt.slug)
                          ? "border-[var(--text-primary)]/40 bg-[var(--color-surface)] text-[var(--text-primary)]"
                          : "border-[var(--color-border-hairline)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-primary)]/30 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

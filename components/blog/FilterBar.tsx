"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import {
  SIMPLE_FILTER_TYPES,
  ADVANCED_FILTER_TYPES,
  FILTER_GROUP_LABELS,
  GUIDED_PATHS,
} from "@/content/taxonomy";

const SORT_OPTIONS: { value: "latest" | "relevant"; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "relevant", label: "Relevant" },
];

type TagsByType = Record<string, { id?: number; slug: string; label: string }[]>;

type FilterBarProps = {
  tagsByType: TagsByType;
  searchParams: URLSearchParams;
};

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (updater: (prev: URLSearchParams) => URLSearchParams) => {
      const prev = new URLSearchParams(window.location.search);
      const next = updater(prev);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );
}

export function FilterBar({ tagsByType, searchParams }: FilterBarProps) {
  const updateQuery = useQueryUpdater();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "latest";

  const getArray = (key: string) => searchParams.getAll(key);
  const toggleTag = (type: string, slug: string) => {
    updateQuery((prev) => {
      const current = prev.getAll(type);
      const next = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      prev.delete(type);
      next.forEach((s) => prev.append(type, s));
      return prev;
    });
  };

  const setSort = (value: string) => {
    updateQuery((prev) => {
      if (value && value !== "latest") prev.set("sort", value);
      else prev.delete("sort");
      return prev;
    });
  };

  const setSearch = (value: string) => {
    setSearchInput(value);
    updateQuery((prev) => {
      if (value.trim()) prev.set("q", value.trim());
      else prev.delete("q");
      return prev;
    });
  };

  const clearAll = () => {
    setSearchInput("");
    updateQuery(() => new URLSearchParams());
  };

  const allFilterTypes = [...SIMPLE_FILTER_TYPES, ...ADVANCED_FILTER_TYPES];
  const hasActiveFilters =
    q || sort !== "latest" || allFilterTypes.some((t) => getArray(t).length > 0);

  const simpleTypes = SIMPLE_FILTER_TYPES;
  const advancedTypes = ADVANCED_FILTER_TYPES;

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--color-border-hairline)] bg-[var(--background)]/95 py-5 backdrop-blur-sm">
      <div className="space-y-5">
        {/* Search */}
        <Input
          type="search"
          placeholder="Search symptoms, labs, life stage…"
          value={searchInput}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          aria-label="Search articles"
        />

        {/* Guided paths — Start here */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Start here
          </p>
          <div className="flex flex-wrap gap-2">
            {GUIDED_PATHS.map((path) => (
              <Link
                key={path.slug}
                href={`/blog?${path.query}`}
                className="inline-flex items-center rounded-full border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-1.5 text-sm text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--text-primary)]/30 hover:bg-[var(--color-surface)]/50"
              >
                {path.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick filters: Life stage, Main concern, Goal, Evidence */}
        <div className="flex flex-wrap items-center gap-4">
          {simpleTypes.map((type) => {
            const options = tagsByType[type] ?? [];
            if (options.length === 0) return null;
            const selected = new Set(getArray(type));
            const groupLabel = FILTER_GROUP_LABELS[type] ?? type;
            return (
              <div key={type} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {groupLabel}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {options.slice(0, 12).map((opt) => (
                    <Chip
                      key={opt.slug}
                      label={opt.label}
                      selected={selected.has(opt.slug)}
                      onToggle={() => toggleTag(type, opt.slug)}
                    />
                  ))}
                  {options.length > 12 && (
                    <span className="px-2 py-1 text-xs text-[var(--text-secondary)]">
                      +{options.length - 12}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
            aria-label="Sort"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Advanced filters toggle */}
        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="text-sm font-medium text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            {advancedOpen ? "Hide" : "Show"} advanced filters
          </button>
          {advancedOpen && (
            <div className="mt-3 space-y-3 border-t border-[var(--color-border-hairline)] pt-3">
              {advancedTypes.map((type) => {
                const options = tagsByType[type] ?? [];
                if (options.length === 0) return null;
                const selected = new Set(getArray(type));
                const groupLabel = FILTER_GROUP_LABELS[type] ?? type;
                return (
                  <div key={type}>
                    <p className="mb-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      {groupLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt) => (
                        <Chip
                          key={opt.slug}
                          label={opt.label}
                          selected={selected.has(opt.slug)}
                          onToggle={() => toggleTag(type, opt.slug)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {advancedOpen && advancedTypes.every((type) => (tagsByType[type] ?? []).length === 0) && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Advanced filter options are loaded from the database. Run{" "}
                  <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs">npm run db:seed</code>{" "}
                  to populate them (requires migrations applied first).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

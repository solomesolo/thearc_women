"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import {
  SIMPLE_FILTER_TYPES,
  ADVANCED_FILTER_TYPES,
  FILTER_GROUP_LABELS,
  SYMPTOM_GROUPS,
  EVIDENCE_SEGMENTS,
  TAXONOMY_LABELS,
} from "@/content/taxonomy";
import { FilterDrawer } from "@/components/blog/FilterDrawer";

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

/** Get label for a tag slug from taxonomy or tagsByType */
function getLabelForSlug(slug: string, type: string, tagsByType: TagsByType): string {
  const list = tagsByType[type];
  const found = list?.find((t) => t.slug === slug);
  if (found) return found.label;
  const fromTax = TAXONOMY_LABELS.find((t) => t.slug === slug && t.type === type);
  return fromTax?.label ?? slug;
}

export function FilterBar({ tagsByType, searchParams }: FilterBarProps) {
  const updateQuery = useQueryUpdater();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [symptomSearch, setSymptomSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "latest";
  const getArray = (key: string) => searchParams.getAll(key);

  const toggleTag = useCallback(
    (type: string, slug: string) => {
      updateQuery((prev) => {
        const current = prev.getAll(type);
        const next = current.includes(slug)
          ? current.filter((s) => s !== slug)
          : [...current, slug];
        prev.delete(type);
        next.forEach((s) => prev.append(type, s));
        return prev;
      });
    },
    [updateQuery]
  );

  const setSort = useCallback(
    (value: string) => {
      updateQuery((prev) => {
        if (value && value !== "latest") prev.set("sort", value);
        else prev.delete("sort");
        return prev;
      });
    },
    [updateQuery]
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      updateQuery((prev) => {
        if (value.trim()) prev.set("q", value.trim());
        else prev.delete("q");
        return prev;
      });
    },
    [updateQuery]
  );

  const clearAll = useCallback(() => {
    setSearchInput("");
    updateQuery(() => new URLSearchParams());
  }, [updateQuery]);

  const removeFilter = useCallback(
    (type: string, slug: string) => {
      updateQuery((prev) => {
        const current = prev.getAll(type);
        const next = current.filter((s) => s !== slug);
        prev.delete(type);
        next.forEach((s) => prev.append(type, s));
        return prev;
      });
    },
    [updateQuery]
  );

  const allFilterTypes = [...SIMPLE_FILTER_TYPES, ...ADVANCED_FILTER_TYPES];
  const hasActiveFilters =
    q || sort !== "latest" || allFilterTypes.some((t) => getArray(t).length > 0);

  const lifeStageOptions = tagsByType.lifeStage ?? [];
  const goalOptions = tagsByType.goal ?? [];
  const evidenceSelected = new Set(getArray("evidenceLevel"));

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (openPopover && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openPopover]);

  const symptomSlugToLabel = (slug: string) => getLabelForSlug(slug, "symptom", tagsByType);
  const filteredSymptomGroups = symptomSearch.trim()
    ? SYMPTOM_GROUPS.map((grp) => ({
        ...grp,
        slugs: grp.slugs.filter((s) =>
          symptomSlugToLabel(s).toLowerCase().includes(symptomSearch.toLowerCase())
        ),
      })).filter((grp) => grp.slugs.length > 0)
    : SYMPTOM_GROUPS;

  const activeChips: { type: string; slug: string; label: string }[] = [];
  allFilterTypes.forEach((type) => {
    getArray(type).forEach((slug) => {
      activeChips.push({ type, slug, label: getLabelForSlug(slug, type, tagsByType) });
    });
  });

  return (
    <div className="space-y-4">
      {/* Search — strong */}
      <Input
        type="search"
        placeholder="Search symptoms, labs, life stage…"
        value={searchInput}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
        aria-label="Search articles"
      />

      {/* Row 1: Primary controls */}
      <div className="flex flex-wrap items-center gap-2" ref={popoverRef}>
        {/* Life Stage — dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === "lifeStage" ? null : "lifeStage")}
            className="flex items-center gap-1.5 rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]/30 hover:bg-[var(--color-surface)]/50"
            aria-expanded={openPopover === "lifeStage"}
            aria-haspopup="listbox"
          >
            <span className="text-[var(--text-secondary)]">{FILTER_GROUP_LABELS.lifeStage}</span>
            <span className="text-[var(--text-secondary)]">▾</span>
          </button>
          {openPopover === "lifeStage" && (
            <div
              className="absolute left-0 top-full z-20 mt-1 max-h-[280px] min-w-[220px] overflow-y-auto rounded-[12px] border border-[var(--color-border-hairline)] bg-[var(--background)] py-2 shadow-lg transition-opacity duration-150"
              role="listbox"
            >
              {lifeStageOptions.map((opt) => {
                const sel = getArray("lifeStage").includes(opt.slug);
                return (
                  <button
                    key={opt.slug}
                    type="button"
                    role="option"
                    aria-selected={sel}
                    onClick={() => { toggleTag("lifeStage", opt.slug); setOpenPopover(null); }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      sel
                        ? "bg-[var(--color-surface)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Concern — popover with search + grouped */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setOpenPopover(openPopover === "symptom" ? null : "symptom"); setSymptomSearch(""); }}
            className="flex items-center gap-1.5 rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]/30 hover:bg-[var(--color-surface)]/50"
            aria-expanded={openPopover === "symptom"}
          >
            <span className="text-[var(--text-secondary)]">{FILTER_GROUP_LABELS.symptom}</span>
            <span className="text-[var(--text-secondary)]">▾</span>
          </button>
          {openPopover === "symptom" && (
            <div className="absolute left-0 top-full z-20 mt-1 w-[320px] rounded-[12px] border border-[var(--color-border-hairline)] bg-[var(--background)] py-3 shadow-lg transition-opacity duration-150">
              <input
                type="search"
                placeholder="Search concern…"
                value={symptomSearch}
                onChange={(e) => setSymptomSearch(e.target.value)}
                className="mx-3 mb-3 w-[calc(100%-24px)] rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--text-primary)]/30 focus:outline-none"
              />
              <div className="max-h-[320px] overflow-y-auto px-2">
                {filteredSymptomGroups.map((grp) => (
                  <div key={grp.label} className="mb-3">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                      {grp.label}
                    </p>
                    <ul className="space-y-1">
                      {grp.slugs.map((slug) => {
                        const sel = getArray("symptom").includes(slug);
                        return (
                          <li key={slug}>
                            <button
                              type="button"
                              onClick={() => toggleTag("symptom", slug)}
                              className={`w-full rounded-[8px] px-2.5 py-1.5 text-left text-sm transition-colors ${
                                sel
                                  ? "bg-[var(--color-surface)] text-[var(--text-primary)]"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--text-primary)]"
                              }`}
                            >
                              {symptomSlugToLabel(slug)}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goal — dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === "goal" ? null : "goal")}
            className="flex items-center gap-1.5 rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]/30 hover:bg-[var(--color-surface)]/50"
            aria-expanded={openPopover === "goal"}
          >
            <span className="text-[var(--text-secondary)]">{FILTER_GROUP_LABELS.goal}</span>
            <span className="text-[var(--text-secondary)]">▾</span>
          </button>
          {openPopover === "goal" && (
            <div className="absolute left-0 top-full z-20 mt-1 max-h-[280px] min-w-[200px] overflow-y-auto rounded-[12px] border border-[var(--color-border-hairline)] bg-[var(--background)] py-2 shadow-lg transition-opacity duration-150">
              {goalOptions.map((opt) => {
                const sel = getArray("goal").includes(opt.slug);
                return (
                  <button
                    key={opt.slug}
                    type="button"
                    onClick={() => { toggleTag("goal", opt.slug); setOpenPopover(null); }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      sel ? "bg-[var(--color-surface)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--color-surface)]/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Evidence Level — segmented control */}
        <div className="flex items-center rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/30 p-0.5">
          {EVIDENCE_SEGMENTS.map((seg) => {
            const sel = evidenceSelected.has(seg.slug);
            return (
              <button
                key={seg.slug}
                type="button"
                onClick={() => toggleTag("evidenceLevel", seg.slug)}
                className={`rounded-[12px] px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                  sel
                    ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {seg.label}
              </button>
            );
          })}
        </div>

        {/* Advanced — icon opens drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--background)] p-2 text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)]/30 hover:text-[var(--text-primary)]"
          aria-label="Advanced filters"
          title="Advanced filters"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="14" y2="12" />
            <line x1="4" y1="18" x2="10" y2="18" />
          </svg>
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-[16px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
          aria-label="Sort"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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

      {/* Row 2: Dynamic chips (only after selection) */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map(({ type, slug, label }) => (
            <span
              key={`${type}-${slug}`}
              className="inline-flex items-center gap-1.5 rounded-[18px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/40 px-3 py-1.5 text-sm text-[var(--text-primary)]"
            >
              {label}
              <button
                type="button"
                onClick={() => removeFilter(type, slug)}
                className="rounded-full p-0.5 text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/10 hover:text-[var(--text-primary)]"
                aria-label={`Remove ${label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Refine further → opens drawer */}
      <div className="border-t border-[var(--color-border-hairline)] pt-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
        >
          Refine further →
        </button>
      </div>

      {/* Filter drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tagsByType={tagsByType}
        getArray={getArray}
        toggleTag={toggleTag}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";

type Section = {
  id: number;
  sectionIndex: number;
  title: string | null;
  body: string;
  isGated: boolean;
  preview: string | null;
};

type Props = {
  articleId: number;
  sections: Section[];
  onSectionSaved?: () => void;
};

export function SectionEditor({ articleId, sections: initialSections, onSectionSaved }: Props) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [activeIndex, setActiveIndex] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const section = sections.find((s) => s.sectionIndex === activeIndex);
  const isGatedSection = activeIndex >= 6;

  async function saveSection() {
    if (!section) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionIndex: section.sectionIndex,
          title: section.title,
          body: section.body,
          isGated: section.isGated,
          preview: section.preview,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save section");
      }
      onSectionSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateLocal(field: keyof Section, value: string | boolean | null) {
    setSections((prev) =>
      prev.map((s) =>
        s.sectionIndex === activeIndex ? { ...s, [field]: value } : s
      )
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="flex flex-col gap-1 border-r border-[var(--color-border-hairline)] pr-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Sections 1–7
        </p>
        {[1, 2, 3, 4, 5, 6, 7].map((idx) => {
          const s = sections.find((x) => x.sectionIndex === idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`rounded-lg px-3 py-2 text-left text-sm ${
                activeIndex === idx
                  ? "bg-[var(--color-surface)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--color-surface)]/50"
              }`}
            >
              {s?.title?.trim() || `Section ${idx}`}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {section && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Section title
              </label>
              <Input
                value={section.title ?? ""}
                onChange={(e) => updateLocal("title", e.target.value || null)}
                placeholder={`Section ${section.sectionIndex}`}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Body (markdown / plain text)
              </label>
              <Textarea
                value={section.body}
                onChange={(e) => updateLocal("body", e.target.value)}
                rows={12}
                className="w-full font-mono text-sm"
              />
            </div>
            {isGatedSection && (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={section.isGated}
                    onChange={(e) => updateLocal("isGated", e.target.checked)}
                    className="rounded border-[var(--color-border-hairline)]"
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Gated (paywalled)
                  </span>
                </label>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Preview text (required for gated) *
                  </label>
                  <Textarea
                    value={section.preview ?? ""}
                    onChange={(e) => updateLocal("preview", e.target.value || null)}
                    rows={3}
                    placeholder="Short preview shown to visitors before paywall"
                    className="w-full"
                  />
                </div>
              </>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="button"
              onClick={saveSection}
              disabled={saving}
              className="rounded-[14px] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save section"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

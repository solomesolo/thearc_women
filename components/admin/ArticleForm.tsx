"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type TagOption = { id: number; slug: string; label: string };
type TagsByType = Record<string, TagOption[]>;

type SourceRow = { label: string; url: string; evidenceNote: string };

type Props = {
  initial?: {
    title: string;
    slug: string;
    excerpt: string;
    pillar: string;
    category: string;
    evidenceLevel: string;
    studyTypes: string;
    consensusStatus: string;
    coverImageUrl: string;
    tagIds: number[];
    lensMapping: string[];
    sources: SourceRow[];
  };
  articleId?: number;
  onSaved?: () => void;
};

const PILLAR_OPTIONS = [
  { value: "", label: "—" },
  { value: "Foundations", label: "Foundations" },
  { value: "Trending", label: "Trending" },
];

const EVIDENCE_OPTIONS = [
  { value: "", label: "—" },
  { value: "observational", label: "Observational" },
  { value: "randomized", label: "Randomized" },
  { value: "expert-opinion", label: "Expert opinion" },
];

export function ArticleForm({ initial, articleId, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [pillar, setPillar] = useState(initial?.pillar ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [evidenceLevel, setEvidenceLevel] = useState(initial?.evidenceLevel ?? "");
  const [studyTypes, setStudyTypes] = useState(initial?.studyTypes ?? "");
  const [consensusStatus, setConsensusStatus] = useState(initial?.consensusStatus ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [tagIds, setTagIds] = useState<number[]>(initial?.tagIds ?? []);
  const [lensMapping, setLensMapping] = useState<string[]>(initial?.lensMapping ?? []);
  const [sources, setSources] = useState<SourceRow[]>(
    initial?.sources?.length ? initial.sources : [{ label: "", url: "", evidenceNote: "" }]
  );
  const [tagsByType, setTagsByType] = useState<TagsByType>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTagsByType)
      .catch(() => setTagsByType({}));
  }, []);

  const allTags: TagOption[] = Object.values(tagsByType).flat();
  const allSlugs = allTags.map((t) => t.slug);

  function toggleTag(id: number) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleLens(slug: string) {
    setLensMapping((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function addSource() {
    setSources((prev) => [...prev, { label: "", url: "", evidenceNote: "" }]);
  }

  function updateSource(i: number, field: keyof SourceRow, value: string) {
    setSources((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function removeSource(i: number) {
    setSources((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim(),
      pillar: pillar.trim() || undefined,
      category: category.trim() || undefined,
      evidenceLevel: evidenceLevel.trim() || undefined,
      studyTypes: studyTypes.trim() || undefined,
      consensusStatus: consensusStatus.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      tagIds,
      lensMapping,
      sources: sources.filter((s) => s.label.trim()).map((s) => ({
        label: s.label.trim(),
        url: s.url.trim() || undefined,
        evidenceNote: s.evidenceNote.trim() || undefined,
      })),
    };

    try {
      if (articleId) {
        const res = await fetch(`/api/admin/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to save");
        }
        onSaved?.();
      } else {
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create");
        }
        const created = await res.json();
        window.location.href = `/admin/articles/${created.id}`;
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-500/60 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Slug (auto from title if empty)
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-slug"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
          Excerpt *
        </label>
        <Textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={3}
          className="w-full"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Pillar
          </label>
          <select
            value={pillar}
            onChange={(e) => setPillar(e.target.value)}
            className="w-full rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)]"
          >
            {PILLAR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Category
          </label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Evidence level
          </label>
          <select
            value={evidenceLevel}
            onChange={(e) => setEvidenceLevel(e.target.value)}
            className="w-full rounded-[10px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-2.5 text-base text-[var(--text-primary)]"
          >
            {EVIDENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Study types
          </label>
          <Input
            value={studyTypes}
            onChange={(e) => setStudyTypes(e.target.value)}
            placeholder="e.g. observational, randomized"
            className="w-full"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Consensus status
          </label>
          <Input
            value={consensusStatus}
            onChange={(e) => setConsensusStatus(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Cover image URL
          </label>
          <div className="flex gap-2">
            <Input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://… or upload below"
              className="flex-1"
            />
            <label className="cursor-pointer rounded-[14px] border border-[var(--color-border-hairline)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--color-surface)]/50">
              Upload
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const form = new FormData();
                  form.set("file", f);
                  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.url) setCoverImageUrl(data.url);
                  else if (data.error) setError(data.error);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          Taxonomy tags
        </label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <label key={t.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border-hairline)] px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={tagIds.includes(t.id)}
                onChange={() => toggleTag(t.id)}
                className="rounded border-[var(--color-border-hairline)]"
              />
              <span className="text-[var(--text-primary)]">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          Lens mapping (tag slugs)
        </label>
        <div className="flex flex-wrap gap-2">
          {allSlugs.map((s) => (
            <label key={s} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border-hairline)] px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={lensMapping.includes(s)}
                onChange={() => toggleLens(s)}
                className="rounded border-[var(--color-border-hairline)]"
              />
              <span className="text-[var(--text-primary)]">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Sources
          </label>
          <button
            type="button"
            onClick={addSource}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            + Add source
          </button>
        </div>
        <div className="space-y-3">
          {sources.map((s, i) => (
            <div key={i} className="flex flex-wrap gap-3 rounded-lg border border-[var(--color-border-hairline)] p-3">
              <Input
                value={s.label}
                onChange={(e) => updateSource(i, "label", e.target.value)}
                placeholder="Label (e.g. Lancet 2024)"
                className="min-w-[140px] flex-1"
              />
              <Input
                value={s.url}
                onChange={(e) => updateSource(i, "url", e.target.value)}
                placeholder="URL"
                className="min-w-[180px] flex-1"
              />
              <Input
                value={s.evidenceNote}
                onChange={(e) => updateSource(i, "evidenceNote", e.target.value)}
                placeholder="Evidence note"
                className="min-w-[120px] flex-1"
              />
              <button
                type="button"
                onClick={() => removeSource(i)}
                className="text-sm text-[var(--text-secondary)] hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[14px] bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background)] disabled:opacity-60"
        >
          {saving ? "Saving…" : articleId ? "Save draft" : "Create draft"}
        </button>
      </div>
    </form>
  );
}

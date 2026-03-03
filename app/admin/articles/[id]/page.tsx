"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { SectionEditor } from "@/components/admin/SectionEditor";

type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  pillar: string | null;
  category: string | null;
  evidenceLevel: string | null;
  studyTypes: string | null;
  consensusStatus: string | null;
  coverImageUrl: string | null;
  lensMapping: string[];
  isPublished: boolean;
  isArchived: boolean;
  publishedAt: string | null;
  sections: {
    id: number;
    sectionIndex: number;
    title: string | null;
    body: string;
    isGated: boolean;
    preview: string | null;
  }[];
  sources: { id: number; label: string; url: string | null; evidenceNote: string | null }[];
  tags: { id: number; slug: string; label: string; type: string }[];
};

export default function EditArticlePage() {
  const params = useParams();
  const id = Number(params.id);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id || !Number.isInteger(id)) return;
    fetch(`/api/admin/articles/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePublish(action: "publish" | "unpublish" | "archive") {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const refetch = await fetch(`/api/admin/articles/${id}`);
        if (refetch.ok) setArticle(await refetch.json());
      }
    } finally {
      setPublishing(false);
    }
  }

  if (loading || !article) {
    return (
      <div className="py-8">
        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Article not found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
          >
            ← Articles
          </Link>
          <h1 className="text-xl font-medium text-[var(--text-primary)]">
            Edit: {article.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/blog/${article.slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[14px] border border-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] no-underline hover:bg-[var(--foreground)]/0.06"
          >
            Preview
          </a>
          {!article.isPublished && (
            <button
              type="button"
              onClick={() => handlePublish("publish")}
              disabled={publishing}
              className="rounded-[14px] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-60"
            >
              Publish
            </button>
          )}
          {article.isPublished && (
            <button
              type="button"
              onClick={() => handlePublish("unpublish")}
              disabled={publishing}
              className="rounded-[14px] border border-[var(--foreground)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-60"
            >
              Unpublish
            </button>
          )}
          {!article.isArchived && (
            <button
              type="button"
              onClick={() => handlePublish("archive")}
              disabled={publishing}
              className="text-sm text-[var(--text-secondary)] hover:underline"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">
          Metadata
        </h2>
        <ArticleForm
          articleId={id}
          initial={{
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            pillar: article.pillar ?? "",
            category: article.category ?? "",
            evidenceLevel: article.evidenceLevel ?? "",
            studyTypes: article.studyTypes ?? "",
            consensusStatus: article.consensusStatus ?? "",
            coverImageUrl: article.coverImageUrl ?? "",
            tagIds: article.tags.map((t) => t.id),
            lensMapping: article.lensMapping,
            sources: article.sources.map((s) => ({
              label: s.label,
              url: s.url ?? "",
              evidenceNote: s.evidenceNote ?? "",
            })),
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">
          Sections (1–7)
        </h2>
        <SectionEditor
          articleId={id}
          sections={article.sections}
        />
      </section>
    </div>
  );
}

/**
 * ArticleTemplate — modular, dashboard-style article page shell.
 *
 * Section routing (by sectionIndex):
 *   1 + 2   → SplitInsightCard  ("Why this matters")
 *   3       → InsightSection    (frameLabel: "Science overview")
 *   4       → InsightSection    (frameLabel: "Practical meaning")
 *   5 + 6   → ApplicabilityPair ("Who this applies to")
 *   ── ActionTransition bridge ──
 *   7       → GatedSection      (Implementation)
 *   8       → StructuredBodyCard / GatedSection (Action Protocol)
 *   9       → StructuredBodyCard / GatedSection (Tracking Framework)
 *
 * All text content is passed through unchanged.
 */

import Link from "next/link";
import { GatedSection } from "@/components/blog/GatedSection";
import { SourcesList } from "@/components/blog/SourcesList";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { ArticleHero } from "@/components/blog/article-ui/ArticleHero";
import { ArticleNav } from "@/components/blog/article-ui/ArticleNav";
import { InsightSection } from "@/components/blog/article-ui/InsightSection";
import { SplitInsightCard } from "@/components/blog/article-ui/SplitInsightCard";
import { ApplicabilityPair } from "@/components/blog/article-ui/ApplicabilityPair";
import { ActionTransition } from "@/components/blog/article-ui/ActionTransition";
import { StructuredBodyCard } from "@/components/blog/article-ui/StructuredBodyCard";
import { TrustCue } from "@/components/blog/article-ui/TrustCue";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = {
  sectionIndex: number;
  title: string | null;
  body: string;
  isGated: boolean;
  preview?: string;
};

type Source = {
  id?: number;
  label: string;
  url?: string | null;
  evidenceNote?: string | null;
};

type TagItem = { slug: string; label: string; type: string };

type RelatedArticle = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  publishedAt: string | null;
  readingTimeMinutes?: number | null;
  tags: TagItem[];
};

type ArticleTemplateProps = {
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  evidenceLevel: string | null;
  publishedAt: Date | null;
  readingTimeMinutes?: number | null;
  tags: TagItem[];
  sections: Section[];
  sources: Source[];
  relatedArticles: RelatedArticle[];
  isSubscriber?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function byIndex(sections: Section[], idx: number): Section | undefined {
  return sections.find((s) => s.sectionIndex === idx);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArticleTemplate({
  slug: _slug,
  title,
  excerpt,
  category,
  evidenceLevel,
  publishedAt,
  readingTimeMinutes,
  tags,
  sections,
  sources,
  relatedArticles,
  isSubscriber = false,
}: ArticleTemplateProps) {
  // Nav receives all sections (title only — no body)
  const navSections = sections.map((s) => ({
    sectionIndex: s.sectionIndex,
    title: s.title,
    isGated: s.isGated,
  }));

  // Section lookups
  const s1 = byIndex(sections, 1);
  const s2 = byIndex(sections, 2);
  const s3 = byIndex(sections, 3);
  const s4 = byIndex(sections, 4);
  const s5 = byIndex(sections, 5);
  const s6 = byIndex(sections, 6);
  const s7 = byIndex(sections, 7);
  const s8 = byIndex(sections, 8);
  const s9 = byIndex(sections, 9);

  // Any gated section exists
  const hasActionZone = !!(s7 || s8 || s9);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <article className="pb-20">
        {/* ── Above-the-fold hero ── */}
        <ArticleHero
          title={title}
          excerpt={excerpt}
          category={category}
          evidenceLevel={evidenceLevel}
          publishedAt={publishedAt}
          readingTimeMinutes={readingTimeMinutes}
          tags={tags}
          sections={navSections}
          isSubscriber={isSubscriber}
        />

        {/* ── Sticky section navigation ── */}
        <ArticleNav sections={navSections} />

        {/* ── Content sections ── */}
        <div className="mt-2 flex flex-col gap-4 md:gap-5">

          {/* Sections 1 + 2 — Why this matters (split card) */}
          {(s1 || s2) && (
            <SplitInsightCard
              left={s1 ? { sectionIndex: s1.sectionIndex, title: s1.title, body: s1.body } : null}
              right={s2 ? { sectionIndex: s2.sectionIndex, title: s2.title, body: s2.body } : null}
            />
          )}

          {/* Section 3 — What research says */}
          {s3 && (
            <InsightSection
              sectionIndex={s3.sectionIndex}
              title={s3.title}
              body={s3.body}
              frameLabel="Science overview"
            />
          )}

          {/* Section 4 — What this means for women */}
          {s4 && (
            <InsightSection
              sectionIndex={s4.sectionIndex}
              title={s4.title}
              body={s4.body}
              frameLabel="Practical meaning"
            />
          )}

          {/* Sections 5 + 6 — When it applies / When to be careful */}
          {(s5 || s6) && (
            <ApplicabilityPair
              mayApply={s5 ?? null}
              mayCaution={s6 ?? null}
              isSubscriber={isSubscriber}
            />
          )}

          {/* ── Action zone transition ── */}
          {hasActionZone && <ActionTransition isSubscriber={isSubscriber} />}

          {/* Section 7 — Implementation considerations (gated) */}
          {s7 && (
            <GatedSection
              sectionIndex={s7.sectionIndex}
              title={s7.title}
              body={s7.body}
              isGated={s7.isGated}
              preview={s7.preview}
              isSubscriber={isSubscriber}
            />
          )}

          {/* Section 8 — Action Protocol */}
          {s8 && (isSubscriber || !s8.isGated ? (
            <StructuredBodyCard
              sectionIndex={s8.sectionIndex}
              title={s8.title}
              body={s8.body}
            />
          ) : (
            <GatedSection
              sectionIndex={s8.sectionIndex}
              title={s8.title}
              body={s8.body}
              isGated={s8.isGated}
              preview={s8.preview}
              isSubscriber={isSubscriber}
            />
          ))}

          {/* Section 9 — Tracking Framework */}
          {s9 && (isSubscriber || !s9.isGated ? (
            <StructuredBodyCard
              sectionIndex={s9.sectionIndex}
              title={s9.title}
              body={s9.body}
            />
          ) : (
            <GatedSection
              sectionIndex={s9.sectionIndex}
              title={s9.title}
              body={s9.body}
              isGated={s9.isGated}
              preview={s9.preview}
              isSubscriber={isSubscriber}
            />
          ))}
        </div>

        {/* ── Trust cue ── */}
        <div className="mt-8">
          <TrustCue />
        </div>

        {/* ── Sources / citations ── */}
        {sources.length > 0 && (
          <div className="mt-6">
            <SourcesList sources={sources} defaultOpen={false} />
          </div>
        )}
      </article>

      {/* ── Related articles ── */}
      {relatedArticles.length > 0 && (
        <aside className="border-t border-[var(--color-border-hairline)] pt-10 pb-20">
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Related insights
            </h2>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              By shared focus and tags
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.slice(0, 3).map((a) => (
              <ArticleCard
                key={a.id}
                slug={a.slug}
                title={a.title}
                excerpt={a.excerpt}
                category={a.category}
                tags={a.tags}
                publishedAt={a.publishedAt}
                readingTimeMinutes={a.readingTimeMinutes}
              />
            ))}
          </div>
        </aside>
      )}
    </main>
  );
}

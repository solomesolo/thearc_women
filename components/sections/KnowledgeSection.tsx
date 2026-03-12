"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { homepageContent } from "@/content/homepage";
import {
  KNOWLEDGE_ARTICLES,
  getArticlesForFocusLens,
} from "@/content/knowledge";
import { getLensTitleFromInput } from "@/lib/startingLensEngine";
import type { KnowledgeArticle } from "@/content/knowledge";
import type { CycleContext, LifeStage, TrainingVolume, Wearable } from "@/lib/startingLensEngine/types";

const PERSONALIZATION_STORAGE_KEY = "arc-personalization";
const defaultContent = homepageContent.knowledge;

type KnowledgeSectionProps = {
  headline?: string;
  subline?: string;
  trendChips?: readonly string[];
  problemLine?: string;
  pivotLine?: string;
  coreValueIntro?: string;
  coreValueBullets?: readonly string[];
  coreValueClosing?: readonly string[];
  feedTitleDefault?: string;
  feedTitlePersonalized?: string;
  feedSublinePersonalized?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function KnowledgeSection({
  headline = defaultContent.headline,
  subline = defaultContent.subline,
  trendChips = defaultContent.trendChips,
  problemLine = defaultContent.problemLine,
  pivotLine = defaultContent.pivotLine,
  coreValueIntro = defaultContent.coreValueIntro,
  coreValueBullets = defaultContent.coreValueBullets,
  coreValueClosing = defaultContent.coreValueClosing,
  feedTitleDefault = defaultContent.feedTitleDefault,
  feedTitlePersonalized = defaultContent.feedTitlePersonalized,
  feedSublinePersonalized = defaultContent.feedSublinePersonalized,
  ctaLabel = defaultContent.ctaLabel,
  ctaHref = defaultContent.ctaHref,
}: KnowledgeSectionProps) {
  const [focusLensTitle, setFocusLensTitle] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        goals?: string[];
        signals?: string[];
        symptoms?: string[];
        changes?: string[];
        cycleContext?: string | null;
        lifeStage?: string | null;
        trainingVolume?: string | null;
        wearable?: string | null;
      };
      const goals = data.goals ?? [];
      const symptoms = data.symptoms ?? data.signals ?? [];
      const changes = data.changes ?? [];
      const hasSelection =
        goals.length > 0 || symptoms.length > 0 || changes.length > 0;
      if (!hasSelection) return;
      const input = {
        goals,
        symptoms,
        changes,
        cycleContext: data.cycleContext as CycleContext | undefined,
        lifeStage: data.lifeStage as LifeStage | undefined,
        trainingVolume: data.trainingVolume as TrainingVolume | undefined,
        wearable: data.wearable as Wearable | undefined,
      };
      const lensTitle = getLensTitleFromInput(input);
      setFocusLensTitle(lensTitle);
    } catch {
      // ignore
    }
  }, [mounted]);

  const articles: KnowledgeArticle[] = focusLensTitle
    ? getArticlesForFocusLens(focusLensTitle)
    : KNOWLEDGE_ARTICLES.slice(0, 4);
  const isPersonalized = !!focusLensTitle;
  const feedTitle = isPersonalized ? feedTitlePersonalized : feedTitleDefault;

  return (
    <Section id="knowledge" variant="default" className="py-16 md:py-24">
      <Container>
        {/* Short editorial intro — centered, narrow */}
        <div className="mx-auto max-w-[38rem] text-center">
          <h2 className="text-[1.875rem] font-medium leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-[2.25rem] md:leading-[1.15] lg:text-[2.75rem]">
            {headline}
          </h2>
          <p className="mt-4 text-base leading-[1.65] text-[var(--text-secondary)] md:mt-5 md:text-lg md:leading-[1.7]">
            {subline}
          </p>
        </div>

        {/* Interactive trend recognition — chips */}
        <div className="mx-auto mt-10 max-w-[38rem] md:mt-12">
          <p className="text-center text-sm font-medium text-[var(--text-secondary)]">
            You've probably seen:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(trendChips ?? []).map((chip, i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--color-border-hairline)] bg-[var(--background)] px-3.5 py-1.5 text-sm text-[var(--text-secondary)]"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-5 text-center text-[1rem] leading-[1.6] text-[var(--text-primary)] md:text-[1.0625rem]">
            {problemLine}
          </p>
        </div>

        {/* Pivot — large typography */}
        <p className="mx-auto mt-10 max-w-[38rem] text-center text-[1.5rem] font-medium leading-[1.25] tracking-tight text-[var(--text-primary)] md:mt-12 md:text-[1.75rem] lg:text-[2rem]">
          {pivotLine}
        </p>

        {/* Core value block */}
        <div className="mx-auto mt-10 max-w-[38rem] md:mt-12">
          <p className="text-center text-sm font-medium text-[var(--text-primary)]">
            {coreValueIntro}
          </p>
          <ul className="mt-3 list-none space-y-1.5 pl-0 text-center text-base leading-[1.6] text-[var(--text-secondary)]">
            {(coreValueBullets ?? []).map((item, i) => (
              <li key={i} className="flex justify-center gap-2">
                <span className="text-[var(--text-primary)]">•</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 text-center text-[0.95rem] leading-[1.65] text-[var(--text-secondary)] md:text-base">
            {(coreValueClosing ?? []).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {/* Adaptive article grid */}
        <div className="mx-auto mt-14 max-w-5xl md:mt-16">
          <p className="text-left text-sm font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {feedTitle}
          </p>
          {isPersonalized && focusLensTitle && (
            <p className="mt-1 text-left text-sm text-[var(--text-secondary)]">
              {feedSublinePersonalized} {focusLensTitle}
            </p>
          )}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((article, i) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="block rounded-[12px] border border-[var(--color-border-hairline)] bg-[var(--background)] px-4 py-5 transition-colors hover:border-[var(--text-primary)]/20"
              >
                <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  {article.category}
                </p>
                <h3 className="mt-2 text-left text-[1rem] font-medium leading-[1.35] text-[var(--text-primary)] md:text-[1.0625rem]">
                  {article.title}
                </h3>
                <p className="mt-2 text-left text-sm leading-[1.55] text-[var(--text-secondary)]">
                  {article.abstract}
                </p>
                <p className="mt-3 text-left text-xs text-[var(--text-secondary)]">
                  {article.readTime} read
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-left">
            <Link
              href={ctaHref ?? "/blog"}
              className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--foreground)] bg-transparent px-5 py-3 text-base font-medium text-[var(--text-primary)] no-underline transition-colors hover:bg-[var(--foreground)]/0.06 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
            >
              {ctaLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

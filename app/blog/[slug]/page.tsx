import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ArticleTemplate } from "@/components/blog/ArticleTemplate";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserAccess } from "@/lib/auth";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, isPublished: true, isArchived: false },
    select: { title: true, excerpt: true },
  });
  if (!article) return { title: "Article | The Arc" };
  const description =
    article.excerpt.length > 160
      ? article.excerpt.slice(0, 157).trim() + "…"
      : article.excerpt;
  return {
    title: `${article.title} | The Arc`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
    },
  };
}

export default async function BlogArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const preview = sp?.preview === "1";
  const session = preview ? await getServerSession(authOptions) : null;
  const isAdminPreview = preview && !!session;
  const { isSubscriber } = await getUserAccess();

  const getArticle = async () =>
    prisma.article.findFirst({
      where: {
        slug,
        ...(isAdminPreview ? {} : { isPublished: true, isArchived: false }),
      },
      include: {
        sections: { orderBy: { sectionIndex: "asc" } },
        sources: true,
        tagJoins: { include: { tag: true } },
      },
    });

  const article = isAdminPreview
    ? await getArticle()
    : await unstable_cache(getArticle, ["blog-article", slug], { revalidate: 60 })();

  if (!article) notFound();

  const tagIds = article.tagJoins.map((j) => j.tagId);
  const getRelated = () =>
    tagIds.length > 0
      ? prisma.article.findMany({
          where: {
            isPublished: true,
            isArchived: false,
            id: { not: article.id },
            tagJoins: { some: { tagId: { in: tagIds } } },
          },
          take: 3,
          orderBy: { publishedAt: "desc" },
          include: { tagJoins: { include: { tag: true } } },
        })
      : Promise.resolve([]);

  const related = isAdminPreview
    ? await getRelated()
    : await unstable_cache(getRelated, ["blog-related", slug], { revalidate: 60 })();

  const sections = article.sections.map((s) => ({
    sectionIndex: s.sectionIndex,
    title: s.title,
    body: s.body,
    isGated: s.isGated,
    preview: s.preview ?? undefined,
  }));

  const sources = article.sources.map((s) => ({
    id: s.id,
    label: s.label,
    url: s.url,
    evidenceNote: s.evidenceNote,
  }));

  const tags = article.tagJoins.map((j) => ({
    slug: j.tag.slug,
    label: j.tag.label,
    type: j.tag.type,
  }));

  const toIso = (d: Date | string | null | undefined): string | null =>
    d == null ? null : typeof d === "string" ? d : d instanceof Date ? d.toISOString() : null;

  const relatedArticles = related.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    publishedAt: toIso(a.publishedAt),
    readingTimeMinutes: a.readingTimeMinutes ?? null,
    tags: a.tagJoins.map((j) => ({
      slug: j.tag.slug,
      label: j.tag.label,
      type: j.tag.type,
    })),
  }));

  return (
    <Container className="py-10 md:py-14">
      <ArticleTemplate
        slug={article.slug}
        title={article.title}
        excerpt={article.excerpt}
        category={article.category}
        evidenceLevel={article.evidenceLevel}
        publishedAt={article.publishedAt}
        readingTimeMinutes={article.readingTimeMinutes}
        tags={tags}
        sections={sections}
        sources={sources}
        relatedArticles={relatedArticles}
        isSubscriber={isSubscriber}
      />
    </Container>
  );
}

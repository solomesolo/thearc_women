import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type {
  ArticleSummary,
  SavedArticleItem,
  CollectionWithCount,
  CollectionDetail,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const articleSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  evidenceLevel: true,
  readingTimeMinutes: true,
  publishedAt: true,
  tagJoins: { include: { tag: true } },
} as const;

function toArticleSummary(a: {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  evidenceLevel: string | null;
  readingTimeMinutes: number | null;
  publishedAt: Date | null;
  tagJoins: { tag: { slug: string; label: string; type: string } }[];
}): ArticleSummary {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    evidenceLevel: a.evidenceLevel,
    readingTimeMinutes: a.readingTimeMinutes,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    tags: a.tagJoins.map((j) => ({
      slug: j.tag.slug,
      label: j.tag.label,
      type: String(j.tag.type),
    })),
  };
}

// ─── Recently Viewed ──────────────────────────────────────────────────────────

export async function getRecentlyViewed(
  email: string,
  limit = 8
): Promise<ArticleSummary[]> {
  // Raw SQL: Prisma 7 + adapter-pg can throw bogus "column (not available)" on generated queries
  // for snake_case-mapped tables (article_views).
  const take = limit * 3;
  const rows = await prisma.$queryRaw<{ article_id: number; viewed_at: Date }[]>(
    Prisma.sql`
      SELECT article_id, viewed_at
      FROM article_views
      WHERE email = ${email}
      ORDER BY viewed_at DESC
      LIMIT ${take}
    `
  );

  const seen = new Set<number>();
  const dedupedIds: number[] = [];
  for (const r of rows) {
    const aid = r.article_id;
    if (!seen.has(aid)) {
      seen.add(aid);
      dedupedIds.push(aid);
      if (dedupedIds.length >= limit) break;
    }
  }

  if (dedupedIds.length === 0) return [];

  const articles = await prisma.article.findMany({
    where: { id: { in: dedupedIds }, isPublished: true, isArchived: false },
    select: articleSelect,
  });

  // Preserve view order
  const byId = new Map(articles.map((a) => [a.id, a]));
  return dedupedIds.flatMap((id) => {
    const a = byId.get(id);
    return a ? [toArticleSummary(a)] : [];
  });
}

export async function upsertArticleView(
  email: string,
  articleId: number
): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO article_views (email, article_id)
      VALUES (${email}, ${articleId})
    `
  );
}

// ─── Saved Articles ───────────────────────────────────────────────────────────

export async function getSavedArticles(email: string): Promise<SavedArticleItem[]> {
  const rows = await prisma.$queryRaw<{ id: number; article_id: number; saved_at: Date }[]>(
    Prisma.sql`
      SELECT id, article_id, saved_at
      FROM saved_articles
      WHERE email = ${email}
      ORDER BY saved_at DESC
    `
  );

  if (rows.length === 0) return [];

  const articleIds = [...new Set(rows.map((r) => r.article_id))];
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: articleSelect,
  });
  const byId = new Map(articles.map((a) => [a.id, a]));

  return rows.flatMap((r) => {
    const article = byId.get(r.article_id);
    if (!article) return [];
    return [
      {
        id: r.id,
        articleId: r.article_id,
        savedAt: r.saved_at.toISOString(),
        article: toArticleSummary(article),
      },
    ];
  });
}

export async function isSaved(email: string, articleId: number): Promise<boolean> {
  const found = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT id FROM saved_articles
      WHERE email = ${email} AND article_id = ${articleId}
      LIMIT 1
    `
  );
  return found.length > 0;
}

export async function toggleSave(
  email: string,
  articleId: number
): Promise<{ saved: boolean }> {
  const existing = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT id FROM saved_articles
      WHERE email = ${email} AND article_id = ${articleId}
      LIMIT 1
    `
  );

  if (existing[0]) {
    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM saved_articles WHERE id = ${existing[0].id}`
    );
    return { saved: false };
  }

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO saved_articles (email, article_id)
      VALUES (${email}, ${articleId})
    `
  );
  return { saved: true };
}

export async function unsaveArticle(email: string, articleId: number): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`
      DELETE FROM saved_articles
      WHERE email = ${email} AND article_id = ${articleId}
    `
  );
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getCollections(email: string): Promise<CollectionWithCount[]> {
  const rows = await prisma.$queryRaw<
    {
      id: number;
      name: string;
      color_key: string;
      created_at: Date;
      article_count: number;
    }[]
  >(
    Prisma.sql`
      SELECT c.id, c.name, c.color_key, c.created_at,
        (SELECT COUNT(*)::int FROM collection_articles ca WHERE ca.collection_id = c.id) AS article_count
      FROM collections c
      WHERE c.email = ${email}
      ORDER BY c.created_at DESC
    `
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    colorKey: r.color_key,
    articleCount: r.article_count,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function getCollection(
  email: string,
  id: number
): Promise<CollectionDetail | null> {
  const cols = await prisma.$queryRaw<
    { id: number; name: string; color_key: string; created_at: Date }[]
  >(
    Prisma.sql`
      SELECT id, name, color_key, created_at
      FROM collections
      WHERE id = ${id} AND email = ${email}
      LIMIT 1
    `
  );

  const col = cols[0];
  if (!col) return null;

  const countRows = await prisma.$queryRaw<{ c: number }[]>(
    Prisma.sql`
      SELECT COUNT(*)::int AS c FROM collection_articles WHERE collection_id = ${id}
    `
  );
  const articleCount = countRows[0]?.c ?? 0;

  const links = await prisma.$queryRaw<{ article_id: number }[]>(
    Prisma.sql`
      SELECT article_id FROM collection_articles WHERE collection_id = ${id} ORDER BY article_id ASC
    `
  );
  const articleIds = links.map((l) => l.article_id);
  const articles =
    articleIds.length === 0
      ? []
      : await prisma.article.findMany({
          where: { id: { in: articleIds } },
          select: articleSelect,
        });
  const byId = new Map(articles.map((a) => [a.id, a]));
  const ordered = articleIds.flatMap((aid) => {
    const a = byId.get(aid);
    return a ? [toArticleSummary(a)] : [];
  });

  return {
    id: col.id,
    name: col.name,
    colorKey: col.color_key,
    articleCount,
    createdAt: col.created_at.toISOString(),
    articles: ordered,
  };
}

export async function createCollection(
  email: string,
  name: string,
  colorKey = "stone"
): Promise<CollectionWithCount> {
  const inserted = await prisma.$queryRaw<
    { id: number; name: string; color_key: string; created_at: Date }[]
  >(
    Prisma.sql`
      INSERT INTO collections (email, name, color_key)
      VALUES (${email}, ${name}, ${colorKey})
      RETURNING id, name, color_key, created_at
    `
  );
  const row = inserted[0]!;
  return {
    id: row.id,
    name: row.name,
    colorKey: row.color_key,
    articleCount: 0,
    createdAt: row.created_at.toISOString(),
  };
}

export async function deleteCollection(email: string, id: number): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM collections WHERE id = ${id} AND email = ${email}`
  );
}

export async function addToCollection(
  email: string,
  collectionId: number,
  articleId: number
): Promise<void> {
  const col = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT id FROM collections WHERE id = ${collectionId} AND email = ${email} LIMIT 1
    `
  );
  if (!col[0]) throw new Error("Collection not found");

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO collection_articles (collection_id, article_id)
      VALUES (${collectionId}, ${articleId})
      ON CONFLICT (collection_id, article_id) DO NOTHING
    `
  );
}

export async function removeFromCollection(
  email: string,
  collectionId: number,
  articleId: number
): Promise<void> {
  const col = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      SELECT id FROM collections WHERE id = ${collectionId} AND email = ${email} LIMIT 1
    `
  );
  if (!col[0]) throw new Error("Collection not found");

  await prisma.$executeRaw(
    Prisma.sql`
      DELETE FROM collection_articles
      WHERE collection_id = ${collectionId} AND article_id = ${articleId}
    `
  );
}

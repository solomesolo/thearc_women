/**
 * MVP recommendation scoring: relevance of an article to a user profile.
 * Used when sort=relevant on /blog.
 */

type ArticleForScoring = {
  tags?: { slug: string }[];
  category?: string | null;
  pillar?: string | null;
};

type UserProfileForScoring = {
  generatedTags: string[];
  goals?: string[];
};

export function scoreArticle(
  article: ArticleForScoring,
  userProfile: UserProfileForScoring | null
): number {
  if (!userProfile?.generatedTags?.length) return 0;

  const tagSlugs = new Set(
    (article.tags ?? []).map((t) => t.slug.toLowerCase().trim())
  );
  const profileTags = new Set(
    userProfile.generatedTags.map((t) => t.toLowerCase().trim())
  );

  let score = 0;
  for (const slug of tagSlugs) {
    if (profileTags.has(slug)) score++;
  }
  return score;
}

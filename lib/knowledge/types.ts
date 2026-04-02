export type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  evidenceLevel: string | null;
  readingTimeMinutes: number | null;
  publishedAt: string | null;
  tags: { slug: string; label: string; type: string }[];
};

export type SavedArticleItem = {
  id: number;
  articleId: number;
  savedAt: string;
  article: ArticleSummary;
};

export type CollectionWithCount = {
  id: number;
  name: string;
  colorKey: string;
  articleCount: number;
  createdAt: string;
};

export type CollectionDetail = CollectionWithCount & {
  articles: ArticleSummary[];
};

export type PlanSummary = {
  id: number;
  name: string;
  status: string;
  sourceType: string | null;
  itemCount: number;
  doneCount: number;
  createdAt: string;
};

export type PlanItemRow = {
  id: number;
  title: string;
  description: string | null;
  timing: string;
  sortOrder: number;
  isDone: boolean;
  articleId: number | null;
  articleSlug: string | null;
  articleTitle: string | null;
};

export type PlanDetail = PlanSummary & {
  items: PlanItemRow[];
};

export type ActionLogRow = {
  id: number;
  planId: number | null;
  itemId: number | null;
  note: string | null;
  loggedAt: string;
};

export type NotificationRow = {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
};

export type KnowledgeDashboardData = {
  isLoggedIn: boolean;
  recentlyViewed: ArticleSummary[];
  saved: SavedArticleItem[];
  collections: CollectionWithCount[];
  unreadNotifications: number;
};

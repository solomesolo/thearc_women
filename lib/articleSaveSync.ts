/** Dispatched when an article save toggles so hero + sticky bar stay in sync. */
export const ARTICLE_SAVE_EVENT = "thearc-article-saved";

export type ArticleSaveDetail = { articleId: number; saved: boolean };

export function dispatchArticleSaved(detail: ArticleSaveDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ArticleSaveDetail>(ARTICLE_SAVE_EVENT, { detail }));
}

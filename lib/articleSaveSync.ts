/** Dispatched when an article save toggles so hero + sticky bar stay in sync. */
export const ARTICLE_SAVE_EVENT = "thearc-article-saved";

export type ArticleSaveDetail = { articleId: number; saved: boolean };

export function dispatchArticleSaved(detail: ArticleSaveDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ArticleSaveDetail>(ARTICLE_SAVE_EVENT, { detail }));
}

/** After a successful save (newly saved), prompt to add action protocol to a health plan. */
export const POST_SAVE_PROTOCOL_EVENT = "thearc-post-save-protocol";

export type PostSaveProtocolDetail = { articleId: number };

export function dispatchPostSaveProtocolPrompt(detail: PostSaveProtocolDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PostSaveProtocolDetail>(POST_SAVE_PROTOCOL_EVENT, { detail }));
}

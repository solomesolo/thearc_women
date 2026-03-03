const WORDS_PER_MINUTE = 200;

/** Count words in plain text (split on whitespace). */
function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Compute reading time in minutes from excerpt and section bodies.
 * Uses 200 wpm; minimum 1 minute.
 */
export function computeReadingTimeMinutes(
  excerpt: string,
  sectionBodies: string[]
): number {
  const excerptWords = wordCount(excerpt ?? "");
  const bodyWords = (sectionBodies ?? []).reduce((sum, b) => sum + wordCount(b ?? ""), 0);
  const total = excerptWords + bodyWords;
  return Math.max(1, Math.ceil(total / WORDS_PER_MINUTE));
}

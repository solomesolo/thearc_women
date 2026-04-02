/** Strip markdown bold markers (`**`) for plain-text UI. */
export function stripMarkdownBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, "");
}

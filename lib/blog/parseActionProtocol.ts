/**
 * Shared parsers for Action Protocol (section 8) markdown — used by StructuredBodyCard
 * and server/client extraction for health plan items.
 */
import { stripMarkdownBoldMarkers } from "@/lib/stripMarkdownBoldMarkers";

export type HeadingBlock = {
  heading: string;
  level: number;
  content: string;
};

export function parseMarkdownHeadingBlocks(body: string): HeadingBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: HeadingBlock[] = [];
  let current: { heading: string; level: number; contentLines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    blocks.push({
      heading: current.heading,
      level: current.level,
      content: current.contentLines.join("\n").trim(),
    });
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line.trim());
    if (m) {
      flush();
      current = { heading: m[2], level: m[1].length, contentLines: [] };
      continue;
    }
    if (!current) continue;
    current.contentLines.push(line);
  }

  flush();
  return blocks;
}

export function pickBlock(blocks: HeadingBlock[], name: string): HeadingBlock | null {
  const norm = (s: string) => s.trim().toLowerCase();
  const needle = norm(name);
  return blocks.find((b) => norm(b.heading) === needle) ?? null;
}

/** Section whose content feeds "Core actions to try" in the article UI (markdown heading varies). */
const KEY_ACTION_HEADING_EXACT = [
  "Key actions",
  "Core actions to try",
  "Core actions",
  "Actions to try",
  "Recommended actions",
];

export function pickKeyActionsBlock(blocks: HeadingBlock[]): HeadingBlock | null {
  for (const name of KEY_ACTION_HEADING_EXACT) {
    const b = pickBlock(blocks, name);
    if (b?.content?.trim()) return b;
  }
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const fuzzy = blocks.find((b) => {
    if (!b.content?.trim()) return false;
    const h = norm(b.heading);
    if (h.includes("key action")) return true;
    if (h.includes("core action")) return true;
    if (h.includes("action") && h.includes("try")) return true;
    return false;
  });
  return fuzzy ?? null;
}

export function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => stripMarkdownBoldMarkers(l.replace(/^[-*]\s+/, "").trim()));
}

export type ActionCardData = {
  title: string;
  why: string | null;
  practiceBullets: string[];
  who: string | null;
  mistake: string | null;
  rawRemainder: string | null;
};

export function blockText(block: HeadingBlock | null | undefined): string {
  return stripMarkdownBoldMarkers(block?.content?.trim() ?? "");
}

export function stripActionCard(action: ActionCardData): ActionCardData {
  return {
    title: stripMarkdownBoldMarkers(action.title),
    why: action.why ? stripMarkdownBoldMarkers(action.why) : null,
    practiceBullets: action.practiceBullets.map(stripMarkdownBoldMarkers),
    who: action.who ? stripMarkdownBoldMarkers(action.who) : null,
    mistake: action.mistake ? stripMarkdownBoldMarkers(action.mistake) : null,
    rawRemainder: action.rawRemainder ? stripMarkdownBoldMarkers(action.rawRemainder) : null,
  };
}

export function parseActionCards(keyActionsContent: string): ActionCardData[] {
  const src = keyActionsContent.replace(/\r\n/g, "\n").trim();
  if (!src) return [];

  const byH3 = src.split(/\n(?=###\s+)/g).map((s) => s.trim()).filter(Boolean);
  const chunks =
    byH3.length > 1 || byH3[0]?.startsWith("### ")
      ? byH3
      : src.split(/\n(?=\*\*[^*\n]{3,80}\*\*\s*$)/g).map((s) => s.trim()).filter(Boolean);

  return chunks
    .map((chunk) => {
      let title = "Action";
      let rest = chunk;

      const h3 = /^###\s+(.+?)\s*$/m.exec(chunk);
      if (h3) {
        title = h3[1].trim();
        rest = chunk.replace(/^###\s+(.+?)\s*$/m, "").trim();
      } else {
        const boldTitle = /^\*\*([^*\n]+)\*\*\s*$/m.exec(chunk);
        if (boldTitle) {
          title = boldTitle[1].trim();
          rest = chunk.replace(/^\*\*([^*\n]+)\*\*\s*$/m, "").trim();
        }
      }

      const section = (label: string): string | null => {
        const re = new RegExp(
          String.raw`(?:^|\n)\s*(?:\*\*)?${label}(?:\*\*)?\s*:?\s*(.+?)(?=\n\s*(?:\*\*)?(?:Why it matters|What it looks like in practice|Who this helps most|Who it may be especially useful for|Common mistake|Common mistake or caution)(?:\*\*)?\s*:?\s*|\n###\s+|\n\*\*[^*\n]+\*\*\s*$|$)`,
          "is"
        );
        const m = re.exec(rest);
        return m ? m[1].trim() : null;
      };

      const why =
        section("Why it matters") ??
        section("Why this matters");
      const practice =
        section("What it looks like in practice") ??
        section("What it looks like") ??
        null;
      const who =
        section("Who this helps most") ??
        section("Who it may be especially useful for") ??
        null;
      const mistake =
        section("Common mistake") ??
        section("Common mistake or caution") ??
        section("Caution") ??
        null;

      const practiceBullets = practice ? parseBullets(practice) : [];

      const consumedParts = [why, practice, who, mistake].filter(Boolean).join("\n");
      const rawRemainder =
        consumedParts.length === 0 ? rest : rest.replace(consumedParts, "").trim() || null;

      return {
        title,
        why: why ? why.split(/\n{2,}/)[0].trim() : null,
        practiceBullets,
        who: who ? who.split(/\n{2,}/)[0].trim() : null,
        mistake: mistake ? mistake.split(/\n{2,}/)[0].trim() : null,
        rawRemainder,
      } satisfies ActionCardData;
    })
    .filter((a) => a.title && (a.why || a.practiceBullets.length > 0 || a.who || a.mistake || a.rawRemainder));
}

const DESC_MAX = 12_000;

/**
 * Editorial / LLM variant: each action is a top-level bullet:
 * `- Action title: Establish Regular Meal Times`
 * followed by indented `Why it matters:`, `What it looks like in practice:`, etc.
 */
function parseBulletActionTitleFormat(raw: string): ActionCardData[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[][] = [];
  let cur: string[] | null = null;

  for (const line of lines) {
    const isStart =
      /^\s*[-*•]\s*Action title\s*:\s*.+$/i.test(line) ||
      /^\s*Action title\s*:\s*.+$/i.test(line);
    if (isStart) {
      if (cur?.length) blocks.push(cur);
      cur = [line];
    } else if (cur) {
      cur.push(line);
    }
  }
  if (cur?.length) blocks.push(cur);

  const cards: ActionCardData[] = [];
  for (const blockLines of blocks) {
    const card = parseActionTitleBulletBlock(blockLines);
    if (card) cards.push(card);
  }
  return cards;
}

function parseActionTitleBulletBlock(lines: string[]): ActionCardData | null {
  if (lines.length === 0) return null;
  const first = lines[0].trim();
  const titleM =
    /^[-*•]\s*Action title\s*:\s*(.+)$/i.exec(first) ?? /^Action title\s*:\s*(.+)$/i.exec(first);
  if (!titleM) return null;

  const title = stripMarkdownBoldMarkers(titleM[1].trim());
  let why: string | null = null;
  let practiceLine: string | null = null;
  let who: string | null = null;
  let mistake: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;

    let m = /^Why it matters\s*:\s*(.+)$/i.exec(t);
    if (m) {
      why = stripMarkdownBoldMarkers(m[1].trim());
      continue;
    }
    m = /^What it looks like in practice\s*:\s*(.+)$/i.exec(t);
    if (m) {
      practiceLine = stripMarkdownBoldMarkers(m[1].trim());
      continue;
    }
    m = /^Who this helps most\s*:\s*(.+)$/i.exec(t);
    if (m) {
      who = stripMarkdownBoldMarkers(m[1].trim());
      continue;
    }
    m = /^Who it may be especially useful for\s*:\s*(.+)$/i.exec(t);
    if (m) {
      who = stripMarkdownBoldMarkers(m[1].trim());
      continue;
    }
    m = /^Common mistake or caution\s*:\s*(.+)$/i.exec(t);
    if (m) {
      mistake = stripMarkdownBoldMarkers(m[1].trim());
      continue;
    }
    m = /^Common mistake\s*:\s*(.+)$/i.exec(t);
    if (m) {
      mistake = stripMarkdownBoldMarkers(m[1].trim());
      continue;
    }
  }

  const practiceBullets = practiceLine
    ? practiceLine.split(/\n/).map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    title: title || "Action",
    why,
    practiceBullets,
    who,
    mistake,
    rawRemainder: null,
  };
}

function actionCardToPlanItem(a: ActionCardData): { title: string; description: string } {
  const parts: string[] = [];
  if (a.why) parts.push(`Why it matters: ${a.why}`);
  if (a.practiceBullets.length > 0) {
    parts.push(
      `What it looks like in practice:\n${a.practiceBullets.map((b) => `• ${b}`).join("\n")}`
    );
  }
  if (a.who) parts.push(`Who this helps most: ${a.who}`);
  if (a.mistake) parts.push(`Common mistake or caution: ${a.mistake}`);
  if (parts.length === 0 && a.rawRemainder?.trim()) parts.push(a.rawRemainder.trim());

  const description = (parts.join("\n\n").trim() || "From article action protocol.").slice(0, DESC_MAX);
  const title = (a.title.trim().slice(0, 240) || "Action").trim();
  return { title, description };
}

/**
 * When structured fields don't match, split the Key actions section the same way as the UI
 * (### action titles or **bold** titles) into one plan item per block.
 */
function fallbackPlanItemsFromRawKeyActions(raw: string): { title: string; description: string }[] {
  const src = raw.replace(/\r\n/g, "\n").trim();
  if (!src) return [];

  const out: { title: string; description: string }[] = [];

  const byH3 = src.split(/\n(?=###\s+)/g).map((s) => s.trim()).filter(Boolean);
  const h3Chunks =
    byH3.length > 1 || byH3[0]?.startsWith("### ") ? byH3 : [];

  for (const chunk of h3Chunks) {
    const h3 = /^###\s+(.+?)\s*$/m.exec(chunk);
    if (!h3) continue;
    const title = stripMarkdownBoldMarkers(h3[1].trim());
    let rest = chunk.replace(/^###\s+.+?\s*$/m, "").trim();
    rest = stripMarkdownBoldMarkers(rest);
    if (title.length >= 2) {
      out.push({
        title: title.slice(0, 240),
        description: (rest || "From article action protocol.").slice(0, DESC_MAX),
      });
    }
  }
  if (out.length > 0) return out;

  const boldChunks = src.split(/\n(?=\*\*[^*\n]{3,80}\*\*\s*$)/g).map((s) => s.trim()).filter(Boolean);
  for (const chunk of boldChunks) {
    const boldTitle = /^\*\*([^*\n]+)\*\*\s*$/m.exec(chunk);
    if (!boldTitle) continue;
    const title = stripMarkdownBoldMarkers(boldTitle[1].trim());
    const rest = stripMarkdownBoldMarkers(chunk.replace(/^\*\*[^*\n]+\*\*\s*$/m, "").trim());
    if (title.length >= 2) {
      out.push({
        title: title.slice(0, 240),
        description: (rest || "From article action protocol.").slice(0, DESC_MAX),
      });
    }
  }

  return out;
}

function extractPlanItemsFromSectionContent(content: string): { title: string; description: string }[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // 1) `- Action title: …` bullets (common generated / editorial format)
  if (
    /[-*•]\s*Action title\s*:/i.test(trimmed) ||
    /^\s*Action title\s*:/im.test(trimmed)
  ) {
    const bulletCards = parseBulletActionTitleFormat(trimmed).map(stripActionCard);
    const fromBullets = bulletCards.map(actionCardToPlanItem).filter((x) => x.title.length > 0);
    if (fromBullets.length > 0) return fromBullets;
  }

  // 2) ### / **bold** structured cards
  const cards = parseActionCards(trimmed).map(stripActionCard);
  const structured = cards.map(actionCardToPlanItem).filter((x) => x.title.length > 0);
  if (structured.length > 0) return structured;

  // 3) ### chunks only
  return fallbackPlanItemsFromRawKeyActions(trimmed);
}

/** Turn Action Protocol section 8 body into health plan line items (same blocks as "Core actions to try"). */
export function extractPlanItemsFromActionProtocolBody(body: string): { title: string; description: string }[] {
  const normalized = body.replace(/\r\n/g, "\n");
  const blocks = parseMarkdownHeadingBlocks(normalized);

  const keyBlock = pickKeyActionsBlock(blocks);
  if (keyBlock?.content?.trim()) {
    const fromKey = extractPlanItemsFromSectionContent(keyBlock.content);
    if (fromKey.length > 0) return fromKey;
  }

  // Actions sometimes live only under this heading (per article template / CMS)
  const practiceBlock =
    pickBlock(blocks, "What it looks like in practice") ??
    pickBlock(blocks, "What it looks like");
  if (practiceBlock?.content?.trim()) {
    const fromPractice = extractPlanItemsFromSectionContent(practiceBlock.content);
    if (fromPractice.length > 0) return fromPractice;
  }

  // Last resort: scan full section (list may sit outside matched headings)
  if (normalized.trim()) {
    const fromAll = extractPlanItemsFromSectionContent(normalized);
    if (fromAll.length > 0) return fromAll;
  }

  return [];
}

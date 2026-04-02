/**
 * StructuredBodyCard — structured layout for Action Protocol (8) and Tracking Framework (9).
 *
 * For section 8 (Action Protocol) we render a modular UI (no numbered list) so it is scannable:
 * - What this supports, who it helps, where to start, core actions (expandable), how to adjust.
 *
 * For section 9 (Tracking Framework) we keep the existing "step" rendering for now.
 */

"use client";

import * as React from "react";

import { stripMarkdownBoldMarkers } from "@/lib/stripMarkdownBoldMarkers";

const SECTION_META: Record<
  number,
  { frameLabel: string; accentColor: string; dotColor: string }
> = {
  8: {
    frameLabel: "Action Protocol",
    accentColor: "text-[#6b3f1f]",
    dotColor: "bg-[#c49a6c]",
  },
  9: {
    frameLabel: "Tracking Framework",
    accentColor: "text-[#6b3f1f]",
    dotColor: "bg-[#a8845e]",
  },
};

type StructuredBodyCardProps = {
  sectionIndex: number;
  title: string | null;
  body: string;
};

function parseSteps(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type HeadingBlock = {
  heading: string;
  level: number;
  content: string;
};

function parseMarkdownHeadingBlocks(body: string): HeadingBlock[] {
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

function pickBlock(blocks: HeadingBlock[], name: string): HeadingBlock | null {
  const norm = (s: string) => s.trim().toLowerCase();
  const needle = norm(name);
  return blocks.find((b) => norm(b.heading) === needle) ?? null;
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => stripMarkdownBoldMarkers(l.replace(/^[-*]\s+/, "").trim()));
}

type ActionCardData = {
  title: string;
  why: string | null;
  practiceBullets: string[];
  who: string | null;
  mistake: string | null;
  rawRemainder: string | null;
};

function blockText(block: HeadingBlock | null | undefined): string {
  return stripMarkdownBoldMarkers(block?.content?.trim() ?? "");
}

function stripActionCard(action: ActionCardData): ActionCardData {
  return {
    title: stripMarkdownBoldMarkers(action.title),
    why: action.why ? stripMarkdownBoldMarkers(action.why) : null,
    practiceBullets: action.practiceBullets.map(stripMarkdownBoldMarkers),
    who: action.who ? stripMarkdownBoldMarkers(action.who) : null,
    mistake: action.mistake ? stripMarkdownBoldMarkers(action.mistake) : null,
    rawRemainder: action.rawRemainder ? stripMarkdownBoldMarkers(action.rawRemainder) : null,
  };
}

function parseActionCards(keyActionsContent: string): ActionCardData[] {
  const src = keyActionsContent.replace(/\r\n/g, "\n").trim();
  if (!src) return [];

  // Prefer "### Action title" splits if present.
  const byH3 = src.split(/\n(?=###\s+)/g).map((s) => s.trim()).filter(Boolean);
  const chunks =
    byH3.length > 1 || byH3[0]?.startsWith("### ")
      ? byH3
      : // Fallback: split by bold title lines like "**Balanced diet**"
        src.split(/\n(?=\*\*[^*\n]{3,80}\*\*\s*$)/g).map((s) => s.trim()).filter(Boolean);

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

      // Preserve any leftover text for safety (maintain information).
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

function clampToLines(text: string, maxParagraphs: number): string {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.slice(0, maxParagraphs).join("\n\n").trim();
}

function ProgressAffordance() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-[#cbbdb3] bg-transparent" aria-hidden />
        Not started
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-[#cbbdb3] bg-[#cbbdb3]/45" aria-hidden />
        Trying
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#8a6a50]" aria-hidden />
        Consistent
      </span>
    </div>
  );
}

function ModuleShell({
  title,
  eyebrow,
  children,
  emphasis = "light",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  emphasis?: "light" | "medium" | "high";
}) {
  const tone =
    emphasis === "high"
      ? "border-[#d7c7bd] bg-white shadow-[0_1px_0_rgba(12,12,12,0.04),0_10px_30px_rgba(12,12,12,0.06)]"
      : emphasis === "medium"
        ? "border-[#e2d5cc] bg-[#fffaf7] shadow-[0_1px_0_rgba(12,12,12,0.03),0_6px_22px_rgba(12,12,12,0.05)]"
        : "border-[#eadfd8] bg-[#fdf8f5] shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]";

  return (
    <div className={`rounded-[18px] border px-6 py-6 md:px-7 md:py-7 ${tone}`}>
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7b5c43]">
          {eyebrow}
        </div>
      )}
      <div className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ActionExpandableCard({ action }: { action: ActionCardData }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="rounded-[16px] border border-[#eadfd8] bg-white shadow-[0_1px_0_rgba(12,12,12,0.03),0_10px_28px_rgba(12,12,12,0.05)]">
      <button
        type="button"
        className="w-full px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              {action.title}
            </div>
            <div className="mt-1 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
              {action.why ?? "Tap to expand details and examples."}
            </div>
          </div>
          <div className="shrink-0 pt-0.5 text-[12px] font-semibold text-[#7b5c43]">
            {open ? "Hide" : "Expand"}
          </div>
        </div>
        <div className="mt-3">
          <ProgressAffordance />
        </div>
      </button>

      {open && (
        <div className="border-t border-[#f0e6dc] px-5 pb-5 pt-4">
          {action.why && (
            <div className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Why it matters</span>
              <div className="mt-1">{action.why}</div>
            </div>
          )}

          <div className="mt-4">
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              What it looks like in practice
            </div>
            {action.practiceBullets.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                {action.practiceBullets.map((b, idx) => (
                  <li key={idx} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c49a6c]" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              action.rawRemainder && (
                <div className="mt-2 text-[13px] leading-[1.65] text-[var(--text-secondary)] whitespace-pre-wrap">
                  {action.rawRemainder}
                </div>
              )
            )}
          </div>

          {action.who && (
            <div className="mt-4 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Who this helps most</span>
              <div className="mt-1">{action.who}</div>
            </div>
          )}

          {action.mistake && (
            <div className="mt-4 rounded-[12px] border border-[#efe3db] bg-[#fff6f0] px-4 py-3 text-[12.5px] leading-[1.55] text-[#7b5c43]">
              <span className="font-semibold">Common mistake</span>
              <div className="mt-1">{action.mistake}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionProtocolModules({ sectionIndex, title, body }: StructuredBodyCardProps) {
  const meta = SECTION_META[sectionIndex];
  const frameLabel = meta?.frameLabel ?? "Action Protocol";
  const accentColor = meta?.accentColor ?? "text-[var(--text-primary)]";

  const blocks = React.useMemo(() => parseMarkdownHeadingBlocks(body), [body]);

  const goal = pickBlock(blocks, "Goal of this protocol") ?? pickBlock(blocks, "Goal of this protocol");
  const who = pickBlock(blocks, "Who this is most relevant for");
  const priorityOrder = pickBlock(blocks, "Priority order");
  const prioritizeFirst = pickBlock(blocks, "What to prioritize first");
  const keyActions = pickBlock(blocks, "Key actions");
  const clarify = pickBlock(blocks, "What may help clarify this pattern");
  const clinician = pickBlock(blocks, "When clinician discussion may make sense");
  const notAssume = pickBlock(blocks, "What not to assume");

  const priority1 =
    blocks.find((b) => b.level === 3 && /^priority 1\b/i.test(b.heading)) ?? null;
  const priority2 =
    blocks.find((b) => b.level === 3 && /^priority 2\b/i.test(b.heading)) ?? null;
  const priority3 =
    blocks.find((b) => b.level === 3 && /^priority 3\b/i.test(b.heading)) ?? null;

  const actions = React.useMemo(
    () => parseActionCards(keyActions?.content ?? "").map(stripActionCard),
    [keyActions?.content],
  );

  const [goalExpanded, setGoalExpanded] = React.useState(false);
  const goalText = blockText(goal);
  const goalPreview = clampToLines(goalText, 2);
  const goalNeedsMore = goalPreview.length > 0 && goalPreview.length < goalText.length;

  const whoItems = parseBullets(who?.content ?? "");

  const startHereContent = [blockText(prioritizeFirst), blockText(priority1)]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return (
    <section
      id={`section-${sectionIndex}`}
      className="scroll-mt-[100px] rounded-[20px] border border-[#e8ddd6] bg-[#fdf8f5] px-7 py-8 md:px-9 md:py-10 shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]"
    >
      {/* Frame label badge */}
      <span className="mb-4 inline-flex items-center rounded-full bg-[#f0e6dc] border border-[#ddd0c6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#8a6a50]">
        {frameLabel}
      </span>

      {/* Section title */}
      {title && (
        <h2 className={`text-[16px] font-semibold tracking-[-0.01em] mb-7 ${accentColor}`}>
          {title}
        </h2>
      )}

      <div className="flex flex-col gap-6 md:gap-7">
        {/* Module 1 */}
        <CollapsibleModule
          eyebrow="Module 1"
          title="What this approach is designed to support"
          emphasis="light"
          initialOpen
        >
          {goalText ? (
            <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
              {goalExpanded ? goalText : goalPreview}
              {goalNeedsMore && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-[12.5px] font-semibold text-[#7b5c43] hover:underline"
                    onClick={() => setGoalExpanded(true)}
                  >
                    Read more
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
              {stripMarkdownBoldMarkers(body)}
            </div>
          )}
        </CollapsibleModule>

        {/* Module 2 */}
        <CollapsibleModule
          eyebrow="Module 2"
          title="Who this may be helpful for"
          emphasis="light"
          initialOpen
        >
          {whoItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {whoItems.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-[#eadfd8] bg-white px-3 py-1 text-[12.5px] text-[var(--text-secondary)]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : who?.content ? (
            <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
              {blockText(who)}
            </div>
          ) : null}
        </CollapsibleModule>

        {/* Module 3 */}
        {startHereContent && (
          <CollapsibleModule
            eyebrow="Module 3"
            title="Where to start"
            emphasis="high"
            initialOpen
          >
            <div className="inline-flex items-center rounded-full bg-[#efe3db] border border-[#ddd0c6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#8a6a50]">
              Start here
            </div>
            <div className="mt-4 text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
              {startHereContent}
            </div>
          </CollapsibleModule>
        )}

        {/* Module 4 */}
        <CollapsibleModule
          eyebrow="Module 4"
          title="Core actions to try"
          emphasis="medium"
          initialOpen
        >
          <div className="space-y-3">
            {actions.length > 0 ? (
              actions.map((a) => <ActionExpandableCard key={a.title} action={a} />)
            ) : keyActions?.content ? (
              <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
                {blockText(keyActions)}
              </div>
            ) : null}
          </div>
        </CollapsibleModule>

        {/* Module 5 */}
        <CollapsibleModule
          eyebrow="Module 5"
          title="How to adjust over time"
          emphasis="light"
          initialOpen
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-5">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Refine your approach
              </div>
              <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {[blockText(priority2), blockText(priority3), blockText(clarify)].filter(Boolean).join("\n\n")}
              </div>
            </div>

            <div className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-5">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                When to consider extra support
              </div>
              <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {blockText(clinician)}
              </div>
            </div>

            <div className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-5">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Important context
              </div>
              <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {blockText(notAssume)}
              </div>
            </div>
          </div>
        </CollapsibleModule>

        {/* Safety: preserve any leftover "Priority order" content if present and not otherwise shown */}
        {priorityOrder?.content && !priority1 && !priority2 && !priority3 && (
          <div className="text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
            {blockText(priorityOrder)}
          </div>
        )}
      </div>
    </section>
  );
}

type PairItem = { title: string; description: string };

function firstLine(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const line = t.split("\n").map((l) => l.trim()).find(Boolean);
  return line ?? "";
}

function parsePairsFromBullets(text: string): PairItem[] {
  const bullets = parseBullets(text);
  const pairs: PairItem[] = [];
  for (const b of bullets) {
    // Common patterns: "Signal: why" or "Signal — why" or "Signal - why"
    const m =
      /^(.+?)\s*[:—-]\s+(.+)$/.exec(b) ??
      /^(\*\*.+?\*\*)\s*[:—-]\s+(.+)$/.exec(b);
    if (m) {
      const rawTitle = m[1].replace(/^\*\*|\*\*$/g, "").trim();
      pairs.push({
        title: stripMarkdownBoldMarkers(rawTitle),
        description: stripMarkdownBoldMarkers(m[2].trim()),
      });
    } else {
      pairs.push({ title: stripMarkdownBoldMarkers(b.trim()), description: "" });
    }
  }
  return pairs;
}

function parsePairsFromParagraphs(text: string): PairItem[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const pairs: PairItem[] = [];
  for (const p of paras) {
    const oneLine = p.replace(/\s+/g, " ").trim();
    const m = /^(.+?)\s*[:—-]\s+(.+)$/.exec(oneLine);
    if (m) {
      pairs.push({
        title: stripMarkdownBoldMarkers(m[1].trim()),
        description: stripMarkdownBoldMarkers(m[2].trim()),
      });
    }
  }
  return pairs;
}

function pickNonEmpty<T>(items: T[], min = 1): T[] {
  return items.length >= min ? items : [];
}

function CollapsibleModule({
  eyebrow,
  title,
  initialOpen,
  emphasis,
  children,
}: {
  eyebrow: string;
  title: string;
  initialOpen: boolean;
  emphasis: "light" | "medium" | "high";
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(initialOpen);
  return (
    <ModuleShell eyebrow={eyebrow} title={title} emphasis={emphasis}>
      <div className="flex items-start justify-between gap-3">
        <div />
        <button
          type="button"
          className="text-[12.5px] font-semibold text-[#7b5c43] hover:underline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      <div className={open ? "mt-3" : "mt-3 hidden"}>{children}</div>
    </ModuleShell>
  );
}

function TrackingFrameworkModules({ sectionIndex, title, body }: StructuredBodyCardProps) {
  const meta = SECTION_META[sectionIndex];
  const frameLabel = meta?.frameLabel ?? "Tracking Framework";
  const accentColor = meta?.accentColor ?? "text-[var(--text-primary)]";

  const blocks = React.useMemo(() => parseMarkdownHeadingBlocks(body), [body]);

  const why = pickBlock(blocks, "Why tracking this pattern can be useful");
  const whatToTrack = pickBlock(blocks, "What to track");
  const howToTrack = pickBlock(blocks, "How to track it");
  const minPeriod = pickBlock(blocks, "Minimum useful tracking period");
  const patterns = pickBlock(blocks, "Patterns to look for");
  const improvement = pickBlock(blocks, "What counts as improvement");
  const reevaluate = pickBlock(blocks, "When to re-evaluate");
  const pitfalls = pickBlock(blocks, "Tracking pitfalls");
  const onlyThree = pickBlock(blocks, "If you only track three things");

  const whyText = blockText(why);
  const whyPreview = clampToLines(whyText, 2);
  const whyNeedsMore = whyPreview.length > 0 && whyPreview.length < whyText.length;
  const [whyExpanded, setWhyExpanded] = React.useState(false);

  const signalPairs =
    pickNonEmpty(parsePairsFromBullets(whatToTrack?.content ?? "")) ||
    pickNonEmpty(parsePairsFromParagraphs(whatToTrack?.content ?? ""));

  const patternPairs =
    pickNonEmpty(parsePairsFromBullets(patterns?.content ?? "")) ||
    pickNonEmpty(parsePairsFromParagraphs(patterns?.content ?? ""));

  const howRaw = blockText(howToTrack);
  const howOneLine = firstLine(howRaw);
  const howLines = howRaw.split("\n").map((l) => l.trim()).filter(Boolean);
  const formatHint =
    howLines.find((l) => /\bformat\b/i.test(l)) ??
    howLines.find((l) => /\bscale\b/i.test(l) || /\bapp\b/i.test(l) || /\bjournal\b/i.test(l)) ??
    howOneLine;
  const frequencyHint =
    howLines.find((l) => /\bfrequency\b/i.test(l) || /\bdaily\b/i.test(l) || /\bweekly\b/i.test(l)) ?? "";
  const timingHint =
    howLines.find((l) => /\btime\b/i.test(l) || /\bevening\b/i.test(l) || /\bmorning\b/i.test(l) || /\bpost-?meal\b/i.test(l)) ?? "";

  const minText = blockText(minPeriod);

  const reassure = "This doesn’t need to be perfect. Even simple notes can reveal patterns. Start with 1–2 signals if this feels like too much.";

  const combinedAdjust = [
    blockText(improvement),
    blockText(reevaluate),
    blockText(pitfalls),
    blockText(onlyThree),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return (
    <section
      id={`section-${sectionIndex}`}
      className="scroll-mt-[100px] rounded-[20px] border border-[#e8ddd6] bg-[#fdf8f5] px-7 py-8 md:px-9 md:py-10 shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]"
    >
      <span className="mb-4 inline-flex items-center rounded-full bg-[#f0e6dc] border border-[#ddd0c6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#8a6a50]">
        {frameLabel}
      </span>

      {title && (
        <h2 className={`text-[16px] font-semibold tracking-[-0.01em] mb-7 ${accentColor}`}>
          {title}
        </h2>
      )}

      <div className="flex flex-col gap-6 md:gap-7">
        {/* Module 1 — Why tracking helps */}
        <CollapsibleModule eyebrow="Module 1" title="Why tracking helps" emphasis="light" initialOpen>
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-[#eadfd8] bg-white text-[#7b5c43]"
              aria-hidden
            >
              ⌁
            </div>
            <div className="flex-1">
              <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
                {whyExpanded ? whyText : whyPreview}
              </div>
              {whyNeedsMore && !whyExpanded && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-[12.5px] font-semibold text-[#7b5c43] hover:underline"
                    onClick={() => setWhyExpanded(true)}
                  >
                    Read more
                  </button>
                </div>
              )}
              <div className="mt-4 rounded-[12px] border border-[#efe3db] bg-[#fff6f0] px-4 py-3 text-[12.5px] leading-[1.55] text-[#7b5c43]">
                {reassure}
              </div>
            </div>
          </div>
        </CollapsibleModule>

        {/* Module 2 — What to track */}
        <CollapsibleModule eyebrow="Module 2" title="What to track" emphasis="medium" initialOpen>
          {signalPairs.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {signalPairs.map((s, idx) => (
                <div
                  key={`${s.title}-${idx}`}
                  className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-4 shadow-[0_1px_0_rgba(12,12,12,0.03),0_10px_28px_rgba(12,12,12,0.05)]"
                >
                  <div className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                    {s.title}
                  </div>
                  {s.description ? (
                    <div className="mt-1 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
                      {s.description}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : whatToTrack?.content ? (
            <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
              {blockText(whatToTrack)}
            </div>
          ) : null}
        </CollapsibleModule>

        {/* Module 3 — How to track */}
        <CollapsibleModule
          eyebrow="Module 3"
          title="How to track (simple setup)"
          initialOpen
          emphasis="light"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-[14px] border border-[#eadfd8] bg-white px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7b5c43]">Format</div>
              <div className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                {formatHint || "Use a simple note, scale, or app that you’ll actually keep using."}
              </div>
            </div>
            <div className="rounded-[14px] border border-[#eadfd8] bg-white px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7b5c43]">Frequency</div>
              <div className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                {frequencyHint || "Aim for a steady rhythm (daily or weekly), rather than perfect logging."}
              </div>
            </div>
            <div className="rounded-[14px] border border-[#eadfd8] bg-white px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#7b5c43]">Timing</div>
              <div className="mt-2 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                {timingHint || "Pick a consistent moment (evening reflection, after meals, or a morning check-in)."}
              </div>
            </div>
          </div>

          {howRaw && (
            <details className="mt-4 rounded-[14px] border border-[#eadfd8] bg-white px-4 py-4">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-[#7b5c43]">
                See full setup guidance
              </summary>
              <div className="mt-3 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {howRaw}
              </div>
            </details>
          )}
        </CollapsibleModule>

        {/* Module 4 — How long to track */}
        <CollapsibleModule
          eyebrow="Module 4"
          title="How long to track"
          initialOpen
          emphasis="high"
        >
          <div className="rounded-[16px] border border-[#efe3db] bg-[#fff6f0] px-5 py-5">
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              Track long enough to see the pattern, not just a few days.
            </div>
            <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
              {minText || "Track for at least 4–6 weeks to start seeing meaningful patterns."}
            </div>
          </div>
        </CollapsibleModule>

        {/* Module 5 — Patterns */}
        <CollapsibleModule
          eyebrow="Module 5"
          title="What patterns to look for"
          initialOpen
          emphasis="high"
        >
          {patternPairs.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {patternPairs.map((p, idx) => (
                <div
                  key={`${p.title}-${idx}`}
                  className="rounded-[16px] border border-[#e2d5cc] bg-[#fffaf7] px-5 py-4 shadow-[0_1px_0_rgba(12,12,12,0.03),0_12px_30px_rgba(12,12,12,0.06)]"
                >
                  <div className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                    {p.title}
                  </div>
                  {p.description ? (
                    <div className="mt-1 text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
                      {p.description}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : patterns?.content ? (
            <div className="text-[14px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
              {blockText(patterns)}
            </div>
          ) : null}
        </CollapsibleModule>

        {/* Module 6 — Interpret & adjust */}
        <CollapsibleModule
          eyebrow="Module 6"
          title="How to interpret & adjust"
          initialOpen
          emphasis="light"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-5">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Signs things are improving
              </div>
              <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {blockText(improvement)}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-5">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                When to reassess
              </div>
              <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {blockText(reevaluate)}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#eadfd8] bg-white px-5 py-5">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                Keep it simple
              </div>
              <div className="mt-2 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {[blockText(pitfalls), blockText(onlyThree)].filter(Boolean).join("\n\n")}
              </div>
            </div>
          </div>

          {/* Safety: preserve combined text if something doesn't map cleanly */}
          {combinedAdjust && (
            <details className="mt-4 rounded-[14px] border border-[#eadfd8] bg-white px-4 py-4">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-[#7b5c43]">
                See full interpretation guidance
              </summary>
              <div className="mt-3 text-[13px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
                {combinedAdjust}
              </div>
            </details>
          )}
        </CollapsibleModule>

        {/* CTA layer (UI only) */}
        <div className="rounded-[18px] border border-[#eadfd8] bg-white px-6 py-6 md:px-7 md:py-7 shadow-[0_1px_0_rgba(12,12,12,0.03),0_10px_28px_rgba(12,12,12,0.05)]">
          <div className="text-[14px] font-semibold text-[var(--text-primary)]">
            Ready to start?
          </div>
          <div className="mt-1 text-[13px] leading-[1.65] text-[var(--text-secondary)]">
            Start small. The goal is consistency, not perfection.
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[#8a6a50] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(138,106,80,0.18)] hover:opacity-95"
            >
              Start tracking these signals
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-[#eadfd8] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#7b5c43] hover:bg-[#fffaf7]"
            >
              Add to my tracking dashboard
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StructuredBodyCard({
  sectionIndex,
  title,
  body,
}: StructuredBodyCardProps) {
  const meta = SECTION_META[sectionIndex];
  const steps = parseSteps(body);
  const frameLabel = meta?.frameLabel ?? null;
  const accentColor = meta?.accentColor ?? "text-[var(--text-primary)]";
  const dotColor = meta?.dotColor ?? "bg-black/25";

  if (sectionIndex === 8) {
    return <ActionProtocolModules sectionIndex={sectionIndex} title={title} body={body} />;
  }
  if (sectionIndex === 9) {
    return <TrackingFrameworkModules sectionIndex={sectionIndex} title={title} body={body} />;
  }

  return (
    <section
      id={`section-${sectionIndex}`}
      className="scroll-mt-[100px] rounded-[20px] border border-[#e8ddd6] bg-[#fdf8f5] px-7 py-7 md:px-9 md:py-9 shadow-[0_1px_0_rgba(12,12,12,0.03),0_4px_16px_rgba(12,12,12,0.04)]"
    >
      {/* Frame label badge */}
      {frameLabel && (
        <span className="mb-4 inline-flex items-center rounded-full bg-[#f0e6dc] border border-[#ddd0c6] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#8a6a50]">
          {frameLabel}
        </span>
      )}

      {/* Section title */}
      {title && (
        <h2
          className={`text-[16px] font-semibold tracking-[-0.01em] mb-5 ${accentColor}`}
        >
          {title}
        </h2>
      )}

      {/* Steps */}
      {steps.length > 1 ? (
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3.5">
              {/* Step number */}
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#ddd0c6] bg-white text-[11px] font-semibold text-[#8a6a50]`}
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] flex-1">
                {step}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        /* Single-block fallback: no numbering */
        <div className="flex gap-3.5">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
            aria-hidden
          />
          <p className="text-[15px] leading-[1.75] text-[var(--text-secondary)] whitespace-pre-wrap">
            {body}
          </p>
        </div>
      )}
    </section>
  );
}

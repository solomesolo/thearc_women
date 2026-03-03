"use client";

const PREVIEW_LENGTH = 220;
const WHAT_YOU_GET = [
  "Full evidence breakdown and limitations",
  "When it applies to your profile",
  "Implementation considerations",
  "Source citations and context",
];

type GatedSectionProps = {
  sectionIndex: number;
  title: string | null;
  body: string;
  isGated: boolean;
  preview?: string | null;
  isSubscriber?: boolean;
};

export function GatedSection({
  sectionIndex,
  title,
  body,
  isGated,
  preview: previewProp,
  isSubscriber = false,
}: GatedSectionProps) {
  const showFull = !isGated || isSubscriber;
  const preview =
    previewProp && previewProp.trim()
      ? previewProp
      : body.slice(0, PREVIEW_LENGTH) + (body.length > PREVIEW_LENGTH ? "…" : "");
  const id = `section-${sectionIndex}`;

  if (showFull) {
    return (
      <section id={id} className="scroll-mt-24">
        {title && (
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
            {title}
          </h2>
        )}
        <div className="mt-2 whitespace-pre-wrap text-base leading-[1.7] text-[var(--text-secondary)]">
          {body}
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[14px] border border-[var(--color-border-hairline)] bg-[var(--color-surface)]/40 p-5 md:p-6"
    >
      {title && (
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
          {title}
        </h2>
      )}
      <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
        {preview}
      </p>
      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          What you get with full access
        </p>
        <ul className="mt-2 list-none space-y-1.5 pl-0 text-sm leading-[1.5] text-[var(--text-primary)]">
          {WHAT_YOU_GET.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--text-secondary)]">—</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-hairline)]">
              <th className="py-2 text-left font-medium text-[var(--text-secondary)]">
                As a visitor
              </th>
              <th className="py-2 text-left font-medium text-[var(--text-primary)]">
                As a subscriber
              </th>
            </tr>
          </thead>
          <tbody className="text-[var(--text-secondary)]">
            <tr className="border-b border-[var(--color-border-hairline)]">
              <td className="py-2">Preview only</td>
              <td className="py-2 text-[var(--text-primary)]">Full section</td>
            </tr>
            <tr className="border-b border-[var(--color-border-hairline)]">
              <td className="py-2">—</td>
              <td className="py-2 text-[var(--text-primary)]">Evidence & context</td>
            </tr>
            <tr>
              <td className="py-2">—</td>
              <td className="py-2 text-[var(--text-primary)]">Implementation notes</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm leading-[1.55] text-[var(--text-secondary)]">
        Sign in or subscribe to read this section in full.
      </p>
    </section>
  );
}

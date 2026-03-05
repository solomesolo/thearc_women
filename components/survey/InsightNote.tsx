"use client";

type InsightNoteProps = {
  text: string;
  id?: string;
};

/** Editorial callout for "Why we ask" support copy. Not form-like. */
export function InsightNote({ text, id }: InsightNoteProps) {
  return (
    <div
      id={id}
      className="rounded-[18px] border border-black/[0.06] bg-black/[0.02] px-4 py-3.5"
      role="note"
      aria-label="Why we ask"
    >
      <p className="text-[12px] font-medium uppercase tracking-wide text-black/55">Why we ask</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-black/70 md:text-[15px]">{text}</p>
    </div>
  );
}

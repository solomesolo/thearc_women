"use client";

type EducationalNoteProps = {
  text: string;
  id?: string;
};

export function EducationalNote({ text, id }: EducationalNoteProps) {
  return (
    <div
      id={id}
      className="mt-3 rounded-[14px] border border-black/[0.06] bg-black/[0.02] px-4 py-3"
      role="note"
      aria-label="Note"
    >
      <p className="text-[14px] leading-relaxed text-black/70">{text}</p>
    </div>
  );
}

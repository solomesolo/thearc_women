"use client";

type ContentBreakScreenProps = {
  title: string;
  body: string;
  sectionTitle: string;
};

/** Content break: section label + title + body. Footer (Back/Continue) is rendered by container. */
export function ContentBreakScreen({ title, body, sectionTitle }: ContentBreakScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px] font-medium text-black/70">{sectionTitle}</p>
      <h2 className="text-[24px] font-medium leading-snug text-[var(--text-primary)] md:text-[26px]">
        {title}
      </h2>
      <p className="text-[17px] leading-relaxed text-[var(--text-primary)] opacity-90">{body}</p>
    </div>
  );
}

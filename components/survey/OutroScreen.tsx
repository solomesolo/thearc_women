"use client";

type OutroScreenProps = {
  sectionTitle: string;
  title: string;
  body: string;
  primaryLabel: string;
  onSubmit: () => void;
};

export function OutroScreen({ sectionTitle, title, body, primaryLabel, onSubmit }: OutroScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px] font-medium text-black/70">{sectionTitle}</p>
      <h2 className="text-[24px] font-medium leading-snug text-[var(--text-primary)] md:text-[26px]">
        {title}
      </h2>
      <p className="text-[17px] leading-relaxed text-[var(--text-primary)] opacity-90">{body}</p>
      <div className="pt-4">
        <button
          type="button"
          onClick={onSubmit}
          className="min-h-[48px] rounded-[18px] bg-black/90 px-6 py-3 text-[16px] font-medium text-white hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

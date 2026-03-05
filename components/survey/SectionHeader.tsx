"use client";

type SectionHeaderProps = {
  title: string;
  sectionIndex: number;
  sectionTotal: number;
};

export function SectionHeader({ title, sectionIndex, sectionTotal }: SectionHeaderProps) {
  return (
    <header className="mb-6">
      <p className="text-[12px] font-medium uppercase tracking-wider text-black/55">
        Section {sectionIndex + 1} of {sectionTotal}
      </p>
      <h2 className="mt-1 text-[22px] font-semibold leading-tight text-[var(--text-primary)] md:text-[24px]">
        {title}
      </h2>
    </header>
  );
}

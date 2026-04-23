type TimelineEntry = { month: string; item: string };

type Props = {
  entries: TimelineEntry[];
  nextCheckTitle?: string | null;
  isLoading?: boolean;
  errorText?: string | null;
  emptyText?: string;
};

export function TimelineWidget({ entries, nextCheckTitle, isLoading, errorText, emptyText }: Props) {
  const effectiveEmptyText = emptyText ?? "No upcoming checks yet.";
  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
        Upcoming checks
      </p>
      {isLoading ? (
        <p className="mt-2 text-[0.875rem] text-[#737373]">Loading…</p>
      ) : errorText ? (
        <p className="mt-2 text-[0.875rem] text-[#737373]">{errorText}</p>
      ) : nextCheckTitle ? (
        <p className="mt-2 text-[0.875rem] text-[#737373]">
          Next recommended check: <span className="font-medium text-[#0c0c0c]">{nextCheckTitle}</span>
        </p>
      ) : null}
      <ol className="mt-4 space-y-0">
        {!isLoading && !errorText && entries.length === 0 && (
          <li className="text-[0.9375rem] text-[#737373]">{effectiveEmptyText}</li>
        )}
        {entries.map((entry, i) => (
          <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
            {i < entries.length - 1 && (
              <span className="absolute left-[9px] top-[22px] h-[calc(100%-22px)] w-px bg-black/[0.08]" aria-hidden />
            )}
            <span className="relative mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-black/[0.15] bg-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0c0c0c]/[0.4]" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">{entry.month}</p>
              <p className="mt-0.5 text-[0.9375rem] font-medium text-[#0c0c0c]">{entry.item}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Props = {
  label: string;
  value: string | number;
  sub?: string;
};

export function SummaryStatCard({ label, value, sub }: Props) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[16px] border border-black/[0.08] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">{label}</p>
      <p className="font-mono text-[1.625rem] font-semibold tabular-nums leading-none text-[#0c0c0c]">
        {value}
      </p>
      {sub && <p className="text-[0.8125rem] text-[#737373]">{sub}</p>}
    </div>
  );
}

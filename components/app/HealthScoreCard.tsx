type Props = {
  score: number;
  label?: string;
  subtitle?: string;
};

export function HealthScoreCard({ score, label = "Health completeness score", subtitle = "Based on your current health data" }: Props) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-black/[0.08] bg-white p-6 text-center shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
        {label}
      </p>
      <div className="relative h-[112px] w-[112px]">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="black" strokeOpacity="0.07" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#0c0c0c"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[1.75rem] font-semibold tabular-nums text-[#0c0c0c]">
          {score}%
        </span>
      </div>
      <p className="text-[0.8125rem] leading-snug text-[#737373]">
        {subtitle}
      </p>
    </div>
  );
}

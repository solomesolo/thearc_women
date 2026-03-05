"use client";

type NumericAnswerProps = {
  questionId: string;
  value: number | string | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
};

export function NumericAnswer({
  questionId,
  value,
  onChange,
  placeholder = "Enter number",
}: NumericAnswerProps) {
  const num = value === undefined || value === "" ? "" : Number(value);

  return (
    <div role="group" aria-label="Numeric input">
      <input
        type="number"
        inputMode="numeric"
        id={questionId}
        value={num}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onChange(undefined);
            return;
          }
          const n = Number(v);
          if (!Number.isNaN(n)) onChange(n);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-[48px] w-full max-w-[200px] rounded-[18px] border border-black/[0.08] bg-[var(--background)] px-4 py-3 text-[16px] text-[var(--text-primary)] placeholder:text-black/40 focus:border-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
      />
    </div>
  );
}

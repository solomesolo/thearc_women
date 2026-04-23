import Link from "next/link";

type Props = {
  children: React.ReactNode;
  /** Narrower max-width for text-heavy pages */
  narrow?: boolean;
};

export function OnboardingShell({ children, narrow }: Props) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Minimal top bar */}
      <header className="border-b border-black/[0.06] bg-white/[0.7] backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[640px] items-center px-5">
          <Link href="/" className="text-[0.9375rem] font-semibold tracking-tight text-[#0c0c0c]">
            The Arc
          </Link>
        </div>
      </header>

      <main className={`mx-auto px-5 py-10 ${narrow ? "max-w-[480px]" : "max-w-[640px]"}`}>
        {children}
      </main>
    </div>
  );
}

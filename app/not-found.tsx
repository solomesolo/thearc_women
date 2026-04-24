import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[56rem] flex-col items-start justify-center gap-4 px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
        Page not found
      </p>
      <h1 className="text-[2rem] font-semibold tracking-tight text-[#0c0c0c] md:text-[2.5rem]">
        We can&apos;t find that page
      </h1>
      <p className="max-w-[46rem] text-[0.95rem] leading-[1.7] text-[#737373]">
        Try going back to the dashboard.
      </p>
      <Link
        href="/app/dashboard"
        className="mt-2 inline-flex rounded-[12px] bg-[#0c0c0c] px-5 py-3 text-[0.9375rem] font-medium text-white transition-[filter] hover:brightness-[0.88]"
      >
        Go to dashboard
      </Link>
    </div>
  );
}


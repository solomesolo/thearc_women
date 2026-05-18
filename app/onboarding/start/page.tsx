"use client";

import Link from "next/link";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useLocale } from "@/lib/i18n/useLocale";
import { t } from "@/content/i18n/appCopy";

export default function OnboardingStartPage() {
  const locale = useLocale();

  return (
    <OnboardingShell narrow>
      <div className="flex flex-col items-center text-center">
        {/* Eyebrow */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
          {t(locale, "onboarding.start.eyebrow")}
        </p>

        {/* Heading */}
        <h1 className="mt-5 text-[2rem] font-semibold leading-[1.2] tracking-tight text-[#0c0c0c] md:text-[2.5rem]">
          {t(locale, "onboarding.start.title")}
        </h1>

        {/* Description */}
        <p className="mt-5 max-w-[400px] text-[1rem] leading-[1.7] text-[#737373]">
          {t(locale, "onboarding.start.body")}
        </p>

        {/* What to expect */}
        <div className="mt-10 w-full rounded-[20px] border border-black/[0.08] bg-white p-6 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
            {t(locale, "onboarding.start.expect")}
          </p>
          <ul className="mt-4 space-y-3">
            {[
              [t(locale, "onboarding.start.expect.1.t"), t(locale, "onboarding.start.expect.1.d")],
              [t(locale, "onboarding.start.expect.2.t"), t(locale, "onboarding.start.expect.2.d")],
              [t(locale, "onboarding.start.expect.3.t"), t(locale, "onboarding.start.expect.3.d")],
              [t(locale, "onboarding.start.expect.4.t"), t(locale, "onboarding.start.expect.4.d")],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-[0.3em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4c4c4]" aria-hidden />
                <span className="text-[0.9375rem] leading-snug text-[#404040]">
                  <span className="font-medium text-[#0c0c0c]">{title}</span>
                  {" — "}{desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/health-journey"
          className="mt-8 block w-full rounded-[14px] bg-[#0c0c0c] px-6 py-4 text-center text-[1rem] font-medium text-white no-underline transition-[filter] hover:brightness-[0.88] active:brightness-[0.8]"
        >
          {locale === "de" ? "Survey starten" : "Start the survey"}
        </Link>

        <p className="mt-4 text-[0.8125rem] text-[#a3a3a3]">
          Your answers are private and never shared.
        </p>
      </div>
    </OnboardingShell>
  );
}

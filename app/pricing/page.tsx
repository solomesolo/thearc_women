import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  return (
    <main>
      <Section variant="default" className="py-20 md:py-28 lg:py-32">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-[2rem] font-medium leading-[1.12] tracking-tight text-[#0c0c0c] sm:text-[2.35rem] md:text-[2.5rem] lg:text-[2.85rem] xl:text-[3.2rem]">
              Simple, transparent pricing
            </h1>
            <p className="mt-6 text-base leading-[1.62] text-[#404040] md:text-[1.0625rem]">
              Start free. Upgrade when you need more control.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
            {/* Free */}
            <div className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-10">
              <div className="text-center">
                <h3 className="text-[1.25rem] font-medium text-[#0c0c0c]">Free</h3>
                <p className="mt-2 text-[2rem] font-medium text-[#0c0c0c]">€0</p>
                <ul className="mt-8 space-y-3 text-left text-[0.9375rem] leading-[1.55] text-[#404040]">
                  <li>✔ Questionnaire</li>
                  <li>✔ Personalized test recommendations</li>
                  <li>✔ Basic health overview</li>
                </ul>
                <p className="mt-6 text-sm text-[#737373]">Best for getting started</p>
                <Button href="/survey" variant="hero" className="mt-8 w-full">
                  Start free
                </Button>
              </div>
            </div>

            {/* Pay Per Use */}
            <div className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-10">
              <div className="text-center">
                <h3 className="text-[1.25rem] font-medium text-[#0c0c0c]">Pay Per Use</h3>
                <p className="mt-2 text-[2rem] font-medium text-[#0c0c0c]">€4 / upload</p>
                <ul className="mt-8 space-y-3 text-left text-[0.9375rem] leading-[1.55] text-[#404040]">
                  <li>✔ Lab analysis</li>
                  <li>✔ Structured results</li>
                  <li>✔ Gap detection</li>
                </ul>
                <p className="mt-6 text-sm text-[#737373]">No subscription needed</p>
                <Button href="/upload" variant="outline" className="mt-8 w-full">
                  Upload now
                </Button>
              </div>
            </div>

            {/* Pro */}
            <div className="relative rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0c0c0c] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
                Most popular
              </div>
              <div className="text-center">
                <h3 className="text-[1.25rem] font-medium text-[#0c0c0c]">Pro</h3>
                <p className="mt-2 text-[2rem] font-medium text-[#0c0c0c]">€9 / month</p>
                <ul className="mt-8 space-y-3 text-left text-[0.9375rem] leading-[1.55] text-[#404040]">
                  <li>✔ Unlimited uploads</li>
                  <li>✔ Timeline tracking</li>
                  <li>✔ Reminders</li>
                  <li>✔ Health score</li>
                </ul>
                <p className="mt-6 text-sm text-[#737373]">Best for ongoing health tracking</p>
                <Button href="/plan" variant="hero" className="mt-8 w-full">
                  Go Pro
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-20 rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-8 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-10">
            <h3 className="text-[1.25rem] font-medium text-[#0c0c0c]">FAQ</h3>
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="font-medium text-[#0c0c0c]">Is this medical advice?</h4>
                <p className="mt-2 text-[0.9375rem] text-[#404040]">No, this is a support tool for awareness</p>
              </div>
              <div>
                <h4 className="font-medium text-[#0c0c0c]">Is my data safe?</h4>
                <p className="mt-2 text-[0.9375rem] text-[#404040]">Yes, fully private</p>
              </div>
              <div>
                <h4 className="font-medium text-[#0c0c0c]">Do I need to upload results?</h4>
                <p className="mt-2 text-[0.9375rem] text-[#404040]">No, optional</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
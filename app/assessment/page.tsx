import { Container } from "@/components/ui/Container";

export default function AssessmentPage() {
  return (
    <main className="py-24">
      <Container>
        <h1 className="mb-4 text-[1.875rem] font-medium tracking-tight text-[#0c0c0c] md:text-[2.5rem]">
          Begin your assessment
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-[#525252]">
          This is the destination for the assessment flow. Your intake will be
          available here.
        </p>
      </Container>
    </main>
  );
}

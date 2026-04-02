import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { PlanBuilderShell } from "@/components/plan/builder/PlanBuilderShell";

export const metadata = {
  title: "Create a Plan | The Arc",
};

export default function PlanBuilderPage() {
  return (
    <Container className="py-10 md:py-14">
      <Suspense>
        <PlanBuilderShell />
      </Suspense>
    </Container>
  );
}

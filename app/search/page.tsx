import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { SearchPage } from "@/components/search/SearchPage";

export default function SearchRoute() {
  return (
    <Container className="py-10 md:py-14">
      <Suspense>
        <SearchPage />
      </Suspense>
    </Container>
  );
}

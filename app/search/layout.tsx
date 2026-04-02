import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | The Arc",
  description: "Search the Knowledge Base — women's health articles and evidence-backed guides.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

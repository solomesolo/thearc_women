import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Health Dashboard | The Arc",
  description:
    "Browse the Knowledge Base, save articles, and track collections. Sign in to sync reading history.",
};

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Base | The Arc",
  description: "Research-backed articles and curated knowledge for women’s health.",
};

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

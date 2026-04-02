import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge for women who think critically about their health | The Arc",
  description:
    "We curate emerging research and translate it into relevance. Evidence-based articles for female physiology, performance, and preventive health.",
  openGraph: {
    title: "Knowledge Base | The Arc",
    description:
      "We curate emerging research and translate it into relevance. Evidence-based articles for female physiology and health.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

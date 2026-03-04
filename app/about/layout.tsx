import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About The Arc",
  description:
    "The Arc exists because women's health experience deserves to change. Learn how we're building a platform to help women understand their biology clearly and with real scientific context.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

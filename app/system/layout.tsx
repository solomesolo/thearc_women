import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Health System | The Arc",
  description:
    "A biological intelligence system designed for women. How The Arc maps signals, interprets patterns, and builds a living record of your physiology.",
};

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

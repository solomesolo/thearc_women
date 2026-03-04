import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How The Arc Thinks | The Arc",
  description:
    "Signals, system interpretation, pattern recognition, and preventive awareness. Explore the reasoning pipeline and evidence behind insights.",
};

export default function System2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

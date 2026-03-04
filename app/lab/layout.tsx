import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Preventive Lab | The Arc",
  description:
    "Where biological insight becomes practical action. Protocols, biomarker interpretation, tracking frameworks, and decision support.",
};

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

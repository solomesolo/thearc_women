import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How The Arc Works | The Arc",
  description:
    "Understand how The Arc structures your health data, generates insights, and protects your privacy — transparently and without replacing medical care.",
};

export default function System2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | The Arc",
  description: "Your lens, systems, and signals at a glance.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

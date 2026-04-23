import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Health Plan | The Arc",
  description: "Track your protocols and daily health actions.",
};

export default async function PlanLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/plan");
  return <>{children}</>;
}

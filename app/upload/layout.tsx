import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Upload Health Data | The Arc",
  description: "Securely upload your health records and documents to your personal Arc profile.",
};

export default async function UploadLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/upload");
  }
  return <>{children}</>;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function UploadFilesLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasConsent = cookieStore.get("arc_upload_consent")?.value === "1";
  if (!hasConsent) {
    redirect("/upload");
  }
  return <>{children}</>;
}

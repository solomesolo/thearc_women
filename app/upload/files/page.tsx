import { Container } from "@/components/ui/Container";
import { UploadZone } from "@/components/upload/UploadZone";
import Link from "next/link";

export const metadata = {
  title: "Upload Files | The Arc",
};

export default function UploadFilesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-xl">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-black/40">
            <Link href="/upload" className="hover:text-black/70 transition-colors no-underline">
              Upload Health Data
            </Link>
            <span>/</span>
            <span>Upload File</span>
          </div>

          <h1 className="mt-4 text-[1.5rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Upload your file
          </h1>
          <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
            Accepted formats: PDF, JPG, PNG. Maximum size: 20 MB.
          </p>

          <div className="mt-8">
            <UploadZone />
          </div>

          <p className="mt-6 text-[12px] leading-[1.6] text-black/35">
            Your file is encrypted in transit and stored securely. You can
            request removal at any time via{" "}
            <Link href="/data-request" className="underline underline-offset-2 hover:text-black/60 transition-colors">
              data request
            </Link>
            .
          </p>

        </div>
      </Container>
    </div>
  );
}

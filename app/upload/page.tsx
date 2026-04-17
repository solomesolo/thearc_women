import { Container } from "@/components/ui/Container";
import { ConsentButton } from "@/components/upload/ConsentButton";

const SUPPORTED_FORMATS = [
  { label: "PDF", desc: "Lab reports, doctor's notes, blood panels" },
  { label: "JPG / JPEG", desc: "Photographs of physical documents" },
  { label: "PNG", desc: "Screenshots, scanned images" },
];

const BEST_PRACTICES = [
  "Ensure the document is clearly legible — avoid blurry or low-resolution images",
  "Capture the full page, including headers, dates, and reference ranges",
  "Remove personally identifiable information you do not wish to store (e.g. address, insurance ID)",
  "One file per upload — split multi-page documents by section if needed",
  "Maximum file size is 20 MB per file",
];

const INCORRECT_EXAMPLES = [
  {
    label: "Too blurry",
    desc: "Image is out of focus — values cannot be read reliably",
  },
  {
    label: "Cropped or cut off",
    desc: "Part of the document is missing — reference ranges or units are not visible",
  },
  {
    label: "Wrong file type",
    desc: "Word documents, Excel spreadsheets, and HEIC images are not accepted",
  },
  {
    label: "Handwritten only",
    desc: "Freehand notes without printed labels or context cannot be processed",
  },
];

export default function UploadConsentPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Container className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Health Data Upload
          </p>
          <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)] md:text-[2rem]">
            Before you upload
          </h1>
          <p className="mt-4 text-[15px] leading-[1.65] text-[var(--text-secondary)]">
            Your health documents are stored securely and used only to enrich
            your personal Arc profile. Please read the guidelines below before
            proceeding.
          </p>

          <div className="mt-10 space-y-10">

            {/* Security note */}
            <section className="rounded-[18px] border border-black/[0.07] bg-white px-6 py-6">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[15px]">
                  🔒
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                    How your data is protected
                  </h2>
                  <ul className="mt-3 space-y-2 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                    <li>Files are stored in an encrypted, access-controlled storage bucket</li>
                    <li>Only you and The Arc platform can access your uploads</li>
                    <li>Data is never shared with third parties or used for advertising</li>
                    <li>You can request deletion of your data at any time</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Supported formats */}
            <section>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Supported file formats
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {SUPPORTED_FORMATS.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-[14px] border border-black/[0.07] bg-white px-4 py-4"
                  >
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {f.label}
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.5] text-black/50">
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Best practices */}
            <section>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Best practices for a good upload
              </h2>
              <ul className="mt-4 space-y-3">
                {BEST_PRACTICES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[13px] leading-[1.6] text-[var(--text-secondary)]"
                  >
                    <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/[0.07] text-[10px] font-semibold text-black/60">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Incorrect examples */}
            <section>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Examples of uploads we cannot process
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {INCORRECT_EXAMPLES.map((ex) => (
                  <div
                    key={ex.label}
                    className="flex items-start gap-3 rounded-[14px] border border-black/[0.07] bg-white px-4 py-4"
                  >
                    <span className="mt-0.5 text-[15px]">✗</span>
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {ex.label}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-[1.5] text-black/50">
                        {ex.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Consent action */}
            <section className="rounded-[18px] border border-black/[0.1] bg-white px-6 py-6">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Your consent
              </h2>
              <p className="mt-2 text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                By proceeding, you confirm that you have read the guidelines
                above, that you own or have the right to upload the files you
                will submit, and that you consent to The Arc storing and
                processing your health documents in accordance with our privacy
                policy. This consent is for this upload session only.
              </p>
              <div className="mt-6">
                <ConsentButton />
              </div>
            </section>

          </div>
        </div>
      </Container>
    </div>
  );
}

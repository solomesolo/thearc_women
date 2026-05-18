import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ComingSoonProvider } from "@/components/providers/ComingSoonProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { EarlyAccessProvider } from "@/lib/early-access/EarlyAccessContext";
import { EarlyAccessModal } from "@/components/modals/EarlyAccessModal";
import { InviteCodeModal } from "@/components/modals/InviteCodeModal";
import { BackgroundProcessingMonitor } from "@/components/app/BackgroundProcessingMonitor";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Arc | Female performance health",
  description:
    "A health platform built for women who lead. Evidence-based, no fluff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased text-[var(--foreground)]">
        <SessionProvider>
          <EarlyAccessProvider>
            <ComingSoonProvider>
              <Header />
              {children}
              <Footer />
              <CookieConsentBanner />
            </ComingSoonProvider>
            <EarlyAccessModal />
            <InviteCodeModal />
            <BackgroundProcessingMonitor />
          </EarlyAccessProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
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
          <Header />
          {children}
          <Footer />
          <CookieConsentBanner />
        </SessionProvider>
      </body>
    </html>
  );
}

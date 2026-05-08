import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import { LanguageProvider } from "@/components/language-provider";
import AppFooter from "@/components/app-footer";

export const metadata: Metadata = {
  title: "Shelby AI Evidence Vault",
  description:
    "A verifiable evidence storage and read-receipt demo for AI agents on Shelby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#fcfaf8] text-[#322312]">
        <LanguageProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <AppFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}

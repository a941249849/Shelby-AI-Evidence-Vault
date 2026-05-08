import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

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
      <body className="min-h-full flex flex-col bg-[#090a0d] text-[#f4f0e8]">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-white/10 bg-[#090a0d] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#9d9a92]">
              Shelby AI Evidence Vault - verifiable evidence packs, blob identity, read receipts.
            </p>
            <p className="text-xs text-[#6f716d]">MIT License</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

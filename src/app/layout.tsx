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
      <body className="min-h-full flex flex-col bg-[#f4efe2] text-[#2d211c]">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-[#2d211c]/10 bg-[#f4efe2] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#6f6258]">
              Shelby AI Evidence Vault - verifiable evidence packs, blob identity, read receipts.
            </p>
            <p className="text-xs text-[#978978]">MIT License</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

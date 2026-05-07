import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Shelby AI Evidence Vault",
  description:
    "A verifiable evidence storage and read-receipt demo for AI agents, built on Shelby testnet.",
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-slate-400 text-xs">
              Shelby AI Evidence Vault — M1 Demo. Not for production use.
            </p>
            <p className="text-slate-500 text-xs">MIT License</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

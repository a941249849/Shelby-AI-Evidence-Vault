import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Shelby AI Evidence Vault",
  description:
    "A verifiable evidence storage and read-receipt demo for AI agents. M1B: local mock upload with future-correct Shelby adapter boundary.",
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
      <body className="min-h-full flex flex-col bg-[#0b0e14] text-slate-200">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-950 border-t border-slate-800/60 py-5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-slate-500 text-xs font-mono">
              shelby-ai-evidence-vault · M1B · local mock upload only · not for production
            </p>
            <p className="text-slate-600 text-xs">MIT License</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

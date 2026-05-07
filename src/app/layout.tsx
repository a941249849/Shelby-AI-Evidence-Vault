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
      <body className="min-h-full flex flex-col bg-[#fcfaf8] text-[#161008]">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-[#322312] bg-[#4f192a] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#BFC7D8]">
              Shelby AI Evidence Vault - M1B Demo. Local mock upload only. Not for production use.
            </p>
            <p className="text-xs text-[#6f6258]">MIT License</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import SiteFooter from "@/components/site-footer";
import UploadProviders from "@/app/upload/providers";

export const metadata: Metadata = {
  title: "Shelby AI Evidence Vault",
  description:
    "A Shelby ecosystem interface for verifiable AI evidence packs, Blob identity, and read receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#fffaf4] text-[#2b1b10]">
        <UploadProviders>
          <Nav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </UploadProviders>
      </body>
    </html>
  );
}

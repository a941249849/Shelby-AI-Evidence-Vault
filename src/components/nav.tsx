import Link from 'next/link';
import { Database, FileUp, GitBranch, ReceiptText } from 'lucide-react';

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#fcfaf8]/10 bg-[#4f192a]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-3 text-[#fcfaf8] font-semibold text-base hover:text-[#9fe878] transition-colors"
          >
            <span className="shelby-hex grid h-9 w-9 place-items-center border border-[#fcfaf8]/20 bg-[#de8aff] text-[#4f192a] shadow-[0_0_24px_rgba(222,138,255,0.34)]">
              <Database size={16} strokeWidth={2.2} />
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <span>AI Evidence Vault</span>
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffc2ad] mt-1">
                Shelby M1B
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-[#ffdfef] px-3 py-2 transition-colors hover:bg-[#fcfaf8]/10 hover:text-[#fcfaf8]"
            >
              <Database size={15} />
              <span className="hidden sm:inline">Index</span>
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-[#ffdfef] px-3 py-2 transition-colors hover:bg-[#fcfaf8]/10 hover:text-[#fcfaf8]"
            >
              <FileUp size={15} />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link
              href="/read-receipt/rr-001"
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-[#ffdfef] px-3 py-2 transition-colors hover:bg-[#fcfaf8]/10 hover:text-[#fcfaf8]"
            >
              <ReceiptText size={15} />
              <span className="hidden md:inline">Receipt</span>
            </Link>
            <a
              href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-[#ffdfef] px-3 py-2 transition-colors hover:bg-[#fcfaf8]/10 hover:text-[#fcfaf8]"
            >
              <GitBranch size={15} />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

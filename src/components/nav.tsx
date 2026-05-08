import Link from 'next/link';
import { Database, FileUp, GitBranch, ReceiptText } from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Index', icon: Database },
  { href: '/upload', label: 'Upload', icon: FileUp },
  { href: '/read-receipt/rr-001', label: 'Receipt', icon: ReceiptText },
];

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#090a0d]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="shelby-mark h-9 w-9 flex-none">
            <span />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-sm font-semibold text-[#f4f0e8] transition group-hover:text-[#9fe878]">
              Shelby AI Evidence Vault
            </span>
            <span className="block font-mono text-[0.65rem] font-semibold uppercase text-[#9d9a92]">
              Hot storage proof surface
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex h-9 items-center gap-1.5 border border-transparent px-3 text-sm font-semibold text-[#c7c1b8] transition hover:border-white/10 hover:bg-white/[0.055] hover:text-[#f4f0e8]"
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <a
            href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-[#f4f0e8] transition hover:border-[#9fe878]/50 hover:text-[#9fe878]"
          >
            <GitBranch size={15} />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

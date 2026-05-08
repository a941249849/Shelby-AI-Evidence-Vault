import Link from 'next/link';
import { Database, FileUp, GitBranch, ReceiptText, ShieldCheck } from 'lucide-react';

const links = [
  { href: '/#product', label: 'Product', icon: ShieldCheck },
  { href: '/dashboard', label: 'Registry', icon: Database },
  { href: '/upload', label: 'Create', icon: FileUp },
  { href: '/read-receipt/rr-001', label: 'Receipt', icon: ReceiptText },
];

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#e5d7cf] bg-[#fffdf9]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.65rem] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="shelby-symbol flex-none" aria-hidden="true">
            <span />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-lg font-black text-[#2f1f12] transition group-hover:text-[#ff4faf]">
              Shelby AI Evidence Vault
            </span>
            <span className="block font-mono text-[0.68rem] font-semibold uppercase text-[#7b695d]">
              AI evidence layer on Shelby
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex h-10 items-center gap-1.5 border border-transparent px-3 text-sm font-bold text-[#433328] transition hover:border-[#e5d7cf] hover:bg-[#fff2f9] hover:text-[#ff4faf]"
            >
              <Icon size={15} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
          <a
            href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex h-10 items-center gap-1.5 border border-[#d8c8be] bg-[#2f1f12] px-3 text-sm font-bold text-white transition hover:bg-[#ff5fb8]"
          >
            <GitBranch size={15} />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

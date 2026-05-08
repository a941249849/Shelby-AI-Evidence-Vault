'use client';

import Link from 'next/link';
import { Database, FileUp, GitBranch, Languages, ReceiptText, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/language-state';

const copy = {
  zh: {
    subtitle: '热点存储证明界面',
    product: '产品',
    registry: '索引',
    create: '上传',
    receipt: '回执',
    language: '文A EN',
  },
  en: {
    subtitle: 'Verifiable evidence interface',
    product: 'Product',
    registry: 'Registry',
    create: 'Upload',
    receipt: 'Receipt',
    language: 'EN 文A',
  },
};

export default function Nav() {
  const { language, toggleLanguage } = useLanguage();
  const t = copy[language];
  const links = [
    { href: '/#product', label: t.product, icon: ShieldCheck },
    { href: '/dashboard', label: t.registry, icon: Database },
    { href: '/upload', label: t.create, icon: FileUp },
    { href: '/read-receipt/rr-001', label: t.receipt, icon: ReceiptText },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#eadfd6] bg-[#fffaf4]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.45rem] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="shelby-symbol flex-none" aria-hidden="true">
            <span />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-lg font-black text-[#2f1f12] transition group-hover:text-[#ff4faf]">
              Shelby AI Evidence Vault
            </span>
            <span className="block font-mono text-[0.68rem] font-semibold uppercase text-[#7b695d]">
              {t.subtitle}
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
          <button
            type="button"
            onClick={toggleLanguage}
            className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full border border-[#dfd2c9] bg-[#fffdf9] px-3 text-sm font-bold text-[#433328] transition hover:border-[#ff9aca] hover:text-[#ff4faf]"
            aria-label="Toggle language"
          >
            <Languages size={15} />
            <span>{t.language}</span>
          </button>
          <a
            href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full border border-[#d8c8be] bg-[#2f1f12] px-4 text-sm font-bold text-white transition hover:bg-[#ff5fb8]"
          >
            <GitBranch size={15} />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

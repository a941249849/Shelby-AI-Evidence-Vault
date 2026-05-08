'use client';

import Link from 'next/link';
import { Database, FileUp, GitBranch, Languages, ReceiptText } from 'lucide-react';
import { useI18n } from '@/components/language-provider';
import ShelbyLogo from '@/components/shelby-logo';

const links = [
  { href: '/dashboard', labelKey: 'nav.index', icon: Database },
  { href: '/upload', labelKey: 'nav.upload', icon: FileUp },
  { href: '/read-receipt/rr-001', labelKey: 'nav.receipt', icon: ReceiptText },
];

export default function Nav() {
  const { language, toggleLanguage, t } = useI18n();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2d211c]/10 bg-[#f4efe2]/86 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <ShelbyLogo className="h-11 w-11 flex-none" />
          <span className="hidden min-w-0 sm:block">
            <span className="block text-sm font-semibold text-[#2d211c] transition group-hover:text-[#157a4c]">
              Shelby AI Evidence Vault
            </span>
            <span className="block font-mono text-[0.65rem] font-semibold uppercase text-[#6f6258]">
              {t('nav.subtitle')}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-transparent px-3 text-sm font-semibold text-[#5f554d] transition hover:border-[#2d211c]/10 hover:bg-[#fff8ea] hover:text-[#2d211c]"
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#2d211c]/10 bg-[#fff8ea]/72 px-3 text-sm font-semibold text-[#5f554d] transition hover:border-[#157a4c]/30 hover:text-[#157a4c]"
            aria-label={t('nav.language')}
          >
            <Languages size={15} />
            <span>{language === 'en' ? '中' : 'EN'}</span>
          </button>
          <a
            href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#2d211c]/12 bg-[#2d211c] px-3 text-sm font-semibold text-[#fff8ea] transition hover:bg-[#157a4c]"
          >
            <GitBranch size={15} />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { Circle, GitBranch, Languages } from 'lucide-react';
import { useI18n } from '@/components/language-provider';
import ShelbyLogo from '@/components/shelby-logo';

const links = [
  { href: '/', labelKey: 'nav.product' },
  { href: '/#evidence-flow', labelKey: 'nav.solution' },
  { href: '/#developers', labelKey: 'nav.developers' },
  { href: 'https://docs.shelby.xyz/', labelKey: 'nav.docs', external: true },
  { href: '/#ecosystem', labelKey: 'nav.ecosystem' },
];

export default function Nav() {
  const { language, toggleLanguage, t } = useI18n();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#322312]/10 bg-[#fcfaf8]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <ShelbyLogo className="h-9 w-9 flex-none text-[#322312]" />
          <span className="hidden min-w-0 sm:block">
            <span className="brand-wordmark block text-xl leading-none text-[#322312] transition group-hover:text-[#ff77c9]">
              Shelby <span className="text-[#ff77c9]">AI Evidence Vault</span>
            </span>
            <span className="mt-1 block font-mono text-[0.65rem] font-medium uppercase text-[#454039]">
              {t('nav.subtitle')}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          {links.map(({ href, labelKey, external }) => (
            <Link
              key={href}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="text-sm font-semibold text-[#322312] transition hover:text-[#ff77c9]"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden h-9 items-center rounded-full border border-[#322312]/12 bg-[#fcfaf8] px-4 text-sm font-semibold text-[#322312] transition hover:border-[#ff77c9]/50 hover:text-[#ff77c9] md:inline-flex"
          >
            {t('nav.launch')}
          </Link>
          <div className="hidden h-9 items-center gap-2 rounded-full border border-[#322312]/12 bg-[#fcfaf8] px-4 font-mono text-xs text-[#322312] xl:inline-flex">
            <Circle size={9} className="fill-[#9fe878] text-[#9fe878]" />
            {t('nav.ready')}
          </div>
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#322312]/10 bg-[#fcfaf8] px-3 text-sm font-semibold text-[#322312] transition hover:border-[#ff77c9]/50 hover:text-[#ff77c9]"
            aria-label={t('nav.language')}
          >
            <Languages size={15} />
            <span>{language === 'en' ? '中' : 'EN'}</span>
          </button>
          <a
            href="https://github.com/a941249849/Shelby-AI-Evidence-Vault"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#322312]/12 bg-[#322312] px-3 text-sm font-semibold text-[#fcfaf8] transition hover:bg-[#ff77c9] hover:text-[#322312]"
          >
            <GitBranch size={15} />
            <span className="hidden md:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

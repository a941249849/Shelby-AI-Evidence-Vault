'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-state';

export default function SiteFooter() {
  const { language } = useLanguage();
  const network = process.env.NEXT_PUBLIC_SHELBY_NETWORK;
  const statusLabel =
    network === 'testnet'
      ? language === 'zh'
        ? 'Testnet 模式'
        : 'Testnet mode'
      : language === 'zh'
        ? 'Mock 模式'
        : 'Mock mode';

  return (
    <footer className="border-t border-[#eadfd6] bg-[#fffaf4] py-6 text-[#2f1f12]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="shelby-symbol scale-75" aria-hidden="true">
            <span />
          </span>
          <div>
            <p className="text-sm font-black">Shelby AI Evidence Vault</p>
            <p className="text-xs text-[#7b695d]">
              {language === 'zh'
                ? '2025 Shelby Labs. 可验证证据与读取回执界面。'
                : '2025 Shelby Labs. Verifiable evidence and read receipts.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-[#6d5f55]">
          <Link href="/testnet" className="transition hover:text-[#ff4faf]">
            {language === 'zh' ? '测试网' : 'Testnet'}
          </Link>
          <a
            href="https://docs.shelby.xyz/sdks/react/mutations/use-upload-blobs"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-[#ff4faf]"
          >
            {language === 'zh' ? '文档' : 'Docs'}
          </a>
          <span>SDK</span>
          <span>API</span>
          <span>{language === 'zh' ? 'Builder Demo' : 'Builder Demo'}</span>
          <span>{language === 'zh' ? '隐私政策' : 'Privacy'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-[#dff5d7] px-3 py-1 text-xs font-bold text-[#317c24]">
            {statusLabel}
          </span>
          <span className="font-mono text-xs text-[#7b695d]">v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}

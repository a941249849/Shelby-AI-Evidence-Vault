'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Database, FileUp, ReceiptText, Wallet } from 'lucide-react';
import { useLanguage } from '@/components/language-state';

const copy = {
  zh: {
    label: 'Shelby 测试网产品路径',
    status: 'testnet-ready',
    steps: [
      ['准备钱包', '确认 Aptos Testnet 与签名状态', '/testnet'],
      ['上传证据', '封装文件并注册 Shelby Blob', '/upload'],
      ['证据库', '检查证据包与 Blob 身份', '/dashboard'],
      ['验证回执', '追溯回答引用与检索链路', '/read-receipt/rr-001'],
    ],
    cta: '继续上传',
  },
  en: {
    label: 'Shelby testnet product path',
    status: 'testnet-ready',
    steps: [
      ['Wallet readiness', 'Confirm Aptos Testnet and signed session', '/testnet'],
      ['Upload evidence', 'Package files and register Shelby Blob', '/upload'],
      ['Evidence registry', 'Inspect packs and Blob identity', '/dashboard'],
      ['Verify receipt', 'Trace answer evidence and retrieval path', '/read-receipt/rr-001'],
    ],
    cta: 'Continue upload',
  },
};

const icons = [Wallet, FileUp, Database, ReceiptText];

function activeIndexForPath(pathname: string): number {
  if (pathname.startsWith('/upload')) return 1;
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/blob')) return 2;
  if (pathname.startsWith('/read-receipt')) return 3;
  if (pathname.startsWith('/testnet')) return 0;
  return -1;
}

export default function ProductFlowShell() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const t = copy[language];
  const activeIndex = activeIndexForPath(pathname);

  return (
    <section className="product-flow-shell border-b border-[#eadfd6] bg-[#fffdf9]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#b7e7a6] bg-[#ecffe8] px-3 py-1.5 font-mono text-xs font-bold text-[#245f1b]">
            <CheckCircle2 size={14} />
            {t.status}
          </span>
          <p className="font-mono text-xs font-bold uppercase text-[#7b695d]">
            {t.label}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto lg:justify-center">
          {t.steps.map(([title, body, href], index) => {
            const Icon = icons[index];
            const active = index === activeIndex;
            const complete = activeIndex > index;
            return (
              <Link
                key={href}
                href={href}
                className={`product-flow-step ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
              >
                <span className="product-flow-step-index">
                  {complete ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{title}</span>
                  <span className="hidden truncate text-xs text-[#7b695d] xl:block">{body}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <Link href="/upload" className="inline-flex h-9 flex-none items-center justify-center rounded-full bg-[#2f1f12] px-4 text-sm font-black text-white transition hover:bg-[#ff5fb8] hover:text-[#2f1f12]">
          {t.cta}
        </Link>
      </div>
    </section>
  );
}

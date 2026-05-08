'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Box,
  Code2,
  FileText,
  FolderOpen,
  Globe2,
  ReceiptText,
  Terminal,
  UploadCloud,
  Webhook,
} from 'lucide-react';
import { useI18n } from '@/components/language-provider';
import ShelbyLogo from '@/components/shelby-logo';

function SplitCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-12 overflow-hidden rounded-lg border border-[#322312]/14 bg-[#322312] text-[#fcfaf8] shadow-[0_16px_38px_rgba(50,35,18,0.16)] transition hover:-translate-y-0.5 hover:border-[#ff77c9]/70"
    >
      <span className="inline-flex items-center gap-2 px-5 text-sm font-semibold">
        <UploadCloud size={18} />
        {children}
      </span>
      <span className="grid min-w-14 place-items-center bg-[#ff77c9] text-[#322312] transition group-hover:bg-[#ffc2e1]">
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

function FlowNode({
  index,
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  index: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  tone: 'circle' | 'hex' | 'dark';
}) {
  const iconShell =
    tone === 'dark'
      ? 'bg-[#322312] text-[#fcfaf8] shadow-[0_18px_38px_rgba(50,35,18,0.22)] [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]'
      : tone === 'hex'
        ? 'bg-[#ffc2e1] text-[#322312] [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]'
        : 'rounded-full bg-[#ffc2e1] text-[#322312]';

  return (
    <div className="relative z-10 text-center">
      <div className={`mx-auto grid h-20 w-20 place-items-center ${iconShell}`}>
        <Icon className="h-9 w-9" />
      </div>
      <p className="mt-5 font-mono text-xs font-semibold text-[#322312]">{index}</p>
      <h3 className="mt-2 text-base font-semibold text-[#322312]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[10rem] text-sm leading-6 text-[#454039]">{subtitle}</p>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  body,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <article className="group rounded-lg border border-[#322312]/14 bg-[#fcfaf8]/92 p-7 shadow-[0_16px_46px_rgba(50,35,18,0.07)] transition hover:-translate-y-1 hover:border-[#ff77c9]/45 hover:shadow-[0_22px_60px_rgba(50,35,18,0.10)]">
      <div className="flex items-center gap-5">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#ffc2e1] text-[#322312]">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold leading-tight text-[#322312]">{title}</h3>
      </div>
      <p className="mt-8 min-h-20 text-base leading-8 text-[#454039]">{body}</p>
      <Link
        href={meta}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ff77c9] transition group-hover:text-[#322312]"
      >
        {useI18n().t('home.learnMore')}
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}

function EvidenceFlowPanel() {
  const { t } = useI18n();
  const flow = [
    {
      index: '01',
      icon: FileText,
      title: t('home.flow.source.title'),
      subtitle: t('home.flow.source.subtitle'),
      tone: 'circle' as const,
    },
    {
      index: '02',
      icon: Box,
      title: t('home.flow.pack.title'),
      subtitle: t('home.flow.pack.subtitle'),
      tone: 'hex' as const,
    },
    {
      index: '03',
      icon: ShelbyLogo,
      title: t('home.flow.blob.title'),
      subtitle: t('home.flow.blob.subtitle'),
      tone: 'dark' as const,
    },
    {
      index: '04',
      icon: ReceiptText,
      title: t('home.flow.receipt.title'),
      subtitle: t('home.flow.receipt.subtitle'),
      tone: 'circle' as const,
    },
  ];
  const receiptRow = [
    ['HASH (SHA256)', 'c3f6e8...9a7b2d'],
    ['SHELBY REF', 'shelby://ref/c3f6e8...9a7b2d'],
    ['NETWORK', 'Shelby Testnet'],
    ['STATUS', 'verified'],
    ['PACK TYPE', 'dataset.pack'],
  ];

  return (
    <section
      id="evidence-flow"
      className="min-w-0 rounded-[22px] border border-[#322312]/14 bg-[#fcfaf8]/92 p-5 shadow-[0_28px_90px_rgba(50,35,18,0.12)] backdrop-blur sm:p-7"
    >
      <p className="font-mono text-sm font-semibold uppercase text-[#ff77c9]">
        {t('home.flow.eyebrow')}
      </p>
      <div className="relative mt-11 grid gap-9 md:grid-cols-4 md:gap-4">
        <div className="absolute left-[11%] right-[11%] top-10 hidden border-t border-dashed border-[#ff77c9]/55 md:block" />
        {flow.map((item) => (
          <FlowNode key={item.index} {...item} />
        ))}
      </div>
      <div className="mt-11 overflow-hidden rounded-lg border border-[#322312]/14 bg-[#fcfaf8]">
        <div className="grid min-w-0 grid-cols-[1fr_1.35fr_0.88fr_0.72fr_0.85fr]">
          {receiptRow.map(([label, value]) => (
            <div key={label} className="min-w-0 border-r border-[#322312]/10 px-3 py-4 last:border-r-0 lg:px-4">
              <p className="truncate font-mono text-[0.64rem] font-semibold uppercase text-[#454039]">
                {label}
              </p>
              <p className="mt-3 truncate font-mono text-xs text-[#322312]">
                {label === 'STATUS' ? (
                  <span className="rounded-md border border-[#74d481]/50 bg-[#dfffcc] px-2 py-0.5 text-[#2f7c3c]">
                    {value}
                  </span>
                ) : (
                  value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const featureTiles = [
    {
      icon: Box,
      title: t('home.feature.packs.title'),
      body: t('home.feature.packs.body'),
      meta: '/upload',
    },
    {
      icon: ShelbyLogo,
      title: t('home.feature.blob.title'),
      body: t('home.feature.blob.body'),
      meta: '/dashboard',
    },
    {
      icon: ReceiptText,
      title: t('home.feature.receipt.title'),
      body: t('home.feature.receipt.body'),
      meta: '/read-receipt/rr-001',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fcfaf8] text-[#322312]">
      <div className="shelby-ribbon shelby-ribbon-top-brown" />
      <div className="shelby-ribbon shelby-ribbon-top-pink" />
      <div className="shelby-ribbon shelby-ribbon-right-brown" />
      <div className="shelby-ribbon shelby-ribbon-right-pink" />
      <div className="shelby-ribbon shelby-ribbon-left-pink" />

      <section className="relative px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pb-12 lg:pt-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div className="relative z-10 min-w-0">
            <p className="font-mono text-sm font-semibold uppercase text-[#ff77c9]">
              {t('home.eyebrow')}
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] text-[#322312] sm:text-6xl lg:text-6xl">
              {t('home.title')
                .split('\n')
                .map((line) => (
                  <span key={line} className="block sm:whitespace-nowrap">
                    {line}
                  </span>
                ))}
            </h1>
            <p className="mt-7 max-w-xl whitespace-pre-line text-lg leading-9 text-[#322312]">
              {t('home.body')}
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <SplitCta href="/upload">{t('home.cta.upload')}</SplitCta>
              <Link href="/dashboard" className="ui-button ui-button-secondary rounded-lg">
                <FolderOpen size={18} />
                {t('home.cta.index')}
              </Link>
              <Link
                href="/read-receipt/rr-001"
                className="inline-flex min-h-11 items-center gap-2 border-b border-[#322312]/35 text-sm font-semibold text-[#322312] transition hover:border-[#ff77c9] hover:text-[#ff77c9]"
              >
                {t('home.cta.receipt')}
                <ArrowRight size={16} className="-rotate-45" />
              </Link>
            </div>
          </div>

          <div className="relative z-10 min-w-0 lg:translate-y-5">
            <EvidenceFlowPanel />
          </div>
        </div>
      </section>

      <section id="solution" className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {featureTiles.map((tile) => (
            <FeatureTile key={tile.title} {...tile} />
          ))}
        </div>
      </section>

      <section id="developers" className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#ff77c9]/34 bg-[#ffdfef]/58 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-[#ff77c9]/32 bg-[#fcfaf8] text-[#ff77c9]">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#322312]">{t('home.dev.title')}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#454039]">{t('home.dev.body')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              [Globe2, 'REST API'],
              [Terminal, 'TypeScript SDK'],
              [Terminal, 'CLI'],
              [Webhook, 'Webhooks'],
            ].map(([Icon, label]) => {
              const DevIcon = Icon as React.ComponentType<{ className?: string }>;
              return (
                <span
                  key={String(label)}
                  className="inline-flex items-center gap-2 rounded-md border border-[#322312]/12 bg-[#fcfaf8] px-3 py-2 text-xs font-semibold text-[#322312]"
                >
                  <DevIcon className="h-4 w-4" />
                  {label as string}
                </span>
              );
            })}
            <Link
              href="https://docs.shelby.xyz/"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#ff77c9] transition hover:text-[#322312]"
            >
              {t('home.dev.docCta')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section id="experiment" className="relative px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-[#322312]/14 bg-[#fcfaf8]/92 p-6 shadow-[0_16px_46px_rgba(50,35,18,0.06)]">
          <div className="grid gap-8 lg:grid-cols-[0.58fr_1.42fr] lg:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase text-[#ff77c9]">
                {t('home.principle.eyebrow')}
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[#322312]">
                {t('home.principle.title')}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#454039]">{t('home.principle.body')}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                [
                  '01',
                  t('home.principle.pack.title'),
                  t('home.principle.pack.body'),
                  'pack_hash + manifest',
                ],
                [
                  '02',
                  t('home.principle.blob.title'),
                  t('home.principle.blob.body'),
                  'shelby_ref + network',
                ],
                [
                  '03',
                  t('home.principle.receipt.title'),
                  t('home.principle.receipt.body'),
                  'receipt_id + status',
                ],
              ].map(([index, title, body, meta]) => (
                <article key={index} className="rounded-lg border border-[#322312]/10 bg-[#f7f1e9]/72 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs font-semibold text-[#ff77c9]">{index}</p>
                    <p className="truncate font-mono text-[0.62rem] uppercase text-[#454039]">{meta}</p>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#322312]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#454039]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

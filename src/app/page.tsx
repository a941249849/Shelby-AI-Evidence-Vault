'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Box,
  Code2,
  Database,
  FileText,
  FolderOpen,
  Globe2,
  ReceiptText,
  Terminal,
  UploadCloud,
  Webhook,
} from 'lucide-react';
import { evidencePacks } from '@/lib/demo-data';
import EvidencePackCard from '@/components/evidence-pack-card';
import { useI18n } from '@/components/language-provider';
import ShelbyLogo from '@/components/shelby-logo';

const demoPacks = evidencePacks.slice(0, 3);

function FlowCard({
  index,
  icon: Icon,
  title,
  subtitle,
  meta,
  active = false,
}: {
  index: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  meta: string;
  active?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-3 font-mono text-xs font-semibold text-[#ff77c9]">{index}</p>
      <div className={`evidence-flow-card ${active ? 'evidence-flow-card-active' : ''} rounded-lg p-5`}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-md border border-[#ff77c9]/35 bg-[#ffdfef]/74 text-[#322312]">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-center text-base font-semibold text-[#322312]">{title}</h3>
        <p className="mt-1 text-center text-xs font-semibold text-[#454039]">{subtitle}</p>
      </div>
      <div className="mt-4 rounded-lg border border-[#ff77c9]/28 bg-[#fcfaf8] p-3">
        <p className="font-mono text-[0.66rem] font-medium uppercase leading-5 text-[#454039]">
          {meta}
        </p>
      </div>
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
    <article className="rounded-lg border border-[#ff77c9]/28 bg-[#fcfaf8]/88 p-5 shadow-[0_14px_45px_rgba(50,35,18,0.06)]">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-md border border-[#ff77c9]/26 bg-[#ffdfef] text-[#322312]">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold text-[#322312]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#454039]">{body}</p>
      <p className="mt-5 inline-flex rounded-md border border-[#ff77c9]/24 bg-[#fcfaf8] px-3 py-1 font-mono text-[0.68rem] font-medium uppercase text-[#322312]">
        {meta}
      </p>
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
      meta: t('home.flow.source.meta'),
    },
    {
      index: '02',
      icon: Box,
      title: t('home.flow.pack.title'),
      subtitle: t('home.flow.pack.subtitle'),
      meta: t('home.flow.pack.meta'),
      active: true,
    },
    {
      index: '03',
      icon: ShelbyLogo,
      title: t('home.flow.blob.title'),
      subtitle: t('home.flow.blob.subtitle'),
      meta: t('home.flow.blob.meta'),
    },
    {
      index: '04',
      icon: ReceiptText,
      title: t('home.flow.receipt.title'),
      subtitle: t('home.flow.receipt.subtitle'),
      meta: t('home.flow.receipt.meta'),
    },
  ];

  return (
    <section id="evidence-flow" className="rounded-lg border border-[#ff77c9]/30 bg-[#fcfaf8]/86 p-5 shadow-[0_24px_90px_rgba(50,35,18,0.10)] backdrop-blur">
      <p className="mb-7 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#ff77c9]">
        {t('home.flow.eyebrow')}
      </p>
      <div className="grid gap-4 md:grid-cols-4">
        {flow.map((item, index) => (
          <div key={item.index} className="relative">
            {index < flow.length - 1 && (
              <div className="absolute left-[calc(100%-0.35rem)] top-[6.4rem] z-10 hidden w-8 border-t border-dashed border-[#ff77c9]/60 md:block" />
            )}
            <FlowCard {...item} />
          </div>
        ))}
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
      meta: 'PACK_HASH - ITEMS - CREATED_AT',
    },
    {
      icon: ShelbyLogo,
      title: t('home.feature.blob.title'),
      body: t('home.feature.blob.body'),
      meta: 'SHELBY_REF - NETWORK - IMMUTABLE',
    },
    {
      icon: ReceiptText,
      title: t('home.feature.receipt.title'),
      body: t('home.feature.receipt.body'),
      meta: 'RECEIPT_ID - SIGNER - VERIFIED',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fcfaf8] text-[#322312]">
      <div className="brand-pattern-hero -right-28 top-20 h-[38rem] w-[28rem] rotate-90 md:right-0 md:w-[34rem]" />
      <div className="brand-pattern-hero -bottom-40 -left-40 h-[34rem] w-[30rem] rotate-[60deg] opacity-70" />

      <section className="relative px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pb-12 lg:pt-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div className="relative z-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#ff77c9]">
              {t('home.eyebrow')}
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.93] tracking-[-0.05em] text-[#322312] sm:text-6xl lg:text-7xl">
              {t('home.title')}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#322312]">{t('home.body')}</p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/upload" className="ui-button rounded-lg">
                <UploadCloud size={18} />
                {t('home.cta.upload')}
              </Link>
              <Link href="/dashboard" className="ui-button ui-button-secondary rounded-lg">
                <FolderOpen size={18} />
                {t('home.cta.index')}
              </Link>
              <Link
                href="/read-receipt/rr-001"
                className="inline-flex min-h-11 items-center gap-2 border-b border-[#322312]/35 text-sm font-semibold text-[#322312] transition hover:border-[#ff77c9] hover:text-[#ff77c9]"
              >
                {t('home.cta.receipt')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative z-10 lg:translate-y-5">
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
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-lg border border-[#ff77c9]/28 bg-[#ffdfef]/52 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-[#ff77c9]/32 bg-[#fcfaf8] text-[#ff77c9]">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#322312]">{t('home.dev.title')}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#454039]">{t('home.dev.body')}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              [Globe2, 'REST API', 'HTTP'],
              [Terminal, 'TypeScript SDK', 'npm install'],
              [Terminal, 'CLI', 'shelby-vault'],
              [Webhook, 'Webhooks', t('home.dev.webhooks')],
            ].map(([Icon, label, sub]) => {
              const DevIcon = Icon as React.ComponentType<{ className?: string }>;
              return (
                <div
                  key={String(label)}
                  className="rounded-lg border border-[#322312]/10 bg-[#fcfaf8] px-4 py-3"
                >
                  <DevIcon className="mb-2 h-5 w-5 text-[#322312]" />
                  <p className="text-sm font-semibold text-[#322312]">{label as string}</p>
                  <p className="font-mono text-[0.66rem] text-[#454039]">{sub as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="ui-chip">
                <Database size={13} />
                {t('home.corpus.eyebrow')}
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#322312]">
                {t('home.corpus.title')}
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#322312] transition hover:text-[#ff77c9]"
            >
              {t('home.corpus.full')}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {demoPacks.map((pack) => (
              <EvidencePackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Database,
  Fingerprint,
  Network,
  ReceiptText,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { evidencePacks } from '@/lib/demo-data';
import EvidencePackCard from '@/components/evidence-pack-card';
import { useI18n } from '@/components/language-provider';
import ShelbyLogo from '@/components/shelby-logo';

const demoPacks = evidencePacks.slice(0, 3);

function ProofStep({
  index,
  title,
  body,
  tone,
  dark = false,
}: {
  index: string;
  title: string;
  body: string;
  tone: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[3rem_1fr] gap-4 border-b pb-5 last:border-b-0 ${
        dark ? 'border-white/10' : 'border-[#2d211c]/10'
      }`}
    >
      <div className={`grid h-12 w-12 place-items-center rounded-full border ${tone}`}>
        <span className="font-mono text-xs font-semibold">{index}</span>
      </div>
      <div>
        <h3 className={`text-base font-semibold ${dark ? 'text-[#fff8ea]' : 'text-[#2d211c]'}`}>
          {title}
        </h3>
        <p className={`mt-1 text-sm leading-6 ${dark ? 'text-[#cfc4b4]' : 'text-[#6f6258]'}`}>
          {body}
        </p>
      </div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  className: string;
}) {
  return (
    <div className={`shelby-cut p-5 ${className}`}>
      <div className="mb-8 grid h-11 w-11 place-items-center rounded-full border border-[#2d211c]/12 bg-[#fff8ea]/72 text-[#2d211c]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[#2d211c]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#4d433c]">{body}</p>
    </div>
  );
}

function ProductPanel() {
  const { t } = useI18n();

  return (
    <div className="shelby-cut relative overflow-hidden border border-[#2d211c]/12 bg-[#fff8ea] p-4 shadow-[0_30px_90px_rgba(80,48,24,0.18)]">
      <div className="hex-field absolute inset-0 opacity-30" />
      <div className="relative grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="shelby-cut bg-[#2d211c] p-5 text-[#fff8ea]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="ui-chip border-white/15 bg-white/10 text-[#fff8ea]">
              <Network size={13} />
              {t('home.panel.eyebrow')}
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dff2c8] text-[#157a4c]">
              <ShieldCheck size={19} />
            </div>
          </div>
          <div className="space-y-4">
            <ProofStep
              index="01"
              title={t('home.step.pack.title')}
              body={t('home.step.pack.body')}
              tone="border-[#f0c846]/45 bg-[#f0c846]/16 text-[#f0c846]"
              dark
            />
            <ProofStep
              index="02"
              title={t('home.step.bind.title')}
              body={t('home.step.bind.body')}
              tone="border-[#ef6f4d]/45 bg-[#ef6f4d]/16 text-[#ffb49e]"
              dark
            />
            <ProofStep
              index="03"
              title={t('home.step.resolve.title')}
              body={t('home.step.resolve.body')}
              tone="border-[#9fe878]/45 bg-[#9fe878]/16 text-[#b9f39d]"
              dark
            />
          </div>
        </section>

        <aside className="grid gap-4">
          <div className="shelby-cut duotone-green p-5">
            <p className="font-mono text-xs font-semibold uppercase text-[#157a4c]">
              {t('home.panel.runtime')}
            </p>
            <p className="mt-5 text-5xl font-semibold text-[#2d211c]">SQLite</p>
            <p className="mt-2 text-sm text-[#4d433c]">{t('home.panel.sqliteBody')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="shelby-cut duotone-lilac p-4">
              <p className="font-mono text-xs font-semibold uppercase text-[#6a3ea1]">
                {t('home.panel.packs')}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#2d211c]">{evidencePacks.length}</p>
            </div>
            <div className="shelby-cut duotone-coral p-4">
              <p className="font-mono text-xs font-semibold uppercase text-[#a33f2d]">
                {t('home.panel.blobs')}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#2d211c]">
                {evidencePacks.reduce((sum, pack) => sum + pack.blobCount, 0)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const graphItems = [
    ['home.graph.pack', 'home.graph.packValue', 'bg-[#dff2c8] text-[#157a4c]'],
    ['home.graph.blob', 'home.graph.blobValue', 'bg-[#efe2ff] text-[#6a3ea1]'],
    ['home.graph.receipt', 'home.graph.receiptValue', 'bg-[#ffe0cf] text-[#a33f2d]'],
  ];
  const heroChips = ['home.chip.pack', 'home.chip.bind', 'home.chip.receipt'];

  return (
    <div className="kinetic-grid min-h-screen text-[#2d211c]">
      <section className="relative overflow-hidden px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-16">
        <div className="pointer-events-none absolute left-[43%] top-8 hidden h-28 w-28 rotate-[18deg] rounded-full border border-[#2d211c]/10 bg-[#dff2c8]/70 lg:block" />
        <div className="pointer-events-none absolute right-[7%] top-24 hidden h-24 w-40 -rotate-[10deg] bg-[#ffe0cf]/75 lg:block shelby-cut" />
        <div className="pointer-events-none absolute bottom-8 left-[36%] hidden h-20 w-32 rotate-[9deg] bg-[#efe2ff]/70 lg:block shelby-cut-sm" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="relative z-10 py-4">
            <div className="mb-8 flex items-center gap-4">
              <ShelbyLogo className="h-20 w-20 flex-none" />
              <div>
                <p className="font-mono text-xs font-semibold uppercase text-[#157a4c]">
                  {t('home.eyebrow')}
                </p>
                <p className="mt-1 text-sm text-[#6f6258]">{t('home.subtitle')}</p>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] text-[#2d211c] sm:text-6xl lg:text-7xl">
              {t('home.title')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#5f554d]">{t('home.body')}</p>

            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2">
              {heroChips.map((item, index) => (
                <div
                  key={item}
                  className={`shelby-cut-sm border border-[#2d211c]/10 bg-[#fff8ea]/70 px-3 py-2 text-xs font-semibold text-[#5f554d] shadow-sm ${
                    index === 1 ? 'translate-y-3' : index === 2 ? '-translate-y-1' : ''
                  }`}
                >
                  {t(item)}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="ui-button shelby-cut-sm">
                {t('home.cta.index')}
                <ArrowRight size={16} />
              </Link>
              <Link href="/upload" className="ui-button ui-button-secondary shelby-cut-sm">
                {t('home.cta.upload')}
                <UploadCloud size={16} />
              </Link>
              <Link
                href="/read-receipt/rr-001"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-[#157a4c] transition hover:text-[#6a3ea1]"
              >
                {t('home.cta.receipt')}
                <ReceiptText size={16} />
              </Link>
            </div>
          </div>

          <div className="relative z-10 lg:translate-y-8">
            <ProductPanel />
          </div>
        </div>
      </section>

      <section className="border-y border-[#2d211c]/10 bg-[#fff8ea]/55 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-12 lg:items-stretch">
          <div className="shelby-cut relative overflow-hidden border border-[#2d211c]/12 bg-[#2d211c] p-6 text-[#fff8ea] lg:col-span-7">
            <div className="hex-field absolute inset-0 opacity-10" />
            <div className="relative">
              <div className="ui-chip border-white/15 bg-white/10 text-[#fff8ea]">
                <Database size={13} />
                {t('home.graph.eyebrow')}
              </div>
              <h2 className="mt-8 max-w-xl text-4xl font-semibold leading-[1.02]">
                {t('home.graph.title')}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#d8cdbd]">{t('home.graph.body')}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {graphItems.map(([label, value, tone]) => (
                  <div key={label} className={`shelby-cut-sm p-4 ${tone}`}>
                    <p className="font-mono text-xs font-semibold uppercase">{t(label)}</p>
                    <p className="mt-4 text-sm font-semibold">{t(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:col-span-5 lg:grid-rows-[1fr_1fr]">
            <FeatureTile
              icon={Fingerprint}
              title={t('home.feature.blob.title')}
              body={t('home.feature.blob.body')}
              className="duotone-lilac lg:translate-y-6"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FeatureTile
                icon={Database}
                title={t('home.feature.packs.title')}
                body={t('home.feature.packs.body')}
                className="duotone-green"
              />
              <FeatureTile
                icon={CheckCircle2}
                title={t('home.feature.receipt.title')}
                body={t('home.feature.receipt.body')}
                className="duotone-coral sm:-translate-y-6"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="ui-chip">
                <Braces size={13} />
                {t('home.corpus.eyebrow')}
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-[#2d211c]">
                {t('home.corpus.title')}
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#157a4c] transition hover:text-[#6a3ea1]"
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

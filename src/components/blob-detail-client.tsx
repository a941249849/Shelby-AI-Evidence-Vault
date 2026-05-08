'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarClock,
  Database,
  FileText,
  Fingerprint,
  HardDrive,
  Hash,
  Link2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { getLocalBlobById, getLocalPackById } from '@/lib/store/local-store';
import { getBlobById, getEvidencePackById } from '@/lib/evidence/service';
import { getPersistedBlobAction, getPersistedPackAction } from '@/app/actions/persist';
import { useI18n } from '@/components/language-provider';

interface BlobDetailClientProps {
  id: string;
}

function DataSourceBadge({
  blob,
  t,
}: {
  blob: BlobRecord;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const isTestnet = blob.dataSource === 'shelby-testnet' || blob.uploadMode === 'testnet';

  if (isTestnet) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#157a4c]/40 bg-[#dff2c8] px-3 py-1 text-xs font-semibold text-[#157a4c]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t('blob.testnet')}
      </span>
    );
  }

  if (blob.dataSource === 'local') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6a3ea1]/30 bg-[#efe2ff] px-3 py-1 text-xs font-semibold text-[#6a3ea1]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t('blob.local')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#6f6258]">
      <Database className="h-3.5 w-3.5" />
      {t('blob.demo')}
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shelby-cut shelby-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase  text-[#6f6258]">
        <Icon className="h-3.5 w-3.5 text-[#6a3ea1]" />
        {label}
      </div>
      <div className="text-sm leading-6 text-[#2d211c]">{children}</div>
    </div>
  );
}

function MonoBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="block break-all rounded-md border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-2 font-mono text-xs text-[#2d211c]">
      {children}
    </code>
  );
}

export default function BlobDetailClient({ id }: BlobDetailClientProps) {
  const { t } = useI18n();
  const [blob, setBlob] = useState<BlobRecord | null | undefined>(undefined);
  const [pack, setPack] = useState<EvidencePack | undefined>(undefined);

  useEffect(() => {
    const demoBlob = getBlobById(id);
    if (demoBlob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlob(demoBlob);
      setPack(getEvidencePackById(demoBlob.evidencePackId));
      return;
    }

    const localBlob = getLocalBlobById(id);
    if (localBlob) {
      setBlob(localBlob);
      const localPack = getLocalPackById(localBlob.evidencePackId);
      setPack(localPack ?? getEvidencePackById(localBlob.evidencePackId));
      return;
    }

    // Fall through to SQLite-persisted records (survive localStorage resets)
    getPersistedBlobAction(id)
      .then(async (persistedBlob) => {
        if (persistedBlob) {
          setBlob(persistedBlob);
          // Resolve pack: localStorage → demo data → SQLite
          const resolvedPack =
            getLocalPackById(persistedBlob.evidencePackId) ??
            getEvidencePackById(persistedBlob.evidencePackId) ??
            (await getPersistedPackAction(persistedBlob.evidencePackId).catch(() => null)) ??
            undefined;
          setPack(resolvedPack);
        } else {
          setBlob(null);
        }
      })
      .catch((err) => {
        console.error('[BlobDetailClient] getPersistedBlobAction failed', err);
        setBlob(null);
      });
  }, [id]);

  if (blob === undefined) {
    return null;
  }

  if (blob === null) {
    return (
      <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl shelby-cut shelby-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center shelby-cut bg-[#2d211c] text-[#157a4c]">
            <Fingerprint className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold  text-[#2d211c]">{t('blob.notFound')}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f6258]">
            {t('blob.notFoundBody', { id })}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 shelby-cut bg-[#2d211c] px-4 py-2.5 text-sm font-semibold text-[#fff8ea] transition hover:bg-[#157a4c]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('blob.back')}
          </Link>
        </div>
      </div>
    );
  }

  const isTestnetBlob = blob.dataSource === 'shelby-testnet' || blob.uploadMode === 'testnet';
  const referenceLabel = isTestnetBlob
    ? t('blob.testnetReference')
    : blob.dataSource === 'local'
      ? t('blob.mockReference')
      : t('blob.demoReference');

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6f6258]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-1 transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('blob.dashboard')}
            </Link>
            {pack && (
              <Link
                href={`/dashboard?pack=${pack.id}`}
                className="rounded-full border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-1 transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
              >
                {pack.title}
              </Link>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <DataSourceBadge blob={blob} t={t} />
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold  text-[#2d211c]">
                {t('blob.title')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
                {t('blob.body')}
              </p>
            </div>
            <div className="shelby-cut shelby-surface p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                {t('blob.id')}
              </p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-[#2d211c]">
                {blob.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="shelby-cut shelby-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#2d211c] text-[#dff2c8]">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                  {t('blob.referenceBoundary')}
                </p>
                <h2 className="text-lg font-semibold text-[#2d211c]">{referenceLabel}</h2>
              </div>
            </div>

            <MonoBlock>{blob.shelbyRef}</MonoBlock>
            <p className="mt-3 text-xs leading-5 text-[#6f6258]">
              {blob.dataSource === 'local'
                ? t('blob.localReferenceBody')
                : isTestnetBlob
                  ? t('blob.testnetReferenceBody')
                  : t('blob.demoReferenceBody')}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Fact icon={Hash} label={t('blob.sha')}>
                <MonoBlock>{blob.hash}</MonoBlock>
              </Fact>
              <Fact icon={FileText} label={t('blob.source')}>
                <span className="break-all">{blob.source}</span>
              </Fact>
            </div>
          </section>

          <aside className="space-y-4">
            <Fact icon={HardDrive} label={t('blob.size')}>
              {formatBytes(blob.size)}
            </Fact>
            <Fact icon={FileText} label={t('blob.mime')}>
              <code className="font-mono text-sm">{blob.mimeType}</code>
            </Fact>
            <Fact icon={CalendarClock} label={t('blob.created')}>
              {formatDateTime(blob.createdAt)}
            </Fact>
            <Fact icon={Link2} label={t('blob.pack')}>
              {pack ? (
                <Link
                  href={`/dashboard?pack=${pack.id}`}
                  className="font-semibold text-[#6a3ea1] transition hover:text-[#157a4c]"
                >
                  {pack.title}
                </Link>
              ) : (
                <span className="text-[#6f6258]">{t('blob.unknownPack')}</span>
              )}
            </Fact>
          </aside>
        </div>

        <section className="mt-6 shelby-cut shelby-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase  text-[#6f6258]">
            <Tag className="h-4 w-4 text-[#6a3ea1]" />
            {t('blob.tags')}
          </div>
          <div className="flex flex-wrap gap-2">
            {blob.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[#2d211c]/10 bg-[#fff8ea] px-2.5 py-1 font-mono text-xs text-[#2d211c]"
              >
                {tag}
              </span>
            ))}
            {blob.uploadMode && (
              <span className="rounded-md border border-[#6a3ea1]/30 bg-[#efe2ff] px-2.5 py-1 text-xs font-semibold text-[#6a3ea1]">
                {t('blob.mode')}: {blob.uploadMode}
              </span>
            )}
            {blob.network && (
              <span className="rounded-md border border-[#157a4c]/35 bg-[#dff2c8] px-2.5 py-1 text-xs font-semibold text-[#157a4c]">
                {t('blob.network')}: {blob.network}
              </span>
            )}
            {blob.blobName && (
              <span className="rounded-md border border-[#2d211c]/10 bg-[#fff8ea] px-2.5 py-1 font-mono text-xs text-[#2d211c]">
                {t('blob.blobName')}: {blob.blobName}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

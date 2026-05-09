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
import { useLanguage } from '@/components/language-state';

interface BlobDetailClientProps {
  id: string;
}

const blobCopy = {
  zh: {
    notFound: 'Blob 未找到',
    notFoundBody: 'Demo 数据或本地上传中不存在这个 Blob ID。',
    back: '返回索引',
    dashboard: '索引',
    title: 'Blob 来源证明检查器',
    subtitle: '检查一个已存储证据对象的身份证明、引用、哈希、文件元数据与证据包归属。',
    blobId: 'Blob ID',
    refBoundary: '引用边界',
    mockRef: 'Mock 引用',
    demoRef: 'Demo 引用',
    localHint: '本地 Demo 引用。测试网记录还会包含账号命名空间、blobName、网络与 explorer 元数据。',
    demoHint: '示例 Demo 引用。使用测试网模式时，真实 Shelby Blob 身份由账号命名空间与 blobName 表示。',
    hash: 'SHA-256 哈希',
    source: '来源',
    size: '大小',
    mime: 'MIME 类型',
    created: '创建时间',
    pack: '证据包',
    tags: '标签与适配器元数据',
    unknown: '未知证据包',
  },
  en: {
    notFound: 'Blob not found',
    notFoundBody: 'No blob with this ID exists in demo data or local uploads.',
    back: 'Back to index',
    dashboard: 'Dashboard',
    title: 'Blob provenance inspector',
    subtitle:
      'Inspect the local proof surface for one stored evidence object: identity, reference, hash, file metadata, and pack membership.',
    blobId: 'Blob ID',
    refBoundary: 'Reference boundary',
    mockRef: 'Mock Reference',
    demoRef: 'Demo Reference',
    localHint:
      'Local demo reference. Testnet records additionally carry account namespace, blob name, network, and explorer metadata.',
    demoHint:
      'Illustrative demo reference. Real Shelby blob identity is represented by account namespace plus blob name when using testnet mode.',
    hash: 'SHA-256 hash',
    source: 'Source',
    size: 'Size',
    mime: 'MIME type',
    created: 'Created',
    pack: 'Evidence pack',
    tags: 'Tags and adapter metadata',
    unknown: 'Unknown pack',
  },
};

function DataSourceBadge({ blob }: { blob: BlobRecord }) {
  const { language } = useLanguage();
  if (blob.dataSource === 'local') {
    const isTestnet = blob.uploadMode === 'testnet';
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
          isTestnet
            ? 'border-[#9fe878]/40 bg-[#9fe878]/10 text-[#9fe878]'
            : 'border-[#de8aff]/30 bg-[#de8aff]/10 text-[#e7b6ff]'
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {isTestnet
          ? 'Shelby testnet upload'
          : language === 'zh'
            ? '本地 Demo 上传'
            : 'Local demo upload'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#9d9a92]">
      <Database className="h-3.5 w-3.5" />
      {language === 'zh' ? 'Demo 数据' : 'Demo data'}
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
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase  text-[#9d9a92]">
        <Icon className="h-3.5 w-3.5 text-[#de8aff]" />
        {label}
      </div>
      <div className="text-sm leading-6 text-[#f4f0e8]">{children}</div>
    </div>
  );
}

function MonoBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="block break-all rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-[#f4f0e8]">
      {children}
    </code>
  );
}

export default function BlobDetailClient({ id }: BlobDetailClientProps) {
  const { language } = useLanguage();
  const t = blobCopy[language];
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
      const staticPack = getEvidencePackById(localBlob.evidencePackId);
      if (localPack ?? staticPack) {
        setPack(localPack ?? staticPack);
      } else {
        getPersistedPackAction(localBlob.evidencePackId)
          .then((persistedPack) => {
            setPack(persistedPack ?? undefined);
          })
          .catch((err) => {
            console.error('[BlobDetailClient] getPersistedPackAction failed', err);
          });
      }
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
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center shelby-cut bg-[#111217] text-[#9fe878]">
            <Fingerprint className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold  text-[#f4f0e8]">{t.notFound}</h1>
          <p className="mt-3 text-sm leading-6 text-[#9d9a92]">
            {t.notFoundBody}{' '}
            <code className="rounded bg-white/[0.04] px-1 font-mono">{id}</code>
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 shelby-cut bg-[#111217] px-4 py-2.5 text-sm font-semibold text-[#f4f0e8] transition hover:bg-[#1c1d25]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  const referenceLabel = blob.dataSource === 'local' ? t.mockRef : t.demoRef;

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#9d9a92]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.dashboard}
            </Link>
            {pack && (
              <Link
                href={`/dashboard?pack=${pack.id}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
              >
                {pack.title}
              </Link>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <DataSourceBadge blob={blob} />
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold  text-[#f4f0e8]">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9d9a92]">
                {t.subtitle}
              </p>
            </div>
            <div className="shelby-cut shelby-surface p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                {t.blobId}
              </p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-[#f4f0e8]">
                {blob.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="shelby-cut shelby-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#111217] text-[#9fe878]">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                  {t.refBoundary}
                </p>
                <h2 className="text-lg font-semibold text-[#f4f0e8]">{referenceLabel}</h2>
              </div>
            </div>

            <MonoBlock>{blob.shelbyRef}</MonoBlock>
            <p className="mt-3 text-xs leading-5 text-[#9d9a92]">
              {blob.dataSource === 'local' ? t.localHint : t.demoHint}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Fact icon={Hash} label={t.hash}>
                <MonoBlock>{blob.hash}</MonoBlock>
              </Fact>
              <Fact icon={FileText} label={t.source}>
                <span className="break-all">{blob.source}</span>
              </Fact>
            </div>
          </section>

          <aside className="space-y-4">
            <Fact icon={HardDrive} label={t.size}>
              {formatBytes(blob.size)}
            </Fact>
            <Fact icon={FileText} label={t.mime}>
              <code className="font-mono text-sm">{blob.mimeType}</code>
            </Fact>
            <Fact icon={CalendarClock} label={t.created}>
              {formatDateTime(blob.createdAt)}
            </Fact>
            <Fact icon={Link2} label={t.pack}>
              {pack ? (
                <Link
                  href={`/dashboard?pack=${pack.id}`}
                  className="font-semibold text-[#de8aff] transition hover:text-[#470b64]"
                >
                  {pack.title}
                </Link>
              ) : (
                <span className="text-[#9d9a92]">{t.unknown}</span>
              )}
            </Fact>
          </aside>
        </div>

        <section className="mt-6 shelby-cut shelby-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase  text-[#9d9a92]">
            <Tag className="h-4 w-4 text-[#de8aff]" />
            {t.tags}
          </div>
          <div className="flex flex-wrap gap-2">
            {blob.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-[#f4f0e8]"
              >
                {tag}
              </span>
            ))}
            {blob.uploadMode && (
              <span className="rounded-md border border-[#de8aff]/25 bg-[#eee2ff] px-2.5 py-1 text-xs font-semibold text-[#470b64]">
                mode: {blob.uploadMode}
              </span>
            )}
            {blob.network && (
              <span className="rounded-md border border-[#9fe878]/25 bg-[#dfffcc] px-2.5 py-1 text-xs font-semibold text-[#21351a]">
                network: {blob.network}
              </span>
            )}
            {blob.blobName && (
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-[#f4f0e8]">
                blobName: {blob.blobName}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

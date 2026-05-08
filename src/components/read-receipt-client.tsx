'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Braces,
  CalendarClock,
  Cpu,
  Database,
  ExternalLink,
  Fingerprint,
  Hash,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import type { ReadReceipt } from '@/lib/demo-data/read-receipts';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import { formatDateTime } from '@/lib/utils';
import { getLocalReadReceiptById, getLocalBlobById, getLocalPackById } from '@/lib/store/local-store';
import { getReadReceiptById, getBlobById, getEvidencePackById } from '@/lib/evidence/service';
import { getPersistedReceiptAction, getPersistedBlobAction, getPersistedPackAction } from '@/app/actions/persist';
import { useLanguage } from '@/components/language-state';

interface ReadReceiptClientProps {
  id: string;
}

const receiptCopy = {
  zh: {
    notFound: '读取回执未找到',
    notFoundBody: 'Demo 数据或本地存储中不存在这个回执 ID。',
    back: '返回索引',
    dashboard: '索引',
    badge: 'AI 读取回执',
    title: '回答来源与证据使用情况。',
    subtitle: '一个 Agent 回答的紧凑回执：问题、回答摘要、运行元数据、引用 Blob 与证据包。',
    receiptId: '回执 ID',
    query: '问题',
    userQuestion: '用户问题',
    answerSummary: '回答摘要',
    generated: '生成结果',
    referenced: '引用 Blob',
    blob: 'Blob',
    missingBlob: '本地存储中未找到。',
    runId: '运行 ID',
    timestamp: '时间戳',
    agentVersion: 'Agent 版本',
    mode: '回执模式',
    packs: '证据包',
  },
  en: {
    notFound: 'Read receipt not found',
    notFoundBody: 'No read receipt with this ID exists in demo data or local storage.',
    back: 'Back to index',
    dashboard: 'Dashboard',
    badge: 'AI read receipt',
    title: 'Answer provenance and evidence usage.',
    subtitle:
      'A compact receipt for one agent response: prompt, answer summary, run metadata, referenced blobs, and evidence packs.',
    receiptId: 'Receipt ID',
    query: 'Query',
    userQuestion: 'User question',
    answerSummary: 'Answer summary',
    generated: 'Generated response',
    referenced: 'Referenced blobs',
    blob: 'Blob',
    missingBlob: 'Not found in local storage.',
    runId: 'Run ID',
    timestamp: 'Timestamp',
    agentVersion: 'Agent version',
    mode: 'Receipt mode',
    packs: 'Evidence packs',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReceiptModeBadge({ mode }: { mode: ReadReceipt['receiptMode'] }) {
  const { language } = useLanguage();
  if (mode === 'shelby-testnet') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fd8565]/50 bg-[#ffdcd9] px-3 py-1 text-xs font-semibold text-[#f4f0e8]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Shelby testnet
      </span>
    );
  }
  if (mode === 'local') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#de8aff]/25 bg-[#eee2ff] px-3 py-1 text-xs font-semibold text-[#470b64]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {language === 'zh' ? '本地 Demo 上传' : 'Local demo upload'}
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

function BlobDataSourceBadge({ blob }: { blob: BlobRecord }) {
  const { language } = useLanguage();
  if (blob.dataSource === 'shelby-testnet') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#fd8565]/50 bg-[#ffdcd9] px-2 py-0.5 text-xs font-semibold text-[#f4f0e8]">
        Shelby testnet
      </span>
    );
  }
  if (blob.dataSource === 'local') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#de8aff]/25 bg-[#eee2ff] px-2 py-0.5 text-xs font-semibold text-[#470b64]">
        {language === 'zh' ? '本地 Mock' : 'Local mock'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-[#9d9a92]">
      {language === 'zh' ? 'Demo' : 'Demo'}
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
      <div className="break-all text-sm leading-6 text-[#f4f0e8]">{children}</div>
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

function ResolvedBlobCard({ blob }: { blob: BlobRecord }) {
  const { language } = useLanguage();
  return (
    <div className="shelby-cut shelby-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-[#de8aff]" />
          <Link
            href={`/blob/${blob.id}`}
            className="font-mono text-xs font-semibold text-[#f4f0e8] transition hover:text-[#de8aff]"
          >
            {blob.id}
          </Link>
        </div>
        <BlobDataSourceBadge blob={blob} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase  text-[#9d9a92]">
            {language === 'zh' ? 'Shelby 引用' : 'Shelby ref'}
          </p>
          <MonoBlock>{blob.shelbyRef}</MonoBlock>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase  text-[#9d9a92]">
            {language === 'zh' ? 'SHA-256 哈希' : 'SHA-256 hash'}
          </p>
          <MonoBlock>{blob.hash}</MonoBlock>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase  text-[#9d9a92]">
            {language === 'zh' ? '来源' : 'Source'}
          </p>
          <p className="break-all text-xs text-[#f4f0e8]">{blob.source}</p>
        </div>

        {/* Real Shelby identity fields — only shown when present */}
        {(blob.accountAddress || blob.blobName || blob.network || blob.storageStatus) && (
          <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-white/[0.04] p-3 sm:grid-cols-2">
            {blob.accountAddress && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                  {language === 'zh' ? '账户地址' : 'Account address'}
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-[#f4f0e8]">
                  {blob.accountAddress}
                </p>
              </div>
            )}
            {blob.blobName && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                  {language === 'zh' ? 'Blob 名称' : 'Blob name'}
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-[#f4f0e8]">{blob.blobName}</p>
              </div>
            )}
            {blob.network && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                  {language === 'zh' ? '网络' : 'Network'}
                </p>
                <span className="mt-0.5 inline-block rounded border border-[#9fe878]/25 bg-[#dfffcc] px-2 py-0.5 text-xs font-semibold text-[#21351a]">
                  {blob.network}
                </span>
              </div>
            )}
            {blob.storageStatus && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                  {language === 'zh' ? '存储状态' : 'Storage status'}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#f4f0e8]">{blob.storageStatus}</p>
              </div>
            )}
          </div>
        )}

        {(blob.explorerUrl || blob.retrievalUrl) && (
          <div className="flex flex-wrap gap-2">
            {blob.explorerUrl && (
              <a
                href={blob.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#9fe878]/40 bg-[#dfffcc] px-3 py-1 text-xs font-semibold text-[#21351a] transition hover:bg-[#c9f5aa]"
              >
                <ExternalLink className="h-3 w-3" />
                Explorer
              </a>
            )}
            {blob.retrievalUrl && (
              <a
                href={blob.retrievalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#9d9a92] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
              >
                <ExternalLink className="h-3 w-3" />
                Retrieval URL
              </a>
            )}
          </div>
        )}

        {blob.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag className="h-3.5 w-3.5 flex-none self-center text-[#de8aff]" />
            {blob.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-[#f4f0e8]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ResolvedReceiptData {
  receipt: ReadReceipt;
  blobs: BlobRecord[];
  packs: EvidencePack[];
}

export default function ReadReceiptClient({ id }: ReadReceiptClientProps) {
  const { language } = useLanguage();
  const t = receiptCopy[language];
  const [resolved, setResolved] = useState<ResolvedReceiptData | null | undefined>(undefined);

  useEffect(() => {
    // Try demo data first (handles rr-001 through rr-004)
    const demoReceipt = getReadReceiptById(id);
    if (demoReceipt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResolved({
        receipt: demoReceipt,
        blobs: demoReceipt.referencedBlobIds
          .map((bid) => getBlobById(bid))
          .filter(Boolean) as BlobRecord[],
        packs: demoReceipt.evidencePackIds
          .map((pid) => getEvidencePackById(pid))
          .filter(Boolean) as EvidencePack[],
      });
      return;
    }

    // Try localStorage (handles receipts created by the upload page)
    const localReceipt = getLocalReadReceiptById(id);
    if (localReceipt) {
      setResolved({
        receipt: localReceipt,
        blobs: localReceipt.referencedBlobIds
          .map((bid) => getLocalBlobById(bid) ?? getBlobById(bid))
          .filter(Boolean) as BlobRecord[],
        packs: localReceipt.evidencePackIds
          .map((pid) => getLocalPackById(pid) ?? getEvidencePackById(pid))
          .filter(Boolean) as EvidencePack[],
      });
      return;
    }

    // Fall through to SQLite-persisted records (survive localStorage resets)
    getPersistedReceiptAction(id)
      .then(async (persistedReceipt) => {
        if (!persistedReceipt) {
          setResolved(null);
          return;
        }

        // Resolve each referenced blob — check localStorage first, then SQLite.
        const resolvedBlobs: BlobRecord[] = [];
        for (const bid of persistedReceipt.referencedBlobIds) {
          const b =
            getLocalBlobById(bid) ??
            getBlobById(bid) ??
            (await getPersistedBlobAction(bid).catch((err) => {
              console.error('[ReadReceiptClient] getPersistedBlobAction failed for', bid, err);
              return null;
            }));
          if (b) resolvedBlobs.push(b);
        }

        const resolvedPacks: EvidencePack[] = [];
        for (const pid of persistedReceipt.evidencePackIds) {
          const p =
            getLocalPackById(pid) ??
            getEvidencePackById(pid) ??
            (await getPersistedPackAction(pid).catch(() => null));
          if (p) resolvedPacks.push(p);
        }

        setResolved({
          receipt: persistedReceipt,
          blobs: resolvedBlobs,
          packs: resolvedPacks,
        });
      })
      .catch((err) => {
        console.error('[ReadReceiptClient] getPersistedReceiptAction failed', err);
        setResolved(null);
      });
  }, [id]);

  // Loading state — renders nothing until localStorage is checked
  if (resolved === undefined) {
    return null;
  }

  if (resolved === null) {
    return (
      <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl shelby-cut shelby-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center shelby-cut bg-[#111217] text-[#9fe878]">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold  text-[#f4f0e8]">
            {t.notFound}
          </h1>
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

  const { receipt, blobs: resolvedBlobs, packs: resolvedPacks } = resolved;

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[#9d9a92] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.dashboard}
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#de8aff]/25 bg-[#eee2ff] px-3 py-1 text-xs font-semibold text-[#470b64]">
                  <ReceiptText className="h-3.5 w-3.5" />
                  {t.badge}
                </span>
                <ReceiptModeBadge mode={receipt.receiptMode} />
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold  text-[#f4f0e8]">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9d9a92]">
                {t.subtitle}
              </p>
            </div>
            <div className="shelby-cut shelby-surface p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                {t.receiptId}
              </p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-[#f4f0e8]">
                {receipt.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="shelby-cut shelby-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#111217] text-[#9fe878]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                    {t.query}
                  </p>
                  <h2 className="text-lg font-semibold text-[#f4f0e8]">{t.userQuestion}</h2>
                </div>
              </div>
              <p className="text-base leading-7 text-[#f4f0e8]">{receipt.query}</p>
            </div>

            <div className="shelby-cut shelby-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#111217] text-[#ff77c9]">
                  <Braces className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                    {t.answerSummary}
                  </p>
                  <h2 className="text-lg font-semibold text-[#f4f0e8]">{t.generated}</h2>
                </div>
              </div>
              <p className="text-sm leading-7 text-[#f4f0e8]">{receipt.answerSummary}</p>
            </div>

            <div className="shelby-cut shelby-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase  text-[#9d9a92]">
                <Fingerprint className="h-4 w-4 text-[#de8aff]" />
                {t.referenced}
                <span className="ml-auto rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-[#9d9a92]">
                  {receipt.referencedBlobIds.length}
                </span>
              </div>

              {resolvedBlobs.length > 0 ? (
                <div className="space-y-4">
                  {resolvedBlobs.map((blob) => (
                    <ResolvedBlobCard key={blob.id} blob={blob} />
                  ))}
                  {/* Show any IDs that couldn't be resolved */}
                  {receipt.referencedBlobIds
                    .filter((bid) => !resolvedBlobs.find((b) => b.id === bid))
                    .map((bid) => (
                      <div
                        key={bid}
                        className="shelby-cut shelby-surface px-3 py-3"
                      >
                        <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                          {t.blob}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#9d9a92]">{bid}</p>
                        <p className="mt-1 text-xs text-[#9d9a92]">{t.missingBlob}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {receipt.referencedBlobIds.map((blobId) => (
                    <Link
                      key={blobId}
                      href={`/blob/${blobId}`}
                      className="group shelby-cut shelby-surface px-3 py-3 transition hover:border-[#de8aff]/40 hover:bg-white/[0.04]"
                    >
                      <p className="text-xs font-semibold uppercase  text-[#9d9a92]">
                        Blob
                      </p>
                      <p className="mt-1 truncate font-mono text-xs font-semibold text-[#f4f0e8] group-hover:text-[#de8aff]">
                        {blobId}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <Fact icon={Cpu} label={t.runId}>
              <code className="font-mono text-xs">{receipt.runId}</code>
            </Fact>
            <Fact icon={CalendarClock} label={t.timestamp}>
              {formatDateTime(receipt.timestamp)}
            </Fact>
            <Fact icon={Braces} label={t.agentVersion}>
              <code className="font-mono text-xs">{receipt.agentVersion}</code>
            </Fact>
            <Fact icon={Hash} label={t.mode}>
              <ReceiptModeBadge mode={receipt.receiptMode} />
            </Fact>
            <div className="shelby-cut shelby-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase  text-[#9d9a92]">
                <Database className="h-3.5 w-3.5 text-[#de8aff]" />
                {t.packs}
              </div>
              <div className="space-y-2">
                {resolvedPacks.length > 0 ? (
                  resolvedPacks.map((pack) => (
                    <Link
                      key={pack.id}
                      href={`/dashboard?pack=${pack.id}`}
                      className="block rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[#f4f0e8] transition hover:border-[#de8aff]/40 hover:bg-white/[0.04] hover:text-[#de8aff]"
                    >
                      {pack.title}
                    </Link>
                  ))
                ) : (
                  receipt.evidencePackIds.map((pid) => (
                    <p key={pid} className="font-mono text-xs text-[#9d9a92]">
                      {pid}
                    </p>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

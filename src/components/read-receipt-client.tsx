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
import { useI18n } from '@/components/language-provider';

interface ReadReceiptClientProps {
  id: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReceiptModeBadge({
  mode,
  t,
}: {
  mode: ReadReceipt['receiptMode'];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (mode === 'shelby-testnet') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ef6f4d]/45 bg-[#ffe0cf] px-3 py-1 text-xs font-semibold text-[#a33f2d]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t('receipt.mode.testnet')}
      </span>
    );
  }
  if (mode === 'local') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6a3ea1]/30 bg-[#efe2ff] px-3 py-1 text-xs font-semibold text-[#6a3ea1]">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t('receipt.mode.local')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#6f6258]">
      <Database className="h-3.5 w-3.5" />
      {t('receipt.mode.demo')}
    </span>
  );
}

function BlobDataSourceBadge({
  blob,
  t,
}: {
  blob: BlobRecord;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  if (blob.dataSource === 'shelby-testnet') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#ef6f4d]/45 bg-[#ffe0cf] px-2 py-0.5 text-xs font-semibold text-[#a33f2d]">
        {t('receipt.blobData.testnet')}
      </span>
    );
  }
  if (blob.dataSource === 'local') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#6a3ea1]/30 bg-[#efe2ff] px-2 py-0.5 text-xs font-semibold text-[#6a3ea1]">
        {t('receipt.blobData.local')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-[#2d211c]/10 bg-[#fff8ea] px-2 py-0.5 text-xs font-semibold text-[#6f6258]">
      {t('receipt.blobData.demo')}
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
      <div className="break-all text-sm leading-6 text-[#2d211c]">{children}</div>
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

function ResolvedBlobCard({
  blob,
  t,
}: {
  blob: BlobRecord;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="shelby-cut shelby-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-[#6a3ea1]" />
          <Link
            href={`/blob/${blob.id}`}
            className="font-mono text-xs font-semibold text-[#2d211c] transition hover:text-[#6a3ea1]"
          >
            {blob.id}
          </Link>
        </div>
        <BlobDataSourceBadge blob={blob} t={t} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase  text-[#6f6258]">
            {t('receipt.shelbyRef')}
          </p>
          <MonoBlock>{blob.shelbyRef}</MonoBlock>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase  text-[#6f6258]">
            {t('blob.sha')}
          </p>
          <MonoBlock>{blob.hash}</MonoBlock>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase  text-[#6f6258]">
            {t('blob.source')}
          </p>
          <p className="break-all text-xs text-[#2d211c]">{blob.source}</p>
        </div>

        {/* Real Shelby identity fields — only shown when present */}
        {(blob.accountAddress || blob.blobName || blob.network || blob.storageStatus) && (
          <div className="mt-3 grid gap-2 rounded-md border border-[#2d211c]/10 bg-[#fff8ea] p-3 sm:grid-cols-2">
            {blob.accountAddress && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                  {t('receipt.account')}
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-[#2d211c]">
                  {blob.accountAddress}
                </p>
              </div>
            )}
            {blob.blobName && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                  {t('receipt.blobName')}
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-[#2d211c]">{blob.blobName}</p>
              </div>
            )}
            {blob.network && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                  {t('receipt.network')}
                </p>
                <span className="mt-0.5 inline-block rounded border border-[#157a4c]/35 bg-[#dff2c8] px-2 py-0.5 text-xs font-semibold text-[#157a4c]">
                  {blob.network}
                </span>
              </div>
            )}
            {blob.storageStatus && (
              <div>
                <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                  {t('receipt.storageStatus')}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#2d211c]">{blob.storageStatus}</p>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[#157a4c]/40 bg-[#dff2c8] px-3 py-1 text-xs font-semibold text-[#157a4c] transition hover:bg-[#9fe878]/15"
              >
                <ExternalLink className="h-3 w-3" />
                {t('receipt.explorer')}
              </a>
            )}
            {blob.retrievalUrl && (
              <a
                href={blob.retrievalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#6f6258] transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
              >
                <ExternalLink className="h-3 w-3" />
                {t('receipt.retrieval')}
              </a>
            )}
          </div>
        )}

        {blob.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag className="h-3.5 w-3.5 flex-none self-center text-[#6a3ea1]" />
            {blob.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-[#2d211c]/10 bg-[#fff8ea] px-2 py-0.5 font-mono text-xs text-[#2d211c]"
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
  const { t } = useI18n();
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
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center shelby-cut bg-[#2d211c] text-[#157a4c]">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold  text-[#2d211c]">
            {t('receipt.notFound')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6f6258]">
            {t('receipt.notFoundBody', { id })}
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

  const { receipt, blobs: resolvedBlobs, packs: resolvedPacks } = resolved;

  return (
    <div className="kinetic-grid min-h-[calc(100vh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-1 rounded-full border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-1 text-xs font-semibold text-[#6f6258] transition hover:border-[#6a3ea1]/35 hover:text-[#6a3ea1]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('receipt.dashboard')}
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6a3ea1]/30 bg-[#efe2ff] px-3 py-1 text-xs font-semibold text-[#6a3ea1]">
                  <ReceiptText className="h-3.5 w-3.5" />
                  {t('receipt.badge')}
                </span>
                <ReceiptModeBadge mode={receipt.receiptMode} t={t} />
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold  text-[#2d211c]">
                {t('receipt.title')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
                {t('receipt.body')}
              </p>
            </div>
            <div className="shelby-cut shelby-surface p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                {t('receipt.id')}
              </p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-[#2d211c]">
                {receipt.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="shelby-cut shelby-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#2d211c] text-[#dff2c8]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                    {t('receipt.query')}
                  </p>
                  <h2 className="text-lg font-semibold text-[#2d211c]">{t('receipt.userQuestion')}</h2>
                </div>
              </div>
              <p className="text-base leading-7 text-[#2d211c]">{receipt.query}</p>
            </div>

            <div className="shelby-cut shelby-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#2d211c] text-[#ff77c9]">
                  <Braces className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                    {t('receipt.answerSummary')}
                  </p>
                  <h2 className="text-lg font-semibold text-[#2d211c]">{t('receipt.generatedResponse')}</h2>
                </div>
              </div>
              <p className="text-sm leading-7 text-[#2d211c]">{receipt.answerSummary}</p>
            </div>

            <div className="shelby-cut shelby-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase  text-[#6f6258]">
                <Fingerprint className="h-4 w-4 text-[#6a3ea1]" />
                {t('receipt.referencedBlobs')}
                <span className="ml-auto rounded border border-[#2d211c]/10 bg-[#fff8ea] px-2 py-0.5 text-xs font-semibold text-[#6f6258]">
                  {receipt.referencedBlobIds.length}
                </span>
              </div>

              {resolvedBlobs.length > 0 ? (
                <div className="space-y-4">
                  {resolvedBlobs.map((blob) => (
                    <ResolvedBlobCard key={blob.id} blob={blob} t={t} />
                  ))}
                  {/* Show any IDs that couldn't be resolved */}
                  {receipt.referencedBlobIds
                    .filter((bid) => !resolvedBlobs.find((b) => b.id === bid))
                    .map((bid) => (
                      <div
                        key={bid}
                        className="shelby-cut shelby-surface px-3 py-3"
                      >
                        <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                          {t('receipt.blob')}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#6f6258]">{bid}</p>
                        <p className="mt-1 text-xs text-[#6f6258]">{t('receipt.notFoundInStorage')}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {receipt.referencedBlobIds.map((blobId) => (
                    <Link
                      key={blobId}
                      href={`/blob/${blobId}`}
                      className="group shelby-cut shelby-surface px-3 py-3 transition hover:border-[#6a3ea1]/35 hover:bg-[#fff8ea]"
                    >
                      <p className="text-xs font-semibold uppercase  text-[#6f6258]">
                        {t('receipt.blob')}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs font-semibold text-[#2d211c] group-hover:text-[#6a3ea1]">
                        {blobId}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <Fact icon={Cpu} label={t('receipt.runId')}>
              <code className="font-mono text-xs">{receipt.runId}</code>
            </Fact>
            <Fact icon={CalendarClock} label={t('receipt.timestamp')}>
              {formatDateTime(receipt.timestamp)}
            </Fact>
            <Fact icon={Braces} label={t('receipt.agentVersion')}>
              <code className="font-mono text-xs">{receipt.agentVersion}</code>
            </Fact>
            <Fact icon={Hash} label={t('receipt.mode')}>
              <ReceiptModeBadge mode={receipt.receiptMode} t={t} />
            </Fact>
            <div className="shelby-cut shelby-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase  text-[#6f6258]">
                <Database className="h-3.5 w-3.5 text-[#6a3ea1]" />
                {t('receipt.evidencePacks')}
              </div>
              <div className="space-y-2">
                {resolvedPacks.length > 0 ? (
                  resolvedPacks.map((pack) => (
                    <Link
                      key={pack.id}
                      href={`/dashboard?pack=${pack.id}`}
                      className="block rounded-md border border-[#2d211c]/10 bg-[#fff8ea] px-3 py-2 text-sm font-semibold text-[#2d211c] transition hover:border-[#6a3ea1]/35 hover:bg-[#fff8ea] hover:text-[#6a3ea1]"
                    >
                      {pack.title}
                    </Link>
                  ))
                ) : (
                  receipt.evidencePackIds.map((pid) => (
                    <p key={pid} className="font-mono text-xs text-[#6f6258]">
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

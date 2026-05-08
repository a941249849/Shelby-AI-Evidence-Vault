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
import { getPersistedReceiptAction, getPersistedBlobAction } from '@/app/actions/persist';

interface ReadReceiptClientProps {
  id: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReceiptModeBadge({ mode }: { mode: ReadReceipt['receiptMode'] }) {
  if (mode === 'shelby-testnet') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fd8565]/50 bg-[#ffdcd9] px-3 py-1 text-xs font-semibold text-[#4f192a]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Shelby testnet
      </span>
    );
  }
  if (mode === 'local') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#de8aff]/25 bg-[#eee2ff] px-3 py-1 text-xs font-semibold text-[#470b64]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Local demo upload
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#161008]/15 bg-[#fcfaf8] px-3 py-1 text-xs font-semibold text-[#6f6258]">
      <Database className="h-3.5 w-3.5" />
      Demo data
    </span>
  );
}

function BlobDataSourceBadge({ blob }: { blob: BlobRecord }) {
  if (blob.dataSource === 'shelby-testnet') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#fd8565]/50 bg-[#ffdcd9] px-2 py-0.5 text-xs font-semibold text-[#4f192a]">
        Shelby testnet
      </span>
    );
  }
  if (blob.dataSource === 'local') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#de8aff]/25 bg-[#eee2ff] px-2 py-0.5 text-xs font-semibold text-[#470b64]">
        Local mock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-[#161008]/15 bg-[#fcfaf8] px-2 py-0.5 text-xs font-semibold text-[#6f6258]">
      Demo
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
    <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
        <Icon className="h-3.5 w-3.5 text-[#de8aff]" />
        {label}
      </div>
      <div className="break-all text-sm leading-6 text-[#161008]">{children}</div>
    </div>
  );
}

function MonoBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="block break-all rounded-md border border-[#161008]/15 bg-[#fcfaf8] px-3 py-2 font-mono text-xs text-[#161008]">
      {children}
    </code>
  );
}

function ResolvedBlobCard({ blob }: { blob: BlobRecord }) {
  return (
    <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-[#de8aff]" />
          <Link
            href={`/blob/${blob.id}`}
            className="font-mono text-xs font-semibold text-[#161008] transition hover:text-[#de8aff]"
          >
            {blob.id}
          </Link>
        </div>
        <BlobDataSourceBadge blob={blob} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6258]">
            Shelby ref
          </p>
          <MonoBlock>{blob.shelbyRef}</MonoBlock>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6258]">
            SHA-256 hash
          </p>
          <MonoBlock>{blob.hash}</MonoBlock>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6258]">
            Source
          </p>
          <p className="break-all text-xs text-[#161008]">{blob.source}</p>
        </div>

        {/* Real Shelby identity fields — only shown when present */}
        {(blob.accountAddress || blob.blobName || blob.network || blob.storageStatus) && (
          <div className="mt-3 grid gap-2 rounded-md border border-[#161008]/10 bg-[#fcfaf8] p-3 sm:grid-cols-2">
            {blob.accountAddress && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6258]">
                  Account address
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-[#161008]">
                  {blob.accountAddress}
                </p>
              </div>
            )}
            {blob.blobName && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6258]">
                  Blob name
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-[#161008]">{blob.blobName}</p>
              </div>
            )}
            {blob.network && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6258]">
                  Network
                </p>
                <span className="mt-0.5 inline-block rounded border border-[#9fe878]/25 bg-[#dfffcc] px-2 py-0.5 text-xs font-semibold text-[#21351a]">
                  {blob.network}
                </span>
              </div>
            )}
            {blob.storageStatus && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6258]">
                  Storage status
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#161008]">{blob.storageStatus}</p>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[#161008]/15 bg-[#fcfaf8] px-3 py-1 text-xs font-semibold text-[#6f6258] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
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
                className="rounded border border-[#161008]/15 bg-[#fcfaf8] px-2 py-0.5 font-mono text-xs text-[#161008]"
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
            (await getPersistedBlobAction(bid).catch(() => null));
          if (b) resolvedBlobs.push(b);
        }

        const resolvedPacks: EvidencePack[] = persistedReceipt.evidencePackIds
          .map((pid) => getLocalPackById(pid) ?? getEvidencePackById(pid))
          .filter(Boolean) as EvidencePack[];

        setResolved({
          receipt: persistedReceipt,
          blobs: resolvedBlobs,
          packs: resolvedPacks,
        });
      })
      .catch(() => {
        setResolved(null);
      });
  }, [id]);

  // Loading state — renders nothing until localStorage is checked
  if (resolved === undefined) {
    return null;
  }

  if (resolved === null) {
    return (
      <div className="ledger-line min-h-[calc(100vh-4rem)] bg-[#fcfaf8] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center shelby-cut bg-[#4f192a] text-[#9fe878]">
            <ReceiptText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#4f192a]">
            Read receipt not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6f6258]">
            No read receipt with ID{' '}
            <code className="rounded bg-[#fcfaf8] px-1 font-mono">{id}</code> exists in demo
            data or local storage.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 shelby-cut bg-[#4f192a] px-4 py-2.5 text-sm font-semibold text-[#fcfaf8] transition hover:bg-[#322312]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to index
          </Link>
        </div>
      </div>
    );
  }

  const { receipt, blobs: resolvedBlobs, packs: resolvedPacks } = resolved;

  return (
    <div className="ledger-line min-h-[calc(100vh-4rem)] bg-[#fcfaf8] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-1 rounded-full border border-[#161008]/15 bg-[#fcfaf8] px-3 py-1 text-xs font-semibold text-[#6f6258] transition hover:border-[#de8aff]/40 hover:text-[#de8aff]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#de8aff]/25 bg-[#eee2ff] px-3 py-1 text-xs font-semibold text-[#470b64]">
                  <ReceiptText className="h-3.5 w-3.5" />
                  AI read receipt
                </span>
                <ReceiptModeBadge mode={receipt.receiptMode} />
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#4f192a]">
                Answer provenance and evidence usage.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6258]">
                A compact receipt for one agent response: prompt, answer summary, run metadata,
                referenced blobs, and evidence packs.
              </p>
            </div>
            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                Receipt ID
              </p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-[#161008]">
                {receipt.id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#4f192a] text-[#9fe878]">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                    Query
                  </p>
                  <h2 className="text-lg font-semibold text-[#4f192a]">User question</h2>
                </div>
              </div>
              <p className="text-base leading-7 text-[#161008]">{receipt.query}</p>
            </div>

            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center shelby-cut bg-[#4f192a] text-[#ff77c9]">
                  <Braces className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                    Answer summary
                  </p>
                  <h2 className="text-lg font-semibold text-[#4f192a]">Generated response</h2>
                </div>
              </div>
              <p className="text-sm leading-7 text-[#161008]">{receipt.answerSummary}</p>
            </div>

            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6258]">
                <Fingerprint className="h-4 w-4 text-[#de8aff]" />
                Referenced blobs
                <span className="ml-auto rounded border border-[#161008]/15 bg-[#fcfaf8] px-2 py-0.5 text-xs font-semibold text-[#6f6258]">
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
                        className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 px-3 py-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
                          Blob
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#6f6258]">{bid}</p>
                        <p className="mt-1 text-xs text-[#6f6258]">Not found in local storage.</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {receipt.referencedBlobIds.map((blobId) => (
                    <Link
                      key={blobId}
                      href={`/blob/${blobId}`}
                      className="group shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 px-3 py-3 transition hover:border-[#de8aff]/40 hover:bg-[#fcfaf8]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
                        Blob
                      </p>
                      <p className="mt-1 truncate font-mono text-xs font-semibold text-[#161008] group-hover:text-[#de8aff]">
                        {blobId}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <Fact icon={Cpu} label="Run ID">
              <code className="font-mono text-xs">{receipt.runId}</code>
            </Fact>
            <Fact icon={CalendarClock} label="Timestamp">
              {formatDateTime(receipt.timestamp)}
            </Fact>
            <Fact icon={Braces} label="Agent version">
              <code className="font-mono text-xs">{receipt.agentVersion}</code>
            </Fact>
            <Fact icon={Hash} label="Receipt mode">
              <ReceiptModeBadge mode={receipt.receiptMode} />
            </Fact>
            <div className="shelby-cut border border-[#161008]/12 bg-[#fcfaf8]/90 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6258]">
                <Database className="h-3.5 w-3.5 text-[#de8aff]" />
                Evidence packs
              </div>
              <div className="space-y-2">
                {resolvedPacks.length > 0 ? (
                  resolvedPacks.map((pack) => (
                    <Link
                      key={pack.id}
                      href={`/dashboard?pack=${pack.id}`}
                      className="block rounded-md border border-[#161008]/15 bg-[#fcfaf8] px-3 py-2 text-sm font-semibold text-[#161008] transition hover:border-[#de8aff]/40 hover:bg-[#fcfaf8] hover:text-[#de8aff]"
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

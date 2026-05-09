'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Database, ExternalLink, ReceiptText, ShieldCheck } from 'lucide-react';
import { getPersistedBlobsAction, getPersistedReceiptsAction } from '@/app/actions/persist';
import { useLanguage } from '@/components/language-state';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { ReadReceipt } from '@/lib/demo-data/read-receipts';
import { getLocalBlobs, getLocalReadReceipts } from '@/lib/store/local-store';
import { formatDateTime } from '@/lib/utils';

const copy = {
  zh: {
    eyebrow: '当前测试网证明',
    emptyTitle: '还没有真实 Shelby 测试网记录',
    emptyBody: '连接钱包完成一次上传后，这里会显示最近的回执、Blob 身份、账号命名空间和检索入口。',
    title: '最近一次 Shelby testnet 上传已形成证明链路',
    body: '这条记录来自真实钱包上传路径，可继续进入 Blob 详情或读取回执检查账号、blobName、哈希和检索链接。',
    receipt: '读取回执',
    blob: 'Blob 详情',
    upload: '创建证据',
    source: '数据来源',
    account: '账号',
    blobName: 'blobName',
    status: '状态',
    opened: '查看',
    browser: '浏览器缓存',
    sqlite: 'SQLite 账本',
    mixed: '浏览器缓存 + SQLite',
  },
  en: {
    eyebrow: 'Current testnet proof',
    emptyTitle: 'No real Shelby testnet record yet',
    emptyBody: 'After one wallet upload, this panel shows the latest receipt, Blob identity, account namespace, and retrieval entry.',
    title: 'Latest Shelby testnet upload has a proof path',
    body: 'This record came from the real wallet upload path. Open the Blob or receipt to inspect account, blobName, hash, and retrieval links.',
    receipt: 'Read receipt',
    blob: 'Blob detail',
    upload: 'Create evidence',
    source: 'Data source',
    account: 'Account',
    blobName: 'blobName',
    status: 'Status',
    opened: 'Open',
    browser: 'browser cache',
    sqlite: 'SQLite ledger',
    mixed: 'browser cache + SQLite',
  },
};

interface ProofSummary {
  receipt: ReadReceipt | null;
  blobs: BlobRecord[];
  source: 'browser' | 'sqlite' | 'mixed';
}

function isTestnetReceipt(receipt: ReadReceipt): boolean {
  return receipt.receiptMode === 'shelby-testnet';
}

function isTestnetBlob(blob: BlobRecord): boolean {
  return blob.dataSource === 'shelby-testnet' || blob.uploadMode === 'testnet' || blob.network === 'testnet';
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

async function loadProofSummary(): Promise<ProofSummary> {
  const browserReceipts = getLocalReadReceipts();
  const browserBlobs = getLocalBlobs();

  try {
    const [persistedReceipts, persistedBlobs] = await Promise.all([
      getPersistedReceiptsAction(),
      getPersistedBlobsAction(),
    ]);
    const receipts = dedupeById([...browserReceipts, ...persistedReceipts])
      .filter(isTestnetReceipt)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const blobs = dedupeById([...browserBlobs, ...persistedBlobs])
      .filter(isTestnetBlob)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return {
      receipt: receipts[0] ?? null,
      blobs,
      source: browserReceipts.length || browserBlobs.length ? 'mixed' : 'sqlite',
    };
  } catch {
    const receipts = dedupeById(browserReceipts)
      .filter(isTestnetReceipt)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    return {
      receipt: receipts[0] ?? null,
      blobs: dedupeById(browserBlobs).filter(isTestnetBlob),
      source: 'browser',
    };
  }
}

function ProofField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#eadfd6] bg-white/55 px-3 py-2">
      <p className="font-mono text-[0.68rem] font-bold uppercase text-[#7b695d]">{label}</p>
      <p className="mt-1 truncate font-mono text-xs font-semibold text-[#2f1f12]">{value || '-'}</p>
    </div>
  );
}

export default function TestnetProofSummary({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const t = copy[language];
  const [summary, setSummary] = useState<ProofSummary>({ receipt: null, blobs: [], source: 'browser' });

  useEffect(() => {
    let cancelled = false;
    loadProofSummary().then((next) => {
      if (!cancelled) setSummary(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const linkedBlobs = useMemo(() => {
    if (!summary.receipt) return summary.blobs.slice(0, 1);
    const ids = new Set(summary.receipt.referencedBlobIds);
    const exact = summary.blobs.filter((blob) => ids.has(blob.id));
    return exact.length ? exact : summary.blobs.slice(0, 1);
  }, [summary]);

  const primaryBlob = linkedBlobs[0] ?? summary.blobs[0] ?? null;
  const sourceLabel =
    summary.source === 'mixed' ? t.mixed : summary.source === 'sqlite' ? t.sqlite : t.browser;

  if (!summary.receipt && !primaryBlob) {
    return (
      <section className={`testnet-proof-summary ${compact ? 'is-compact' : ''}`}>
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#fff2f9] text-[#de5cff]">
            <ShieldCheck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-bold uppercase text-[#ff4faf]">{t.eyebrow}</p>
            <h2 className="mt-2 text-xl font-black text-[#2f1f12]">{t.emptyTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6d5f55]">{t.emptyBody}</p>
          </div>
          <Link href="/upload" className="hidden rounded-full bg-[#2f1f12] px-4 py-2 text-sm font-black text-white transition hover:bg-[#ff5fb8] hover:text-[#2f1f12] sm:inline-flex">
            {t.upload}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`testnet-proof-summary ${compact ? 'is-compact' : ''}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#b7e7a6] bg-[#ecffe8] px-3 py-1.5 font-mono text-xs font-bold text-[#245f1b]">
            <CheckCircle2 size={14} />
            {t.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-black text-[#2f1f12]">{t.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d5f55]">{t.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.receipt && (
            <Link href={`/read-receipt/${summary.receipt.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#2f1f12] px-4 py-2 text-sm font-black text-white transition hover:bg-[#ff5fb8] hover:text-[#2f1f12]">
              <ReceiptText size={16} />
              {t.receipt}
              <ArrowRight size={15} />
            </Link>
          )}
          {primaryBlob && (
            <Link href={`/blob/${primaryBlob.id}`} className="inline-flex items-center gap-2 rounded-full border border-[#d8c7bb] bg-white/65 px-4 py-2 text-sm font-black text-[#2f1f12] transition hover:border-[#ff5fb8] hover:text-[#ff4faf]">
              <Database size={16} />
              {t.blob}
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ProofField label={t.source} value={sourceLabel} />
        <ProofField label={t.account} value={primaryBlob?.accountAddress} />
        <ProofField label={t.blobName} value={primaryBlob?.blobName} />
        <ProofField label={t.status} value={primaryBlob?.storageStatus ?? primaryBlob?.network} />
      </div>

      {primaryBlob?.explorerUrl && (
        <a
          href={primaryBlob.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#de5cff] hover:text-[#ff4faf]"
        >
          {t.opened}
          <ExternalLink size={14} />
        </a>
      )}

      {summary.receipt && (
        <p className="mt-4 font-mono text-xs text-[#7b695d]">
          {formatDateTime(summary.receipt.timestamp)}
        </p>
      )}
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import { formatBytes, formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/page-header';
import { getLocalBlobById, getLocalPackById } from '@/lib/store/local-store';
import { getBlobById, getEvidencePackById } from '@/lib/evidence/service';

interface BlobDetailClientProps {
  id: string;
}

function DataSourceBadge({ blob }: { blob: BlobRecord }) {
  if (blob.dataSource === 'local') {
    const label = blob.uploadMode === 'testnet' ? 'Real Shelby upload blocked until M2' : 'Local demo upload';
    const color =
      blob.uploadMode === 'testnet'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded border ${color}`}>{label}</span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">
      Demo data
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-40 flex-shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}

export default function BlobDetailClient({ id }: BlobDetailClientProps) {
  const [blob, setBlob] = useState<BlobRecord | null | undefined>(undefined);
  const [pack, setPack] = useState<EvidencePack | undefined>(undefined);

  useEffect(() => {
    // Check demo data first (synchronous), then localStorage (browser-only).
    // Reading localStorage must happen after hydration, hence useEffect.
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
    setBlob(null);
  }, [id]);

  if (blob === undefined) {
    // Still loading from localStorage
    return null;
  }

  if (blob === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Blob not found</h1>
        <p className="text-slate-500 text-sm mb-6">
          No blob with ID <code className="font-mono bg-slate-100 px-1 rounded">{id}</code> exists
          in demo data or local uploads.
        </p>
        <Link
          href="/dashboard"
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Dashboard
        </Link>
        {pack && (
          <>
            <span className="text-slate-300 mx-2">/</span>
            <Link
              href={`/dashboard?pack=${pack.id}`}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {pack.title}
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 mb-2">
        <PageHeader title="Blob Detail" subtitle={`Blob ID: ${blob.id}`} />
        <div className="pb-1">
          <DataSourceBadge blob={blob} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
        <Row label="Blob ID">
          <code className="font-mono text-sm text-slate-800">{blob.id}</code>
        </Row>
        <Row label={blob.dataSource === 'local' ? 'Mock Reference' : 'Demo Reference'}>
          <code className="font-mono text-sm text-indigo-700 break-all">{blob.shelbyRef}</code>
          {blob.dataSource !== 'local' && (
            <p className="text-xs text-slate-400 mt-1">
              Illustrative demo reference only — not a real Shelby blob identity. Real Shelby
              identity uses account namespace + blob name and requires M2 integration.
            </p>
          )}
          {blob.dataSource === 'local' && (
            <p className="text-xs text-slate-400 mt-1">
              Local demo reference only — not a real Shelby blob identity. Real Shelby identity
              uses account namespace + blob name (M2+).
            </p>
          )}
        </Row>
        <Row label="SHA-256 Hash">
          <code className="font-mono text-xs text-slate-600 break-all">{blob.hash}</code>
        </Row>
        <Row label="Source">
          <span className="text-sm text-slate-700 break-all">{blob.source}</span>
        </Row>
        <Row label="MIME Type">
          <code className="font-mono text-sm text-slate-700">{blob.mimeType}</code>
        </Row>
        <Row label="Size">
          <span className="text-sm text-slate-700">{formatBytes(blob.size)}</span>
        </Row>
        <Row label="Created At">
          <span className="text-sm text-slate-700">{formatDateTime(blob.createdAt)}</span>
        </Row>
        <Row label="Evidence Pack">
          {pack ? (
            <Link
              href={`/dashboard?pack=${pack.id}`}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {pack.title}
            </Link>
          ) : (
            <span className="text-sm text-slate-400">Unknown pack</span>
          )}
        </Row>
        <Row label="Tags">
          <div className="flex flex-wrap gap-1">
            {blob.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </Row>
        {blob.uploadMode && (
          <Row label="Upload Mode">
            <span className="text-sm text-slate-700 capitalize">{blob.uploadMode}</span>
          </Row>
        )}
        {blob.network && (
          <Row label="Network">
            <span className="text-sm text-slate-700">{blob.network}</span>
          </Row>
        )}
        {blob.blobName && (
          <Row label="Blob Name">
            <code className="font-mono text-sm text-slate-700">{blob.blobName}</code>
          </Row>
        )}
      </div>
    </div>
  );
}

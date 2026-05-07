'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlobRecord } from '@/lib/demo-data/blobs';
import type { EvidencePack } from '@/lib/demo-data/evidence-packs';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { getLocalBlobById, getLocalPackById } from '@/lib/store/local-store';
import { getBlobById, getEvidencePackById } from '@/lib/evidence/service';

interface BlobDetailClientProps {
  id: string;
}

function SourceBadge({ blob }: { blob: BlobRecord }) {
  if (blob.dataSource === 'local') {
    const isTestnet = blob.uploadMode === 'testnet';
    return (
      <span
        className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
          isTestnet
            ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
            : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
        }`}
      >
        {isTestnet ? 'blocked · M2' : 'local upload'}
      </span>
    );
  }
  return (
    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
      demo data
    </span>
  );
}

function Field({
  label,
  children,
  mono = false,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 border-b border-slate-800/60 last:border-0">
      <dt className="text-xs font-mono font-semibold text-slate-600 uppercase tracking-widest w-36 flex-shrink-0 pt-1">
        {label}
      </dt>
      <dd className={`flex-1 ${mono ? 'font-mono' : ''} ${accent ?? 'text-slate-300'} text-sm break-all`}>
        {children}
      </dd>
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
    return null;
  }

  if (blob === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-3xl mb-4 font-mono text-slate-600">404</p>
        <h1 className="text-lg font-bold text-white mb-2">Blob not found</h1>
        <p className="text-slate-400 text-sm mb-6">
          No blob with ID{' '}
          <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">{id}</code>{' '}
          exists in demo data or local uploads.
        </p>
        <Link
          href="/dashboard"
          className="text-violet-400 hover:text-violet-300 font-medium text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isDemo = blob.dataSource !== 'local';
  const refLabel = isDemo ? 'Demo Reference' : 'Mock Reference';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-xs font-mono text-slate-600">
        <Link href="/dashboard" className="hover:text-slate-400 transition-colors">
          vault
        </Link>
        {pack && (
          <>
            <span>/</span>
            <Link
              href={`/dashboard?pack=${pack.id}`}
              className="hover:text-slate-400 transition-colors truncate max-w-xs"
            >
              {pack.title}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-500 truncate max-w-xs">{blob.id}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-white tracking-tight">Blob Receipt</h1>
            <SourceBadge blob={blob} />
          </div>
          <p className="text-xs font-mono text-slate-500">{blob.id}</p>
        </div>
      </div>

      {/* Evidence fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
            Blob record · {isDemo ? 'demo' : 'local upload'}
          </span>
        </div>

        <dl>
          <Field label="Blob ID" mono accent="text-slate-300">
            {blob.id}
          </Field>

          <Field label={refLabel} mono accent={isDemo ? 'text-slate-400' : 'text-violet-400'}>
            {blob.shelbyRef}
            <p className="text-xs text-slate-600 mt-1 font-sans">
              {isDemo
                ? 'Illustrative demo reference only — not a real Shelby blob identity. Real Shelby identity uses account namespace + blob name (M2+).'
                : 'Local demo reference only — not a real Shelby blob identity. Real Shelby identity uses account namespace + blob name (M2+).'}
            </p>
          </Field>

          <Field label="SHA-256" mono accent="text-cyan-400">
            {blob.hash}
          </Field>

          <Field label="Source">
            {blob.source}
          </Field>

          <Field label="MIME Type" mono>
            {blob.mimeType}
          </Field>

          <Field label="Size">
            {formatBytes(blob.size)}
          </Field>

          <Field label="Created">
            {formatDateTime(blob.createdAt)}
          </Field>

          <Field label="Evidence Pack">
            {pack ? (
              <Link
                href={`/dashboard?pack=${pack.id}`}
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                {pack.title}
              </Link>
            ) : (
              <span className="text-slate-600">Unknown pack</span>
            )}
          </Field>

          {blob.tags.length > 0 && (
            <Field label="Tags">
              <div className="flex flex-wrap gap-1">
                {blob.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Field>
          )}

          {blob.uploadMode && (
            <Field label="Upload Mode" mono>
              <span className="text-slate-400">{blob.uploadMode}</span>
            </Field>
          )}

          {blob.network && (
            <Field label="Network" mono>
              <span className="text-slate-400">{blob.network}</span>
            </Field>
          )}

          {blob.blobName && (
            <Field label="Blob Name" mono>
              {blob.blobName}
            </Field>
          )}
        </dl>
      </div>

      <div className="mt-6">
        <Link
          href="/dashboard"
          className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors"
        >
          ← back to vault
        </Link>
      </div>
    </div>
  );
}

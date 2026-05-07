import Link from 'next/link';
import { getReadReceiptById, getEvidencePackById } from '@/lib/evidence/service';
import { formatDateTime } from '@/lib/utils';

interface ReadReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReadReceiptPage({ params }: ReadReceiptPageProps) {
  const { id } = await params;
  const receipt = getReadReceiptById(id);

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-3xl font-mono text-slate-600 mb-4">404</p>
        <h1 className="text-lg font-bold text-white mb-2">Read receipt not found</h1>
        <p className="text-slate-400 text-sm mb-6">
          No read receipt with ID{' '}
          <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400">{id}</code>{' '}
          exists in the demo data.
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

  const packs = receipt.evidencePackIds
    .map((pid) => getEvidencePackById(pid))
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-xs font-mono text-slate-600">
        <Link href="/dashboard" className="hover:text-slate-400 transition-colors">
          vault
        </Link>
        <span>/</span>
        <span className="text-slate-500">read-receipt</span>
        <span>/</span>
        <span className="text-slate-500 truncate max-w-xs">{receipt.id}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg font-bold text-white tracking-tight">Read Receipt</h1>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
            agent run
          </span>
        </div>
        <p className="text-xs font-mono text-slate-500">{receipt.id}</p>
      </div>

      {/* Query */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-4">
        <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Query
        </p>
        <p className="text-sm text-slate-200 leading-relaxed">{receipt.query}</p>
      </div>

      {/* Answer summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6">
        <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Answer Summary
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{receipt.answerSummary}</p>
      </div>

      {/* Metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mb-6">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            Run metadata
          </span>
        </div>
        <dl>
          <Row label="Run ID">
            <code className="font-mono text-sm text-slate-300">{receipt.runId}</code>
          </Row>
          <Row label="Timestamp">
            <span className="text-sm text-slate-300">{formatDateTime(receipt.timestamp)}</span>
          </Row>
          <Row label="Agent Version">
            <code className="font-mono text-sm text-slate-400">{receipt.agentVersion}</code>
          </Row>
          <Row label="Referenced Blobs">
            <div className="flex flex-wrap gap-2">
              {receipt.referencedBlobIds.map((blobId) => (
                <Link
                  key={blobId}
                  href={`/blob/${blobId}`}
                  className="font-mono text-xs text-cyan-400 hover:text-cyan-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded transition-colors"
                >
                  {blobId}
                </Link>
              ))}
            </div>
          </Row>
          <Row label="Evidence Packs">
            <div className="flex flex-col gap-1">
              {packs.map(
                (pack) =>
                  pack && (
                    <Link
                      key={pack.id}
                      href={`/dashboard?pack=${pack.id}`}
                      className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                      {pack.title}
                    </Link>
                  )
              )}
            </div>
          </Row>
        </dl>
      </div>

      <Link
        href="/dashboard"
        className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors"
      >
        ← back to vault
      </Link>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 border-b border-slate-800/60 last:border-0">
      <dt className="text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-widest w-36 flex-shrink-0 pt-1">
        {label}
      </dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}

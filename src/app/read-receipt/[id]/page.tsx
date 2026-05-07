import Link from 'next/link';
import { getReadReceiptById, getEvidencePackById } from '@/lib/evidence/service';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/page-header';

interface ReadReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReadReceiptPage({ params }: ReadReceiptPageProps) {
  const { id } = await params;
  const receipt = getReadReceiptById(id);

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🧾</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Read receipt not found</h1>
        <p className="text-slate-500 text-sm mb-6">
          No read receipt with ID{' '}
          <code className="font-mono bg-slate-100 px-1 rounded">{id}</code> exists in the demo
          data.
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

  const packs = receipt.evidencePackIds
    .map((pid) => getEvidencePackById(pid))
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <PageHeader title="Read Receipt" subtitle={`Receipt ID: ${receipt.id}`} />

      {/* Query */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Query</p>
        <p className="text-base text-slate-900 leading-relaxed">{receipt.query}</p>
      </div>

      {/* Answer summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Answer Summary
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{receipt.answerSummary}</p>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100 mb-6">
        <Row label="Run ID">
          <code className="font-mono text-sm text-slate-800">{receipt.runId}</code>
        </Row>
        <Row label="Timestamp">
          <span className="text-sm text-slate-700">{formatDateTime(receipt.timestamp)}</span>
        </Row>
        <Row label="Agent Version">
          <code className="font-mono text-sm text-slate-700">{receipt.agentVersion}</code>
        </Row>
        <Row label="Referenced Blobs">
          <div className="flex flex-wrap gap-2">
            {receipt.referencedBlobIds.map((blobId) => (
              <Link
                key={blobId}
                href={`/blob/${blobId}`}
                className="font-mono text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded transition-colors"
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
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    {pack.title}
                  </Link>
                )
            )}
          </div>
        </Row>
      </div>
    </div>
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

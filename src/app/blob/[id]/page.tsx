import Link from 'next/link';
import { getBlobById, getEvidencePackById } from '@/lib/evidence/service';
import PageHeader from '@/components/page-header';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

interface BlobPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlobPage({ params }: BlobPageProps) {
  const { id } = await params;
  const blob = getBlobById(id);

  if (!blob) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Blob not found</h1>
        <p className="text-slate-500 text-sm mb-6">
          No blob with ID <code className="font-mono bg-slate-100 px-1 rounded">{id}</code> exists
          in the demo data.
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

  const pack = getEvidencePackById(blob.evidencePackId);

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

      <PageHeader title="Blob Detail" subtitle={`Blob ID: ${blob.id}`} />

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
        <Row label="Blob ID">
          <code className="font-mono text-sm text-slate-800">{blob.id}</code>
        </Row>
        <Row label="Shelby Reference">
          <code className="font-mono text-sm text-indigo-700 break-all">{blob.shelbyRef}</code>
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
          <span className="text-sm text-slate-700">{formatDate(blob.createdAt)}</span>
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

import Link from 'next/link';
import type { EvidencePack } from '@/lib/evidence/types';
import Badge from './badge';
import StatusBadge from './status-badge';

interface EvidencePackCardProps {
  pack: EvidencePack;
}

const categoryVariantMap: Record<
  EvidencePack['category'],
  'info' | 'default' | 'warning' | 'error' | 'success'
> = {
  dataset: 'info',
  'agent-run': 'success',
  document: 'default',
  manifest: 'warning',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function EvidencePackCard({ pack }: EvidencePackCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            {pack.title}
          </h3>
          <StatusBadge status={pack.status} />
        </div>

        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{pack.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge label={pack.category} variant={categoryVariantMap[pack.category]} />
          <Badge label={pack.sourceType} variant="default" />
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {pack.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-slate-400">Blobs</dt>
          <dd className="text-slate-700 font-medium">{pack.blobCount}</dd>
          <dt className="text-slate-400">Created</dt>
          <dd className="text-slate-700">{formatDate(pack.createdAt)}</dd>
        </dl>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-lg">
        <Link
          href={`/dashboard?pack=${pack.id}`}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          View blobs →
        </Link>
      </div>
    </div>
  );
}

export { formatBytes, formatDate };

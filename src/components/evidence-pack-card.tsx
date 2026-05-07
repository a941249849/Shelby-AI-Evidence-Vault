import Link from 'next/link';
import type { EvidencePack } from '@/lib/evidence/types';
import { formatDate } from '@/lib/utils';
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

export default function EvidencePackCard({ pack }: EvidencePackCardProps) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex flex-col group">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
            {pack.title}
          </h3>
          <StatusBadge status={pack.status} />
        </div>

        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{pack.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge label={pack.category} variant={categoryVariantMap[pack.category]} />
          <Badge label={pack.sourceType} variant="default" />
        </div>

        {pack.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pack.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/60 px-1.5 py-0.5 rounded font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-slate-800 pt-4">
          <dt className="text-slate-600 font-mono uppercase tracking-wider text-xs">Blobs</dt>
          <dd className="text-slate-300 font-medium tabular-nums">{pack.blobCount}</dd>
          <dt className="text-slate-600 font-mono uppercase tracking-wider text-xs">Created</dt>
          <dd className="text-slate-400">{formatDate(pack.createdAt)}</dd>
        </dl>
      </div>

      <div className="px-5 py-3 border-t border-slate-800 rounded-b-lg">
        <Link
          href={`/dashboard?pack=${pack.id}`}
          className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Inspect blobs →
        </Link>
      </div>
    </div>
  );
}

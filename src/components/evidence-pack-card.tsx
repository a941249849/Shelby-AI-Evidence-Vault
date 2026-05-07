import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, Boxes, CalendarDays, Database, FileText, Workflow } from 'lucide-react';
import type { EvidencePack } from '@/lib/evidence/types';
import { formatDate } from '@/lib/utils';

interface EvidencePackCardProps {
  pack: EvidencePack;
}

const categoryStyles: Record<EvidencePack['category'], { label: string; color: string; icon: ReactNode }> = {
  dataset: {
    label: 'Dataset',
    color: 'border-[#9fe878]/40 bg-[#9fe878]/10 text-[#21351a]',
    icon: <Database size={14} />,
  },
  'agent-run': {
    label: 'Agent run',
    color: 'border-[#ff77c9]/40 bg-[#ff77c9]/10 text-[#21351a]',
    icon: <Workflow size={14} />,
  },
  document: {
    label: 'Document',
    color: 'border-[#de8aff]/35 bg-[#de8aff]/10 text-[#470b64]',
    icon: <FileText size={14} />,
  },
  manifest: {
    label: 'Manifest',
    color: 'border-[#fd8565]/45 bg-[#fd8565]/15 text-[#4f192a]',
    icon: <Boxes size={14} />,
  },
};

export default function EvidencePackCard({ pack }: EvidencePackCardProps) {
  const category = categoryStyles[pack.category];
  const isLocal = pack.dataSource === 'local';

  return (
    <article className="shelby-cut group relative overflow-hidden border border-[#161008]/12 bg-[#fcfaf8]/90 shadow-[0_18px_50px_rgba(22,16,8,0.06)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(22,16,8,0.1)]">
      <div className="absolute right-0 top-0 h-10 w-10 bg-[#ffdcd9]" />
      <div className="absolute inset-y-0 left-0 w-1 bg-[#9fe878]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${category.color}`}>
            {category.icon}
            {category.label}
          </span>
          <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
            isLocal
              ? 'border-[#ff77c9]/40 bg-[#ff77c9]/10 text-[#21351a]'
              : 'border-[#161008]/15 bg-[#ffdcd9] text-[#6f6258]'
          }`}>
            {isLocal ? 'Local' : 'Demo'}
          </span>
        </div>

        <h3 className="mt-4 text-base font-semibold leading-snug text-[#161008] line-clamp-2">
          {pack.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6f6258] line-clamp-2">
          {pack.description}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-[#161008]/10 py-3 text-xs">
          <div>
            <dt className="font-mono uppercase tracking-[0.14em] text-[#8A94A6]">Blobs</dt>
            <dd className="mt-1 font-semibold text-[#161008]">{pack.blobCount}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase tracking-[0.14em] text-[#8A94A6]">Source</dt>
            <dd className="mt-1 truncate font-semibold text-[#161008]">{pack.sourceType}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase tracking-[0.14em] text-[#8A94A6]">Created</dt>
            <dd className="mt-1 flex items-center gap-1 font-semibold text-[#161008]">
              <CalendarDays size={12} />
              {formatDate(pack.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {pack.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded border border-[#161008]/10 bg-[#fcfaf8]/60 px-2 py-1 font-mono text-xs text-[#6f6258]"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={`/dashboard?pack=${pack.id}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#470b64] transition-colors group-hover:text-[#de8aff]"
        >
          Inspect evidence
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

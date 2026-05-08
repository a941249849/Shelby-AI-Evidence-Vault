import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, Boxes, CalendarDays, Database, FileText, Workflow } from 'lucide-react';
import type { EvidencePack } from '@/lib/evidence/types';
import { formatDate } from '@/lib/utils';

interface EvidencePackCardProps {
  pack: EvidencePack;
}

const categoryStyles: Record<
  EvidencePack['category'],
  { label: string; color: string; rail: string; icon: ReactNode }
> = {
  dataset: {
    label: 'Dataset',
    color: 'border-[#9fe878]/40 bg-[#9fe878]/10 text-[#9fe878]',
    rail: 'bg-[#9fe878]',
    icon: <Database size={14} />,
  },
  'agent-run': {
    label: 'Agent run',
    color: 'border-[#ff77c9]/42 bg-[#ff77c9]/10 text-[#ffb1df]',
    rail: 'bg-[#ff77c9]',
    icon: <Workflow size={14} />,
  },
  document: {
    label: 'Document',
    color: 'border-[#de8aff]/38 bg-[#de8aff]/10 text-[#e7b6ff]',
    rail: 'bg-[#de8aff]',
    icon: <FileText size={14} />,
  },
  manifest: {
    label: 'Manifest',
    color: 'border-[#fd8565]/45 bg-[#fd8565]/12 text-[#ffc2ad]',
    rail: 'bg-[#fd8565]',
    icon: <Boxes size={14} />,
  },
};

export default function EvidencePackCard({ pack }: EvidencePackCardProps) {
  const category = categoryStyles[pack.category];
  const isLocal = pack.dataSource === 'local';

  return (
    <article className="shelby-cut group relative overflow-hidden border border-white/10 bg-[#15161c] transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-[#1b1d25]">
      <div className={`absolute inset-y-0 left-0 w-1 ${category.rail}`} />
      <div className="data-rail h-8 border-b border-white/10" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-semibold uppercase ${category.color}`}
          >
            {category.icon}
            {category.label}
          </span>
          <span
            className={`border px-2 py-1 font-mono text-xs font-semibold uppercase ${
              isLocal
                ? 'border-[#9fe878]/35 bg-[#9fe878]/10 text-[#9fe878]'
                : 'border-white/12 bg-white/[0.055] text-[#9d9a92]'
            }`}
          >
            {isLocal ? 'Local' : 'Demo'}
          </span>
        </div>

        <h3 className="mt-5 text-base font-semibold leading-snug text-[#f4f0e8] line-clamp-2">
          {pack.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#9d9a92] line-clamp-2">
          {pack.description}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-white/10 py-3 text-xs">
          <div>
            <dt className="font-mono uppercase text-[#6f716d]">Blobs</dt>
            <dd className="mt-1 font-semibold text-[#f4f0e8]">{pack.blobCount}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase text-[#6f716d]">Source</dt>
            <dd className="mt-1 truncate font-semibold text-[#f4f0e8]">{pack.sourceType}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase text-[#6f716d]">Created</dt>
            <dd className="mt-1 flex items-center gap-1 font-semibold text-[#f4f0e8]">
              <CalendarDays size={12} />
              {formatDate(pack.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {pack.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs text-[#9d9a92]"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={`/dashboard?pack=${pack.id}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#9fe878] transition group-hover:text-[#de8aff]"
        >
          Inspect evidence
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

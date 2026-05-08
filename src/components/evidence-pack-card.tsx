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
    color: 'border-[#157a4c]/25 bg-[#dff2c8] text-[#157a4c]',
    rail: 'bg-[#157a4c]',
    icon: <Database size={14} />,
  },
  'agent-run': {
    label: 'Agent run',
    color: 'border-[#d94f83]/25 bg-[#ffd8e6] text-[#9f315f]',
    rail: 'bg-[#d94f83]',
    icon: <Workflow size={14} />,
  },
  document: {
    label: 'Document',
    color: 'border-[#6a3ea1]/25 bg-[#efe2ff] text-[#6a3ea1]',
    rail: 'bg-[#6a3ea1]',
    icon: <FileText size={14} />,
  },
  manifest: {
    label: 'Manifest',
    color: 'border-[#ef6f4d]/25 bg-[#ffe0cf] text-[#a33f2d]',
    rail: 'bg-[#ef6f4d]',
    icon: <Boxes size={14} />,
  },
};

export default function EvidencePackCard({ pack }: EvidencePackCardProps) {
  const category = categoryStyles[pack.category];
  const isLocal = pack.dataSource === 'local';

  return (
    <article className="shelby-cut group relative overflow-hidden border border-[#2d211c]/12 bg-[#fff8ea] shadow-[0_18px_45px_rgba(80,48,24,0.11)] transition hover:-translate-y-0.5 hover:border-[#2d211c]/22 hover:shadow-[0_24px_60px_rgba(80,48,24,0.16)]">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${category.rail}`} />
      <div className="data-rail h-8 border-b border-[#2d211c]/10 bg-[#fff1cf]" />
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
                ? 'border-[#157a4c]/25 bg-[#dff2c8] text-[#157a4c]'
                : 'border-[#2d211c]/12 bg-[#f4efe2] text-[#6f6258]'
            }`}
          >
            {isLocal ? 'Local' : 'Demo'}
          </span>
        </div>

        <h3 className="mt-5 text-base font-semibold leading-snug text-[#2d211c] line-clamp-2">
          {pack.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6f6258] line-clamp-2">
          {pack.description}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-[#2d211c]/10 py-3 text-xs">
          <div>
            <dt className="font-mono uppercase text-[#978978]">Blobs</dt>
            <dd className="mt-1 font-semibold text-[#2d211c]">{pack.blobCount}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase text-[#978978]">Source</dt>
            <dd className="mt-1 truncate font-semibold text-[#2d211c]">{pack.sourceType}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase text-[#978978]">Created</dt>
            <dd className="mt-1 flex items-center gap-1 font-semibold text-[#2d211c]">
              <CalendarDays size={12} />
              {formatDate(pack.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {pack.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#2d211c]/10 bg-[#f4efe2] px-2 py-1 font-mono text-xs text-[#6f6258]"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={`/dashboard?pack=${pack.id}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#157a4c] transition group-hover:text-[#6a3ea1]"
        >
          Inspect evidence
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Archive,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Workflow,
} from 'lucide-react';
import type { EvidencePack } from '@/lib/evidence/types';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/language-state';

interface EvidencePackCardProps {
  pack: EvidencePack;
  primaryBlobId?: string;
}

const categoryStyles: Record<
  EvidencePack['category'],
  { label: { zh: string; en: string }; color: string; rail: string; icon: ReactNode }
> = {
  dataset: {
    label: { zh: '数据集', en: 'Dataset' },
    color: 'border-[#9fe878]/40 bg-[#9fe878]/10 text-[#9fe878]',
    rail: 'bg-[#9fe878]',
    icon: <Database size={14} />,
  },
  'agent-run': {
    label: { zh: 'Agent 运行', en: 'Agent run' },
    color: 'border-[#ff77c9]/42 bg-[#ff77c9]/10 text-[#ffb1df]',
    rail: 'bg-[#ff77c9]',
    icon: <Workflow size={14} />,
  },
  document: {
    label: { zh: '文档', en: 'Document' },
    color: 'border-[#de8aff]/38 bg-[#de8aff]/10 text-[#e7b6ff]',
    rail: 'bg-[#de8aff]',
    icon: <FileText size={14} />,
  },
  manifest: {
    label: { zh: '清单', en: 'Manifest' },
    color: 'border-[#fd8565]/45 bg-[#fd8565]/12 text-[#ffc2ad]',
    rail: 'bg-[#fd8565]',
    icon: <Boxes size={14} />,
  },
};

const statusStyles: Record<
  EvidencePack['status'],
  { label: { zh: string; en: string }; color: string; icon: ReactNode }
> = {
  active: {
    label: { zh: '可验证', en: 'Verifiable' },
    color: 'border-[#9fe878]/40 bg-[#9fe878]/10 text-[#9fe878]',
    icon: <CheckCircle2 size={13} />,
  },
  archived: {
    label: { zh: '已归档', en: 'Archived' },
    color: 'border-white/12 bg-white/[0.055] text-[#c7c1b8]',
    icon: <Archive size={13} />,
  },
  pending: {
    label: { zh: '待检查', en: 'Pending' },
    color: 'border-[#fd8565]/45 bg-[#fd8565]/12 text-[#ffc2ad]',
    icon: <Clock3 size={13} />,
  },
};

const sourceLabels: Record<EvidencePack['sourceType'], { zh: string; en: string }> = {
  'web-scrape': { zh: '网页抓取', en: 'Web scrape' },
  'api-export': { zh: 'API 导出', en: 'API export' },
  'agent-output': { zh: 'Agent 输出', en: 'Agent output' },
  'manual-upload': { zh: '手动上传', en: 'Manual upload' },
};

export default function EvidencePackCard({ pack, primaryBlobId }: EvidencePackCardProps) {
  const { language } = useLanguage();
  const category = categoryStyles[pack.category];
  const status = statusStyles[pack.status];
  const isLocal = pack.dataSource === 'local';
  const detailHref = primaryBlobId ? `/blob/${primaryBlobId}` : `/dashboard?pack=${pack.id}`;

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
            {category.label[language]}
          </span>
          <span
            className={`border px-2 py-1 font-mono text-xs font-semibold uppercase ${
              isLocal
                ? 'border-[#9fe878]/35 bg-[#9fe878]/10 text-[#9fe878]'
                : 'border-white/12 bg-white/[0.055] text-[#9d9a92]'
            }`}
          >
            {isLocal
              ? language === 'zh'
                ? '本地 / SQLite'
                : 'Local / SQLite'
              : language === 'zh'
                ? 'Demo 语料'
                : 'Demo corpus'}
          </span>
        </div>

        <div
          className={`mt-4 inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-semibold uppercase ${status.color}`}
        >
          {status.icon}
          {status.label[language]}
        </div>

        <h3 className="mt-5 text-base font-semibold leading-snug text-[#f4f0e8] line-clamp-2">
          {pack.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#9d9a92] line-clamp-2">
          {pack.description}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-white/10 py-3 text-xs">
          <div>
            <dt className="font-mono uppercase text-[#6f716d]">
              {language === 'zh' ? 'Blob' : 'Blobs'}
            </dt>
            <dd className="mt-1 font-semibold text-[#f4f0e8]">{pack.blobCount}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase text-[#6f716d]">
              {language === 'zh' ? '来源' : 'Source'}
            </dt>
            <dd className="mt-1 truncate font-semibold text-[#f4f0e8]">
              {sourceLabels[pack.sourceType][language]}
            </dd>
          </div>
          <div>
            <dt className="font-mono uppercase text-[#6f716d]">
              {language === 'zh' ? '创建' : 'Created'}
            </dt>
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
          href={detailHref}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#9fe878] transition group-hover:text-[#de8aff]"
        >
          {primaryBlobId
            ? language === 'zh'
              ? '检查首个 Blob'
              : 'Inspect first blob'
            : language === 'zh'
              ? '查看证据包'
              : 'View evidence pack'}
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
